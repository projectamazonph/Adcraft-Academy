# AdCraft API Reference

> Server Actions and shared types for the AdCraft MVP. All actions follow the `ActionResult<T>` pattern. See [`architecture.md`](./architecture.md) for the Hybrid Execution Model and type-safety rules.

---

## Critical Rule: 'use server' Files

Next.js 16 enforces that files with `'use server'` can **only export async functions**. Exporting types, interfaces, constants, or any non-function value causes "Invalid Server Actions request" at runtime. All shared types live in `actions/types.ts` (no `'use server'` directive). Every new Server Action file must follow this pattern:

```typescript
// actions/types.ts — types only, NO 'use server'
export interface MyInput { ... }
export type ActionResult<T> = ...

// actions/my-action.ts — 'use server', async functions only
'use server'
import type { MyInput, ActionResult } from './types'
export async function doSomething(input: MyInput): Promise<ActionResult<...>> { ... }
```

---

## Shared Types (`actions/types.ts`)

| Type | Kind | Description |
|------|------|-------------|
| `LessonMeta` | Interface | Lesson metadata: title, slug, moduleNumber, lessonNumber, type, estimatedMinutes, xpReward |
| `LessonContent` | Interface | Lesson with meta + markdown body: `{ meta: LessonMeta; body: string }` |
| `ActionResult<T>` | Type Union | Result pattern: `{ success: true; data: T } \| { success: false; error: string; code: string }` |
| `StartAttemptInput` | Interface | Input for starting an attempt: userId, simulationType, simulationSlug |
| `StartAttemptOutput` | Interface | Output on start: attemptId, attemptNumber |
| `GradeStrTriageInput` | Interface | STR grading input: attemptId, previewScore, searchTerms, userActions, expectedActions, context, timeSpentSeconds |
| `GradeBidElevatorInput` | Interface | Bid grading input: attemptId, previewScore, scenarios, decisions, context, timeSpentSeconds |
| `GradeCampaignBuilderInput` | Interface | Campaign grading input: attemptId, previewScore, campaign, evaluation, timeSpentSeconds |
| `GradeAttemptOutput` | Interface | Grading result: attemptId, officialScore, previewScore, scoreDiscrepancy, xpEarned, evaluation |
| `AttemptHistoryItem` | Interface | History entry: id, attemptNumber, previewScore, officialScore, scoreDiscrepancy, status, timeSpentSeconds, timestamps |
| `UserStatsOutput` | Interface | User statistics: userId, xp, level, totalAttempts, bestScores (per simulation type) |

The `ActionResult<T>` union is the universal return type for all Server Actions. Consumers must check `success` before accessing `data`. Error responses include a machine-readable `code` (e.g., `'START_FAILED'`, `'GRADE_FAILED'`, `'USER_NOT_FOUND'`) and a human-readable `error` message.

---

## Lesson Actions (`actions/lesson.ts`)

Two Server Actions read MDX lesson files from the `content/modules/` directory. They parse YAML-like frontmatter and return structured lesson data for the `LessonPlayer` component.

### `listModuleLessons(moduleNumber: number)`

Lists all lessons for a given module, sorted by lesson number. Scans the module directory (e.g., `content/modules/1-foundations/`), reads each `.mdx` file's frontmatter, and returns an array of `LessonMeta` objects.

**Returns:** `ActionResult<LessonMeta[]>` — array of lesson metadata on success, or error if the module directory is not found. Empty modules return an empty array rather than an error.

### `getLessonContent(moduleNumber: number, lessonOrder: number)`

Fetches the full content of a specific lesson. Locates the file using the naming convention `{moduleNumber}.{lessonOrder}-{title}.mdx` (e.g., `0.1-welcome.mdx`, `1.3-acos-tacos-profitability.mdx`). Parses frontmatter into `LessonMeta` and returns the remaining markdown as the `body` string.

**Returns:** `ActionResult<LessonContent>` — lesson metadata + markdown body on success. Errors include module-not-found and lesson-not-found cases with descriptive messages.

**File lookup convention:** Lesson files are named `{moduleNumber}.{lessonOrder}-{title}.mdx`. The lookup uses prefix matching on `{moduleNumber}.{lessonOrder}` to find the correct file, so the title portion of the filename does not need to be known in advance.

---

## Simulation Actions (`actions/simulation.ts`)

Six Server Actions implement the server-side half of the Hybrid Execution Model. They handle attempt lifecycle (create → grade → history) and user statistics. All grading actions run the *same* engine functions that the client uses for preview scoring, ensuring deterministic integrity.

### `startAttempt(input: StartAttemptInput)`

Creates a new `SimulationAttempt` record in the database with status `IN_PROGRESS`. Auto-creates the `Simulation` and `User` records if they don't exist (for MVP convenience). The `attemptNumber` is auto-incremented per user/simulation pair.

**Parameters:** `userId` (falls back to `mvp-user-001`), `simulationType` (`'STR_TRIAGE_ARENA' | 'BID_ELEVATOR' | 'CAMPAIGN_BUILDER'`), `simulationSlug`.

