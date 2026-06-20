# AdCraft System Architecture

> Design patterns, execution model, and data flow for the AdCraft MVP. Architecture decisions are documented in [`decisions/ADR-001-monolith-first.md`](../decisions/ADR-001-monolith-first.md). This file describes *how* the architecture is implemented.

---

## System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     Next.js 16 Monolith                      │
│                                                              │
│  ┌────────────┐  ┌─────────────┐  ┌───────────────────────┐ │
│  │  Browser   │  │ Server Acts │  │   Deterministic       │ │
│  │            │  │             │  │   Engine (/src/engine) │ │
│  │  React 19  │◄─► simulation  │◄─►                       │ │
│  │  Zustand   │  │ lesson      │  │ formulas.ts  (9 funcs)│ │
│  │  TanStack  │  │             │  │ evaluation.ts (3 sims)│ │
│  │  shadcn/ui │  │  'use server│  │ simulation.ts (lifecycle)│
│  │            │  │  async only)│  │ types.ts    (50+ types)│ │
│  └─────┬──────┘  └──────┬──────┘  └───────────────────────┘ │
│        │                │                                     │
│        │         ┌──────┴──────┐                              │
│        │         │   Prisma    │                              │
│        │         │ PostgreSQL  │                              │
│        │         │ (JSONB sim  │                              │
│        │         │   state)    │                              │
│        │         └─────────────┘                              │
│        │                                                     │
│  ┌─────┴──────┐  ┌─────────────┐  ┌───────────────────────┐ │
│  │  Fixtures  │  │  MDX Content│  │  AI Mentor (streaming)│ │
│  │  (JSON)    │  │  (19 lessons│  │  SSE /api/mentor/     │ │
│  │  build-time│  │   5 modules)│  │  stream + Server Act  │ │
│  └────────────┘  └─────────────┘  └───────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

The entire MVP runs as a single Next.js application deployed to Vercel. The Deterministic Engine has zero framework dependencies and can be extracted to a standalone FastAPI service when migration triggers are met (runtime synthetic data, serverless timeouts, multiplayer needs).

---

## Hybrid Execution Model

