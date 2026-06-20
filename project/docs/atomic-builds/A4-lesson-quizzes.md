# Atomic Build A4: Lesson Quizzes

> **Status**: ✅ Complete
> **Phase**: Post-MVP (Phase 2)
> **Dependencies**: None (builds on existing MVP foundation)
> **Estimated Effort**: 2-3 days → Actual: ~1 day

---

## Overview

Lesson Quizzes add knowledge-check assessments to the end of each learning module. They transform passive reading into active recall, which is the single most effective learning technique according to cognitive science research. Each module now culminates in a multiple-choice quiz that tests the concepts covered in the preceding lessons, and passing awards 100 XP — creating a tangible goal that motivates learners to study carefully.

---

## What Changed

### New Files

| File | Purpose |
|------|---------|
| `src/app/actions/quiz.ts` | Server actions: `getQuiz`, `submitQuiz`, `getQuizHistory` |
| `src/components/adcraft/quiz-player.tsx` | Interactive quiz UI component (5 phases: loading → ready → answering → submitted → review) |
| `fixtures/quiz-questions.json` | Quiz question bank — 5 quizzes, 30 total questions across all modules |

### Modified Files

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added `Quiz`, `QuizQuestion`, `QuizAttempt` models + `Quiz?` relation on `Lesson` + `QuizAttempt[]` relation on `User` |
| `src/app/actions/types.ts` | Added 7 quiz types: `QuizQuestionView`, `QuizView`, `SubmitQuizInput`, `GradedQuestion`, `SubmitQuizOutput`, `QuizAttemptSummary` |
| `src/components/adcraft/lesson-player.tsx` | Detects `quiz` type lessons → renders "Start Quiz" CTA → hands off to `QuizPlayer` component |
| `src/components/adcraft/module-cards.tsx` | Added `Target` icon + "Quiz" badge to all module cards |

### Database Schema

Three new models were added to support quizzes:

```
Quiz (1 per lesson)
├── id, lessonId (unique), title, description
├── passThreshold (default 70%), timeLimitSeconds (optional)
├── isPublished, createdAt, updatedAt
├── questions[] → QuizQuestion
└── attempts[] → QuizAttempt

QuizQuestion (N per quiz)
├── id, quizId, order
├── question, optionA, optionB, optionC, optionD
├── correctAnswer (A/B/C/D), explanation
├── points (default 1)
└── @@unique([quizId, order])

QuizAttempt (N per user per quiz)
├── id, userId, quizId, attemptNumber
├── status (AttemptStatus enum), answers (JSON)
├── score (0-100%), correctCount, totalQuestions
├── xpEarned (0 if failed, 100 if passed first time)
├── timeSpentSeconds, startedAt, completedAt
└── @@unique([userId, quizId, attemptNumber])
```

---

## Quiz Flow

```
User navigates to last lesson of module (e.g., Lesson 5 of Module 1)
  → LessonPlayer detects type === 'quiz'
  → Shows "Start Quiz" CTA with XP and pass threshold info
  → User clicks Start Quiz
  → QuizPlayer component takes over (4 phases):

1. READY — Shows quiz title, description, question count, pass threshold, XP reward
           Shows previous attempts and best score (if any)
           [Start Quiz] / [Retake Quiz] button

2. ANSWERING — Step-by-step question navigation
               Select answer (A/B/C/D) with visual feedback
               Timer running, progress bar, question dots
               Navigate back/forward through questions
               [Submit Quiz] when all questions answered

3. SUBMITTED — Score hero card (pass/fail visual)
               XP earned badge (only on first pass)
               Per-question breakdown with correct/incorrect + explanations
               [Retake Quiz] or [Review Lessons]

4. Back to READY for retries
```

---

## XP & Progress Integration

| Event | XP | Condition |
|-------|-----|-----------|
| Quiz pass (first time) | +100 XP | Score >= 70% AND no prior pass |
| Quiz pass (subsequent) | +0 XP | Already passed before — no double-awarding |
| Quiz fail | +0 XP | Score < 70% |

When a user passes a quiz for the first time:
1. **XP is awarded** to the user's total
2. **User level is recalculated** (level = floor(XP / 500) + 1)
3. **Lesson is marked complete** (the quiz lesson)
4. **Module progress is updated** (checks if all lessons complete)

This means quizzes function as a **gate** — the lesson is only marked complete when the user demonstrates understanding, not just by clicking "Mark Complete".

---

## Quiz Content

Each module has a quiz attached to its **last lesson** (the knowledge check):

| Module | Quiz Title | Questions | Focus |
|--------|-----------|-----------|-------|
| 0: Onboarding | Onboarding Knowledge Check | 5 | PPC basics, ad types, auction system |
| 1: Foundations | PPC Foundations Knowledge Check | 8 | CPC, CTR, ACoS, TACoS, RoAS calculations |
| 4: Campaign Architecture | Campaign Architecture Knowledge Check | 6 | SP/SB/SD types, match types, campaign structure |
| 6: Bidding Lab | Bidding Lab Knowledge Check | 5 | Bid strategies, placement adjustments, ACoS calculation |
| 7: Search Term Triage | Search Term Triage Knowledge Check | 6 | Search terms vs keywords, negative keywords, triage decisions |

**Total: 30 questions** — each with 4 options, correct answer, and detailed explanation.

---

## Lazy Seed Pattern

Quiz content is **not** pre-seeded into the database on deploy. Instead, the `ensureQuizSeeded()` function in `src/app/actions/quiz.ts`:

1. Checks if a quiz already exists for the module's last lesson
2. If not, reads `fixtures/quiz-questions.json` and creates the `Quiz` + `QuizQuestion` records
3. Caches the fixture data in memory after first load

This means:
- No migration scripts needed
- Adding new quiz questions = update the fixture JSON
- First access is slightly slower (DB writes), subsequent accesses are fast

---

## API Reference

### `getQuiz(moduleNumber: number, userId?: string)`

Returns quiz questions for a module. **Omits `correctAnswer`** from the response to prevent cheating.

**Returns:** `QuizView` with questions, pass threshold, best score, attempt count

### `submitQuiz(quizId: string, answers: Record<number, 'A'|'B'|'C'|'D'>, timeSpentSeconds: number, userId?: string)`

Grades a quiz submission and awards XP if passed.

**Returns:** `SubmitQuizOutput` with score, graded questions (with explanations), XP earned

### `getQuizHistory(quizId: string, userId?: string)`

Returns the user's past quiz attempts (last 20).

**Returns:** `QuizAttemptSummary[]` with scores, pass/fail, time spent

---

## Security Considerations

1. **Answer hiding**: `getQuiz` strips `correctAnswer` from question data before sending to client
2. **Server-side grading**: All scoring happens server-side in `submitQuiz` — client cannot manipulate scores
3. **Auth required**: All quiz actions require authenticated user via `getAuthUserId()`
4. **XP idempotency**: XP is only awarded on first pass — subsequent passes don't double-award
5. **Attempt tracking**: Every attempt is recorded with answers, score, and time spent

---

## Future Enhancements (Post-A4)

These are NOT in this atomic build but are natural extensions:

- **Timed quizzes**: `timeLimitSeconds` field is in the schema but not enforced in UI yet
- **Question randomization**: Shuffle question order and option order per attempt
- **Question pools**: Multiple question sets per module, randomly selected
- **Partial credit**: Weighted scoring beyond simple correct/incorrect
- **AI-generated questions**: Use the AI Mentor to generate quiz questions from lesson content
- **Quiz analytics**: Admin dashboard showing question difficulty, common wrong answers