**Returns:** `ActionResult<StartAttemptOutput>` — the new attempt's `attemptId` (UUID) and `attemptNumber`.

### `gradeStrTriageAttempt(input: GradeStrTriageInput)`

Runs `evaluateStrTriage()` from the engine on the server using the same search terms, user actions, expected actions, and context that the client used. Computes the official score, compares it against the preview score, persists the result with a `scoreDiscrepancy` flag if they differ, and awards XP (`score × 2`, max 200).

**Returns:** `ActionResult<GradeAttemptOutput>` — officialScore, scoreDiscrepancy, xpEarned, and the full `StrTriageEvaluation` object.

### `gradeBidElevatorAttempt(input: GradeBidElevatorInput)`

Runs `evaluateBidElevator()` from the engine on the server. Same hybrid pattern as STR Triage: server evaluation is authoritative, XP is `score × 2`, discrepancy is flagged. Persists scenarios and decisions as JSONB in the `state` field.

**Returns:** `ActionResult<GradeAttemptOutput>` — officialScore, scoreDiscrepancy, xpEarned, and the full `BidElevatorEvaluation` object.

### `gradeCampaignBuilderAttempt(input: GradeCampaignBuilderInput)`

Handles Campaign Builder grading differently from the other two simulations. Because the Campaign Builder evaluation uses function-valued criteria (`CampaignBuilderCriteria.evaluate` is a function, not serializable), the full evaluation runs client-side in the Zustand store. The server action receives the client's evaluation result, runs `previewCampaignBuilderScore()` as a verification check (tolerance: 10 points), and persists the client's score as official. If the verification score diverges by more than 10 points, `scoreDiscrepancy` is flagged.

**Returns:** `ActionResult<GradeAttemptOutput>` — the client-computed officialScore, verification-based scoreDiscrepancy, xpEarned, and the client's evaluation object.

### `getAttemptHistory(simulationType: string, userId?: string)`

Retrieves the last 20 graded attempts for a user/simulation combination. Returns an array of `AttemptHistoryItem` objects sorted by attempt number descending. If the simulation record doesn't exist, returns an empty array rather than an error.

**Returns:** `ActionResult<AttemptHistoryItem[]>`

### `getUserStats(userId?: string)`

Computes aggregate user statistics: total XP, current level (level-up every 500 XP), total graded attempts, and best official score per simulation type. Queries all graded `SimulationAttempt` records for the user.

**Returns:** `ActionResult<UserStatsOutput>` — userId, xp, level, totalAttempts, bestScores map.

---

## Streaming API Route (`/api/mentor/stream`)

Unlike the Server Actions above, the AI Mentor streaming endpoint is a standard Next.js API route (not a Server Action). Server Actions cannot stream responses, so this route uses Server-Sent Events (SSE) to deliver tokens in real-time as the LLM generates them.

### `POST /api/mentor/stream`

Sends a user message to the PPC Mentor LLM and streams the response back token-by-token via SSE. Uses `z-ai-web-dev-sdk` with `stream: true`.

**Request Body:**
```typescript
{
  message: string;          // User's message (max 2000 chars, HTML stripped)
  chatHistory: {            // Last 10 messages for context
    role: 'user' | 'assistant';
    content: string;        // Each limited to 1000 chars
  }[];
  context?: string;         // Module/lesson context string
}
```

**Response:** `text/event-stream` — custom SSE events with three types:

| Event Type | Data Shape | Description |
|------------|-----------|-------------|
| `token` | `{ type: 'token', content: string }` | Each content chunk from the LLM |
| `done` | `{ type: 'done', model: string, latencyMs: number }` | Stream completed with metadata |
| `error` | `{ type: 'error', error: string }` | Stream was interrupted |

**Error Responses:**
- `400` — Empty message (`{ error: 'Message cannot be empty', code: 'EMPTY_MESSAGE' }`)
- `500` — Stream failed (`{ error: 'Failed to stream AI mentor response', code: 'STREAM_ERROR' }`)

**Client consumption pattern:**
```typescript
const response = await fetch('/api/mentor/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message, chatHistory, context }),
  signal: abortController.signal,  // For cancel support
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  // Parse SSE lines from decoded chunks
  // Each line: "data: { JSON }\n\n"
}
```

**Cancel support:** Pass an `AbortController.signal` to abort the stream mid-generation. The client preserves whatever content has already been received.

---

## Quiz Actions (`actions/quiz.ts`)

Three Server Actions implement the quiz lifecycle: retrieval (with answer hiding), submission & grading, and attempt history. All actions require authentication via `getAuthUserId()`.

### `getQuiz(moduleNumber: number, userId?: string)`

Returns quiz data for a module, including questions with **correctAnswer stripped** to prevent cheating. Auto-seeds quiz content from `fixtures/quiz-questions.json` on first access (lazy seed pattern).

**Parameters:** `moduleNumber` — the module to fetch quiz for; `userId` — optional, falls back to session user.

**Returns:** `ActionResult<QuizView>` — quizId, lessonId, title, description, passThreshold (default 70%), timeLimitSeconds, questions array (without correctAnswer), bestScore (null if no attempts), attemptCount.