The Hybrid Execution Model (ADR-001, Decision #12) is the core architectural pattern for simulations. It splits execution into two phases that run the *same* pure function, ensuring deterministic integrity while giving users instant feedback.

**Client phase (< 100 ms):** When a user makes a decision in a simulation — triaging a search term, placing a bid, adjusting a campaign — the Zustand store calls the engine's preview function directly in the browser. The user sees a live score updating in real-time. No network round-trip is needed; the pure TypeScript function runs synchronously.

**Server phase (authoritative):** When the user submits the simulation, the Zustand store calls a Server Action that re-runs the *same* engine function on the server. The server persists the official score to PostgreSQL via Prisma. If the client preview and server score diverge, a `scoreDiscrepancy` flag is set and the server score wins. This prevents tampering and catches any non-determinism.

The key invariant: both phases call identical pure functions from `/src/engine/`. The client imports `previewStrTriageScore`, `previewBidElevatorScore`, or `previewCampaignBuilderScore` for instant feedback. The server imports `evaluateStrTriage`, `evaluateBidElevator`, or uses the client's evaluation with a verification score for Campaign Builder. Because the engine has zero side effects, the same input always produces the same output regardless of execution environment.

---

## Extractable Engine Pattern

The Deterministic Engine at `/src/engine/` follows strict design constraints that make it extractable to a Python FastAPI service without changing any consumer code:

1. **No database calls** — Evaluation functions accept all data as arguments; they never call `db.*`.
2. **No framework imports** — No `import { ... } from 'next'` or `import React`. The engine is pure TypeScript.
3. **Pure functions only** — Every function takes input and returns output with zero side effects. No mutation, no global state.
4. **All types in `types.ts`** — A single file defines every domain type. When extracting, these map 1:1 to Pydantic models.
5. **Barrel export via `index.ts`** — Consumers import from `@/engine`, not individual files. When the engine moves to FastAPI, only the import path changes.

When extraction happens (triggered by runtime data generation needs, Vercel timeout limits, or multiplayer requirements), the engine becomes an OpenAPI service. Frontend code changes only its import source from `@/engine` to an API client. The Zustand stores' `preview*` calls become local caches, and the Server Actions become API proxies.

---

## Server Actions Type Safety Pattern

Next.js 16 enforces that `'use server'` files can only export async functions. Exporting types, constants, or any non-function value from a `'use server'` file corrupts the Server Actions binding at runtime, causing "Invalid Server Actions request" errors on every call (see ERR-005 in error-log). The solution is a strict file separation:

```
actions/
├── types.ts          ← NO 'use server'. Types only (ActionResult<T>, LessonMeta, ProgressOverview, etc.)
├── simulation.ts     ← 'use server'. Async functions only. Imports types from ./types.
├── lesson.ts         ← 'use server'. Async functions only. Imports types from ./types.
├── progress.ts       ← 'use server'. Async functions only. Lesson/module progress tracking.
└── mentor.ts         ← 'use server'. Async functions only. AI Mentor via z-ai-web-dev-sdk.
```

Consumers follow a dual-import pattern: types come from `@/app/actions/types`, functions come from the action files. This pattern must be followed for any new Server Action files.

```typescript
// In a component or store:
import type { LessonMeta, ActionResult } from '@/app/actions/types'
import { listModuleLessons, getLessonContent } from '@/app/actions/lesson'
```

---

## Zustand Store Pattern

Each simulation has a dedicated Zustand store that acts as the orchestrator between the UI, the engine, and the Server Actions. The pattern is consistent across all three simulations:

**Fixture → Store → Components:** The fixture JSON file (e.g., `fixtures/str-triage-pack-1.json`) provides the scenario data. The store loads this data, holds all simulation state (current phase, user actions, scores, timing), integrates with the engine for preview scoring, and calls Server Actions for persistence. Components read from the store and dispatch actions to it.

Each store manages: `phase` (briefing/arena/scoring/review), `previewScore` (client-side), `officialScore` (server-side, null until graded), `isGrading` (loading state), `scoreDiscrepancy` (integrity flag), `xpEarned`, and `attemptId` (for DB linkage). The `startSimulation` action calls the `startAttempt` Server Action non-blocking; the submit action calls the corresponding grade Server Action after computing the client-side evaluation. Server action failures are caught silently so the simulation remains fully functional client-side even if the database is unavailable.

```
┌───────────┐     ┌──────────────────┐     ┌──────────────┐
│  Fixture   │────►│  Zustand Store   │────►│  Components  │
│  (JSON)    │     │                  │     │  (React)     │
└───────────┘     │  state + actions │     └──────────────┘
                   │                  │
                   │  ┌──────────┐   │     ┌──────────────┐
                   └──►  Engine   │───┘────►│  Server Act  │
                       │(preview) │        │  (grading)   │
                       └──────────┘        └──────┬───────┘
                                                   │
                                            ┌──────▼───────┐
                                            │  PostgreSQL   │
                                            └──────────────┘
```

---

## Component Architecture

The UI is organized into feature-based component groups under `src/components/adcraft/`. Each simulation has a phase-orchestrator component (e.g., `str-triage-arena.tsx`) that manages the four-phase flow using `AnimatePresence` for transitions, plus dedicated components for each phase (briefing, arena/workshop, scoring, review). Shared components include the sidebar, dashboard, stats row, module cards, simulation cards, mentor chat, XP progress, and formula calculator.

shadcn/ui components in `src/components/ui/` provide the design system foundation (Button, Card, Input, Slider, Badge, Dialog, etc.). Custom AdCraft components compose these primitives with domain-specific logic. The main `page.tsx` acts as the top-level router, switching between Dashboard, Modules, Simulations, and AI Mentor views based on navigation state, and launching simulation overlays when a sim card is clicked.

---

## Data Flow Diagram

```
User Click
    │
    ▼
┌──────────┐    startSimulation()    ┌──────────────────┐
│  UI Card │────────────────────────►│  Zustand Store    │
└──────────┘                         │                   │
                                      │  1. Load fixture
                                      │  2. Set phase=briefing
                                      │  3. Call startAttempt() ──► DB (IN_PROGRESS)
                                      │
    ┌─────────────────────────────────┘
    │
    ▼  User interacts with arena/workshop
┌──────────────┐   dispatch(action)   ┌──────────────────┐
│  Sim Component│────────────────────►│  Zustand Store    │
└──────────────┘                      │                   │
                                       │  1. Update state
                                       │  2. Call engine.preview*()
                                       │  3. Set previewScore
                                       │
    ┌──────────────────────────────────┘
    │
    ▼  User submits
┌──────────────┐   submitSimulation()  ┌──────────────────┐
│  Review Phase │◄─────────────────────│  Zustand Store    │
└──────────────┘                       │                   │
                                        │  1. Call engine.evaluate*() (client)
                                        │  2. Set officialScore locally
                                        │  3. Call gradeXxxAttempt() ──► Server
                                        │                                  │
                                        │                         ┌────────▼────────┐
                                        │                         │  Server runs    │
                                        │                         │  SAME engine fn │
                                        │                         │  Persists score │
                                        │                         │  Updates XP     │
                                        │                         └─────────────────┘
```

The data flow ensures that every user action produces instant UI feedback through the client-side engine, while the server provides the authoritative record. The `scoreDiscrepancy` flag is the safety net that catches any divergence between the two execution environments.

---

## AI Mentor Pattern

The AI Mentor uses `z-ai-web-dev-sdk` to provide real-time PPC coaching through a Server Action. The architecture follows the same Deterministic First principle: the AI is for explanation and coaching only, never for scoring or grading decisions.

**Server Action flow:** The `chatWithMentor` Server Action in `src/app/actions/mentor.ts` receives the user's message, chat history (last 10 messages), and an optional context string (current module/lesson). It builds a messages array with the system prompt, history, and current message, then calls the LLM via `zai.chat.completions.create()`. The response includes the AI's message, latency in milliseconds, and the model used.

**System prompt architecture:** The PPC Mentor system prompt contains 12 PPC rule references (ACOS_THRESHOLD, CPC_MAX, ROAS_BENCHMARK, CTR_BENCHMARK, NEG_KEYWORD_RULE, BID_STRATEGY_START, CAMPAIGN_STRUCTURE, SPONSORED_PRODUCTS, BUDGET_PACING, KEYWORD_HARVEST, etc.) that the AI must cite by ID when explaining decisions. This grounds the AI in approved playbooks rather than allowing it to fabricate advice.

**Safety guardrails:** Input sanitization strips HTML tags and limits message length to 2000 characters. The system prompt includes explicit rules against performance guarantees, black-hat tactics, and guessing when data is insufficient. The AI must respond with "INSUFFICIENT DATA" and recommend what to monitor rather than speculating.

**Context awareness:** The `MentorChat` component builds a context string from the current `moduleNumber` and `lessonSlug` props, sending it to the Server Action so the AI can personalize its response. If the learner is in Module 1 studying CPC, the AI can reinforce that specific concept rather than giving generic advice. Suggested questions are dynamically filtered based on the current module context — Module 1 shows CPC/ACoS questions, Module 7 shows negative keyword questions, etc.

**Markdown rendering:** AI responses are rendered with `ReactMarkdown` + `remarkGfm`, enabling rich formatting including bold terms, bullet lists, code blocks for formulas, and blockquotes for rules. This makes AI responses more scannable and educational compared to plain text.

**Conversation management:** The UI supports clearing conversation history, copying individual AI responses, and displays metadata (latency, model info, message count). A system message pattern provides inline feedback for actions like clearing the chat.

**Streaming architecture.** The AI Mentor uses Server-Sent Events (SSE) for real-time token delivery via a dedicated API route at `POST /api/mentor/stream`. The `z-ai-web-dev-sdk` is called with `stream: true`, which returns a `ReadableStream` of OpenAI-format SSE chunks. The API route parses these chunks (extracting `delta.content` from each `choices[0].delta` object) and re-emits them as custom SSE events with three types: `token` (each content chunk), `done` (stream completion with latency/model metadata), and `error` (stream interruption). The client-side `MentorChat` component reads this stream using `fetch()` + `ReadableStream.getReader()`, appending each token to the AI message in real-time with a blinking streaming cursor. An `AbortController` enables cancel-on-demand — the user can stop generation mid-stream via a Stop button, which aborts the fetch and preserves whatever content has already been received. This architecture provides a ChatGPT-like experience where text appears incrementally rather than all at once after a long wait.

**Dual-path design.** The non-streaming `chatWithMentor` Server Action in `actions/mentor.ts` is retained as a fallback and for any server-side-only use cases. The streaming path is purely client-to-API-route (bypasses Server Actions entirely, since Server Actions cannot stream responses). Both paths share the same system prompt and input validation logic — the system prompt is duplicated in the API route file rather than shared via import, to avoid mixing `'use server'` and non-server code in the same module dependency chain.

---

## Progress Tracking Pattern

Lesson and module completion is persisted through the `progress.ts` Server Actions, transforming the app from session-only state to resumable, cross-session learning journeys.

**Auto-seeding on first access:** Rather than requiring a separate database migration to seed Module and Lesson records, the `markLessonComplete` action auto-creates these records when they don't exist. This simplifies the bootstrapping process — the database grows organically as users interact with content. The `MODULE_META` constant in `progress.ts` provides the metadata (slug, title, icon, color, totalLessons) that mirrors the MDX content structure.

**Idempotent completion:** Calling `markLessonComplete` on an already-completed lesson returns success with `xpEarned: 0` instead of double-awarding XP. This is critical for UX because users will double-click the "Mark Complete" button, and the server must handle that gracefully.

**Module progress auto-update:** When a lesson is marked complete, the action counts all completed lessons in that module. If the count equals `totalLessons`, the module status is automatically updated to COMPLETED with a score of 100. Otherwise, the module score is the percentage of completed lessons. This cascading update happens within the same database transaction.

**Dashboard data flow:** The `getProgressOverview` action aggregates all progress data in a single call: user XP/level, streak days, modules completed, simulations passed (score >= 70), best simulation scores per type, and per-module progress with completion counts. The `Dashboard` component fetches this on mount and passes the data to child components (`StatsRow`, `ModuleCards`) as props, replacing the previous hardcoded placeholder values.

**Resume capability:** The `LessonPlayer` component calls `getLessonProgress(moduleNumber)` on mount, which returns the completion status of each lesson in the module. Completed lessons are displayed with green checkmarks, and the user can navigate to any lesson to continue where they left off. This works across browser sessions because the state is persisted in the database, not in React state.

---

## Dark Mode & Responsive CSS Pattern

The app uses a dark-first design with Tailwind CSS v4. Dark mode is enforced via `className="dark"` on the `<html>` element, which activates the `.dark` CSS custom properties block in `globals.css`. All color references use `oklch()` color space via CSS custom properties (e.g., `--background`, `--primary`, `--border`), which are mapped to Tailwind utilities through `@theme inline`.

**Defensive dark mode fallback:** The `@layer base` block includes `html.dark { background-color: var(--background); color: var(--foreground); }` as a defensive rule. This ensures the dark background is applied at the html element level even if component-level `bg-background` classes have specificity issues or haven't loaded yet. Without this fallback, the page can flash white before the component CSS loads.

**Tailwind v4 class merging caution:** When combining base utilities (e.g., `flex flex-col`) with responsive overrides (e.g., `hidden lg:flex`), the `tailwind-merge` library (used by `cn()`) may not always resolve display property conflicts predictably in Tailwind v4. The safe pattern is: use `hidden lg:flex` as the primary display rule, then use `!flex` as an explicit override for conditional states (like mobile-open), and move `flex-direction` to an inline `style` prop to avoid class merge ambiguity entirely.

**Server actions on mount:** Any Server Action called in a `useEffect` on component mount should auto-create missing resources rather than returning errors. The `getUserStats` and `getProgressOverview` actions both auto-create the user record if it doesn't exist, preventing "Loading..." dead-ends on first visit. All mount-time Server Action calls should include `.catch()` handlers to prevent unhandled promise rejections.

---

## Authentication Pattern

Authentication is implemented with NextAuth.js v4 using the Credentials provider (email/password). The system replaces the earlier hardcoded `mvp-user-001` user ID with real session-based user identification across all server actions.

**Provider configuration:** The `CredentialsProvider` in `src/lib/auth.ts` accepts email and password, validates against bcrypt-hashed passwords stored in the User model, and returns the user object with id, email, name, and role. Passwords are hashed with bcrypt (12 rounds) via the `hashPassword()` helper. The `authorize()` function normalizes email to lowercase, verifies the user exists, checks for a `passwordHash` field (accounts created without a password are rejected), and compares the submitted password against the stored hash. On successful login, `lastActiveAt` is updated on the user record.

**Session strategy:** JWT-based sessions (stateless) with a 30-day expiry. The JWT callback enriches the token with `id` and `role` from the user object. The session callback forwards these fields to the client session, making them available via `useSession()` in client components. This eliminates the need for server-side session storage — the JWT is self-contained and verified by the middleware.

**Middleware route protection:** The `src/middleware.ts` file uses `getToken()` from `next-auth/jwt` to check for an active session on every request. Public routes (`/auth/signin`, `/auth/signup`, `/api/auth/*`) are excluded. Static files and Next.js internals (`/_next/*`, `/favicon.ico`) are also excluded. Unauthenticated users are redirected to `/auth/signin` with the original path preserved as a `callbackUrl` parameter for post-login redirect.

**Server-side auth guard:** The `src/lib/auth-guard.ts` module exports `getAuthUserId()` and `getAuthSession()` helpers that use `getServerSession(authOptions)` to retrieve the current user from server components and server actions. All server actions now call `getAuthUserId()` to obtain the authenticated user ID, returning `{ success: false, code: 'UNAUTHENTICATED' }` if no session exists — no longer falling back to `mvp-user-001`.

**Sign-in flow (ERR-008 fix):** Both sign-in and sign-up pages use NextAuth's default redirect behavior (`signIn('credentials', { callbackUrl })`) instead of `redirect: false`. The default behavior triggers a full page navigation, which reliably persists the session cookie across all browser/proxy configurations. The earlier `redirect: false` approach used a fetch-based pattern that could fail to persist cookies in certain environments (especially behind reverse proxies), causing a redirect loop where the middleware couldn't find the JWT token.

**Auth pages:** Custom sign-in (`/auth/signin`) and sign-up (`/auth/signup`) pages with branded UI, error display with NextAuth error code mapping (e.g., "CredentialsSignin" → "Invalid email or password"), password strength meter on sign-up, and Suspense boundary for `useSearchParams()` (required by Next.js 16 for static generation compatibility).

**Signup API route:** `POST /api/auth/signup` handles user registration with server-side validation (email format, password minimum 8 characters, duplicate email check), bcrypt hashing, and automatic user record creation. The sign-up page then calls `signIn()` to establish the session immediately after registration.

**User model integration:** The Prisma `User` model includes `passwordHash` (nullable for future OAuth users), `role` (STUDENT/INSTRUCTOR/ADMIN), and standard fields (xp, level, streakDays). The `Account` model supports multiple providers for future OAuth integration. All progress and simulation records are scoped to the authenticated user via the `userId` foreign key.

---

## Quiz Pattern (Post-MVP: Atomic Build A4)

Lesson Quizzes follow a **lazy-seed, server-grade** architecture that extends the existing Progress Tracking pattern. Each module's final lesson is a quiz knowledge check that gates lesson completion behind demonstrated understanding rather than a simple "Mark Complete" click.

**Lazy seed pattern:** Quiz content is not pre-seeded on deploy. The `ensureQuizSeeded()` function in `src/app/actions/quiz.ts` checks whether a quiz exists for the module's last lesson, and if not, reads `fixtures/quiz-questions.json` to create the `Quiz` + `QuizQuestion` records. The fixture data is cached in memory after the first load. This eliminates migration scripts and makes adding new questions as simple as updating the fixture JSON.

**Answer security:** The `getQuiz` action strips `correctAnswer` from question data before returning it to the client — the `QuizQuestionView` type omits this field entirely. All grading happens server-side in `submitQuiz`, which re-reads the questions from the database to verify answers. This prevents client-side tampering with scores.

**XP integration:** XP is only awarded on the user's first quiz pass (score >= passThreshold, default 70%). Subsequent passes return `xpEarned: 0`. When XP is awarded, the quiz action also marks the associated lesson as complete via `LessonProgress.upsert()` and updates module progress — the same cascade as `markLessonComplete` in progress.ts.

**QuizPlayer phases:** The quiz UI component (`src/components/adcraft/quiz-player.tsx`) manages four phases: `ready` (quiz overview, past attempts, start button), `answering` (step-by-step question navigation with timer), `submitted` (score hero + per-question breakdown with explanations), and back to `ready` for retries. The `LessonPlayer` detects `type === 'quiz'` lessons and renders a "Start Quiz" CTA that hands off to the QuizPlayer.

**Schema design:** Three models support quizzes — `Quiz` (1 per lesson, unique on lessonId), `QuizQuestion` (N per quiz, unique on quizId+order), and `QuizAttempt` (N per user per quiz, unique on userId+quizId+attemptNumber). The `QuizAttempt` reuses the `AttemptStatus` enum from simulations. Answers are stored as JSON (`{ "1": "A", "2": "C" }`) for auditability.

---

*Last updated: 2026-06-07 — Added Quiz architecture pattern*