**Lazy seed:** If the quiz doesn't exist in the database yet, this action creates the Quiz + QuizQuestion records from the fixture file. Subsequent calls are fast DB reads.

### `submitQuiz(quizId: string, answers: Record<number, 'A'|'B'|'C'|'D'>, timeSpentSeconds: number, userId?: string)`

Grades a quiz submission server-side. Each answer is compared against the stored `correctAnswer`. Score is calculated as `(earnedPoints / totalPoints) * 100`. XP (100) is awarded only if `score >= passThreshold` AND this is the user's first pass. On first pass, also marks the lesson complete and updates module progress.

**Parameters:** `quizId` — the quiz to submit for; `answers` — map of question order to selected option; `timeSpentSeconds` — elapsed time; `userId` — optional.

**Returns:** `ActionResult<SubmitQuizOutput>` — attemptId, attemptNumber, score (0-100), correctCount, totalQuestions, xpEarned (0 or 100), passed (boolean), gradedQuestions array with per-question correct/incorrect status and explanations.

**Security:** Correct answers are never sent to the client until after submission, when they're included in the graded questions for learning purposes.

### `getQuizHistory(quizId: string, userId?: string)`

Returns the user's past quiz attempts (last 20), sorted by attempt number descending.

**Parameters:** `quizId` — the quiz to fetch history for; `userId` — optional.

**Returns:** `ActionResult<QuizAttemptSummary[]>` — array of attempt summaries with id, attemptNumber, score, correctCount, totalQuestions, xpEarned, passed, timeSpentSeconds, completedAt.

### Quiz Types (`actions/types.ts`)

| Type | Kind | Description |
|------|------|-------------|
| `QuizQuestionView` | Interface | Question without correctAnswer: id, order, question, optionA-D, points |
| `QuizView` | Interface | Full quiz view: quizId, lessonId, title, description, passThreshold, questions, bestScore, attemptCount |
| `SubmitQuizInput` | Interface | Submission input: quizId, answers map, timeSpentSeconds |
| `GradedQuestion` | Interface | Question with grading: extends QuizQuestionView + selectedAnswer, correctAnswer, isCorrect, explanation |
| `SubmitQuizOutput` | Interface | Grading result: attemptId, attemptNumber, score, correctCount, totalQuestions, xpEarned, passed, gradedQuestions |
| `QuizAttemptSummary` | Interface | History entry: id, attemptNumber, score, correctCount, totalQuestions, xpEarned, passed, timeSpentSeconds, completedAt |

---

## Engine Functions (Client + Server)

The Deterministic Engine at `/src/engine/` exports pure functions used by both client (preview) and server (grading). These are not Server Actions — they are regular TypeScript functions importable anywhere.

### Evaluation Functions

| Function | Input | Output | Used By |
|----------|-------|--------|---------|
| `evaluateStrTriage` | searchTerms, userActions, expectedActions, context | `StrTriageEvaluation` | Server (grading) |
| `previewStrTriageScore` | searchTerms, userActions, expectedActions, context | `number` (0-100) | Client (live preview) |
| `evaluateBidElevator` | scenarios, decisions, context | `BidElevatorEvaluation` | Server (grading) |
| `previewBidElevatorScore` | scenarios, decisions, context | `number` (0-100) | Client (live preview) |
| `previewCampaignBuilderScore` | campaign | `number` (0-100) | Both (verification) |
| `validateCampaignBuilder` | campaign | `ValidationResult` | Client (input validation) |
| `validateStrTriageActions` | actions | `ValidationResult` | Client (input validation) |

### Formula Functions

| Function | Returns | Module |
|----------|---------|--------|
| `calculateCpc(spend, clicks)` | Cost Per Click | 1 |
| `calculateAcos(spend, sales)` | ACoS (decimal) | 1 |
| `calculateTacos(spend, totalSales)` | TACoS (decimal) | 1 |
| `calculateRoas(sales, spend)` | Return on Ad Spend | 1 |
| `calculateCtr(clicks, impressions)` | Click-Through Rate | 1 |
| `calculateConversionRate(orders, clicks)` | CVR (decimal) | 1 |
| `calculateAov(sales, orders)` | Average Order Value | 1 |
| `calculateBreakEvenAcos(margin)` | Break-even ACoS | 6 |
| `calculateMaxCpc(aov, cvr, targetAcos)` | Max profitable CPC | 6 |

The `PPC_FORMULAS` registry array and `computeFormula(slug, inputs)` / `formatFormulaOutput()` helpers power the interactive Formula Calculator widget.

---

## XP System

XP is awarded when a simulation attempt is graded by the server. The formula is `xpEarned = Math.round(officialScore * 2)`, capped at 200 XP per simulation. Levels increment every 500 XP: `level = Math.floor(xp / 500) + 1`, minimum level 1. This system is implemented in the `updateUserXP` helper within `simulation.ts` and will be extended when lesson-completion XP is added.

---

*Last updated: 2026-06-07 — Added Quiz server actions documentation*
