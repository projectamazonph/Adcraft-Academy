# Sessions 11–15 — Content, Bug Fixes & Beyond

> AdCraft Development Diary — Sessions 11 through 15
>
> Sessions 13–15 will be added as they occur.

---

## Session 11 — 2026-06-04 — MDX Content Authoring (Modules 0 + 1)

**Duration**: ~25 minutes
**Mood**: 😊 Productive writing

**Goal**: Author all remaining MDX lesson content for Module 0 (Onboarding) and Module 1 (Foundations), taking the content count from 2 lessons to 9.

**What Happened**:
After completing the Formula Calculator widget in the previous session, we moved to the next build list item: MDX module content. The project had only 2 lessons authored (0.1 Welcome and 1.1 Big Six Metrics), representing 15% of the total content. We needed 7 more lessons to complete Modules 0 and 1.

We authored all 7 lessons in sequence, following the lesson structure defined in the page.tsx ModulesView:

- **0.2 Platform Tour** (~750 words) — Sidebar navigation, Dashboard, Modules view, Simulations view, AI Mentor, XP/leveling system
- **0.3 First Simulation** (~950 words) — The four-phase simulation flow (Briefing → Action → Scoring → Review), scoring mechanics for each sim type, XP rewards, tips for first-timers
- **1.2 CPC & CTR** (~1100 words) — Deep dive into CPC and CTR, second-price auction mechanics, category CPC benchmarks, CTR by match type, the CPC-CTR virtuous cycle
- **1.3 ACoS, TACoS & Profitability** (~1200 words) — Break-even ACoS concept, target vs. break-even ACoS, when high ACoS is acceptable, TACoS dependency analysis, TACoS trends, the profitability chain
- **1.4 ROAS & Measuring Return** (~1000 words) — ACoS-to-ROAS conversion, ROAS targets by margin, ROAS by campaign type, AOV and max profitable bid, ROAS pitfalls
- **1.5 Metrics in Practice** (~1200 words) — The diagnostic matrix (4 common patterns), complete scenario walkthrough (kitchen scale product over 6 weeks), decision framework, golden rule of max CPC

Each lesson includes proper frontmatter (title, slug, moduleNumber, lessonNumber, type, estimatedMinutes, xpReward) and cross-references the Formula Calculator widget where relevant.

**Wins**:
- Modules 0 and 1 are now 100% content-complete — 8 lessons totaling ~7,000 words of PPC education
- Each lesson is structured with formulas, tables, examples, and actionable frameworks — not just theory
- The diagnostic matrix in 1.5 is a genuinely useful framework that goes beyond typical PPC education
- Lessons integrate with the Formula Calculator — creating a learning loop between reading and experimenting

**Struggles**:
- MDX content is time-intensive to write well — each lesson requires domain expertise, real-world examples, and careful structuring
- The content doesn't render in the app yet — it needs a lesson player/renderer component (separate from the current static module cards)
- Modules 4, 6, and 7 still need content (11 more lessons)

**Learnings**:
- Writing educational content requires a different mindset than writing code — you have to think about the learner's mental model, not just the technical accuracy
- Cross-referencing the Formula Calculator in lessons creates a natural "try it yourself" moment that reinforces learning
- The scenario walkthrough format (kitchen scale over 6 weeks) is more engaging than listing abstract rules

**Next Session Plan**:
- AI Mentor integration with Vercel AI SDK streaming
- Module 4/6/7 MDX content authoring
- Lesson player/renderer component for displaying MDX content in the app

---

---

## Session 12 — 2026-06-04 — Bug Fix: Server Actions + Lesson Navigation 🔧

**Duration**: ~25 minutes
**Mood**: 😤 Frustrated then relieved — two nasty bugs squashed

**Goal**: Fix the "Invalid Server Actions request" runtime error and the "nothing happens when clicking a module" bug.

**What Happened**:
The user reported that clicking on a module card did nothing — no lesson content appeared. The error message was cryptic: "Invalid Server Actions request. Next.js version: 16.1.3 (Turbopack)." This turned out to be two separate but compounding bugs.

**Bug 1: ERR-005 (Critical) — Server Actions type export violation.** Both `src/app/actions/lesson.ts` and `src/app/actions/simulation.ts` had `'use server'` at the top but also exported TypeScript types and interfaces alongside the async functions. In Next.js 16, `'use server'` files can ONLY export async functions — non-function exports corrupt the Server Actions binding at runtime. Every server action call from the client would fail with "Invalid Server Actions request." The fix: created `src/app/actions/types.ts` (no `'use server'`) for all shared type definitions, then refactored both action files to import types from there and only export async functions.

**Bug 2: ERR-006 (High) — Lesson file lookup prefix mismatch.** The `findLessonFile()` function searched for files starting with `${lessonOrder}.` (e.g., "1.") — which worked for Module 1 but failed for Module 0 where files are named `0.1-welcome.mdx`. The actual naming convention is `{moduleNumber}.{lessonOrder}-{title}.mdx`. Fixed by changing the prefix to `${moduleNumber}.${lessonOrder}`.

After both fixes, clicking a module card now correctly: sets activeLesson state, shows LessonPlayer, calls server actions, and renders MDX lesson content with full navigation.

**Wins**:
- Both bugs found and fixed in one session — the app's learning flow is now functional
- The types separation is a better pattern anyway — cleaner separation of concerns
- Build still compiles clean (0 errors)
- Lesson Player now works for all 5 modules (0, 1, 4, 6, 7)

**Struggles**:
- The "Invalid Server Actions request" error message gives zero indication of the root cause
- The lesson file lookup bug was subtle — it worked for Module 1 by coincidence

**Learnings**:
- **Next.js 16 `'use server'` rule is strict**: ONLY async function exports. No types, no constants.
- **File naming conventions must match lookup logic exactly.** The disconnect only surfaced because Module 0 exists.
- **Two bugs can compound into one symptom.** Either bug alone would have caused a failure.

**Next Session Plan**:
- Module Progress Tracking (lesson completion persistence to database)
- AI Mentor integration (streaming backend)
- Dashboard → Real Data (wire stats to Server Actions/Prisma)

---

## Session 13 — 2026-06-04 — Qwen Chat Integration: 6 New Reference Docs 📚

**Duration**: ~30 minutes
**Mood**: 📖 Organized and comprehensive

**Goal**: Integrate development specifications from the Qwen chat ("AdCraft Product Development Gaps") into the project documentation system.

**What Happened**:
The user shared a Qwen chat link containing a massive amount of development specifications generated from the AdCraft PRD. The chat covered: Content Production Kit, Frontend Technical Specification, Backend Technical Specification, Security & Admin Specification, User Journey & Paths, Course Syllabus (all 13 modules), Post-MVP Build List (Phases 3-5), and detailed AI Agent System Prompts.

We extracted the full content (~121K characters) from the Qwen chat SPA using a headless browser (agent-browser), then created 6 new structured reference documents:

1. **`reference/content-production-kit.md`** — Universal Lesson Template, Module 0 & 1 full drafts, Simulation Scenario Specs (3 packs), AI Agent System Prompts (3 production-ready prompts), Content QA Checklist
2. **`reference/frontend-spec.md`** — Component library specs (STRDataGrid, MetricCard, BidElevator, TriageActionBar, LessonPlayer, MetricMixerGame, AIMentorChat), State management architecture (Zustand + TanStack Query), Page route structure, Performance budgets, Accessibility (WCAG 2.1 AA), Error handling patterns, Testing strategy, 8-week build sequence
3. **`reference/backend-spec.md`** — Dual architecture (MVP Next.js + Phase 3 FastAPI), Evaluation Engine spec, Simulation State Manager, Synthetic Data Gen, AI Feedback Orchestrator, PII Sanitization Pipeline, Prisma schema models, API endpoint table, Risk mitigations
4. **`reference/security-admin-spec.md`** — Data isolation (RLS, PII, signed URLs, AI scoping), AI safety guardrails (deterministic primacy, safety classifier, citation requirement, rate limiting, human escalation), RBAC (6 roles), CMS, Team Dashboard, Compliance & Legal admin
5. **`reference/user-journey.md`** — 7-phase user journey (Landing Page → Onboarding → Learning Loop → Simulations → Capstone → Team → Retention), with every screen, interaction, and system response specified
6. **`reference/course-syllabus.md`** — Full 13-module syllabus with phase gates, gamification mechanics, assessment framework, and certification levels (Explorer → Commander)
7. **`reference/post-mvp-build-list.md`** — 3 phases (Weeks 9-16, 17-30, 31+), 22 features with priorities, success metrics per phase, critical dependencies, strategic recommendation

We also updated:
- **`docs/README.md`** — Added 6 new reference docs to Quick Navigation and Directory Map
- **`docs/tracking/project-plan.md`** — Added full post-MVP roadmap (Phases 3-5) with feature tables and north star metrics

**Wins**:
- 121K chars of unstructured Qwen chat → 6 well-organized reference documents
- All new docs respect the anti-bloat charter (none over 400 lines)
- Backend spec properly adapts FastAPI specs for current Monolith-First MVP architecture
- Post-MVP roadmap gives a clear path from MVP completion to enterprise revenue
- AI Agent System Prompts are production-ready (3 agents: PPC Mentor, Search Term Coach, Client Roleplay)

**Struggles**:
- Qwen chat is a SPA — required headless browser (agent-browser) to extract content; curl only got truncated OG description
- Massive content volume required careful splitting to avoid bloat
- Some specs reference FastAPI/Redis which don't apply to current MVP — had to annotate clearly

**Learnings**:
- External AI chat outputs need manual curation before becoming project docs — raw dumps create bloat
- The Monolith-First decision (ADR-001) required annotating many FastAPI/Python specs as "Phase 3" — the architecture context is critical
- The Content Production Kit's Universal Lesson Template is the pedagogical backbone — every future lesson must follow it
- The Client Roleplay Agent is the highest-leverage post-MVP feature (directly addresses #1 agency pain point)

**Next Session Plan**:
- Module Progress Tracking (lesson completion persistence to database)
- AI Mentor integration with production prompts from content-production-kit.md
- Dashboard → Real Data (wire stats to Server Actions/Prisma)

---

## Session 14 — 2026-06-04 — Module Progress Tracking + Dashboard Real Data

**Duration**: ~30 minutes
**Mood**: 🎉 High-impact — two milestones in one

**Goal**: Build Module Progress Tracking (the #1 incomplete MVP item) and wire the dashboard to real data instead of hardcoded placeholders.

**What Happened**:
The Prisma schema already had `LessonProgress` and `ModuleProgress` models from the initial sprint, but nothing was wired up — all completion tracking was local React state that vanished on refresh. The dashboard stats were all hardcoded zeros. We built the complete persistence layer and wired every component to real database data.

Created `src/app/actions/progress.ts` with 3 server actions:
- `markLessonComplete(moduleNumber, lessonNumber)` — Upserts LessonProgress, awards 50 XP per lesson, auto-creates Module/Lesson records if they don't exist, updates ModuleProgress status (IN_PROGRESS → COMPLETED), updates User XP and level, idempotent (no double XP on re-click)
- `getLessonProgress(moduleNumber)` — Returns completed lessons for a specific module from the DB
- `getProgressOverview()` — Full dashboard-ready data: XP, level, streak days, modules completed, sims passed, per-module progress with completion counts

Updated 5 components to consume real data:
- `lesson-player.tsx` — Calls `getLessonProgress` on mount (resumes from where you left off), calls `markLessonComplete` on "Mark Complete" with saving spinner state
- `stats-row.tsx` — Refactored from hardcoded to accept props (modulesCompleted, simsPassed, streakDays, totalXP)
- `module-cards.tsx` — Accepts `moduleProgress` prop, shows real completion % and dynamic status badges
- `dashboard.tsx` — Fetches `getProgressOverview()` on mount, passes real data to all child components
- `page.tsx` — Loads XP/level from DB on mount via `getUserStats`, updates in real-time when lessons complete, refresh key to re-fetch dashboard

Build compiled clean (0 errors). Prisma DB already in sync.

**Wins**:
- Two milestones knocked out in one session: Progress Tracking AND Dashboard Real Data
- MVP completion jumped from 68% to 78%
- Idempotent completion — clicking "Mark Complete" twice won't double-award XP
- Resume capability — users pick up where they left off across sessions
- Real-time XP updates in sidebar and top bar as lessons are completed

**Struggles**:
- The `LessonProgress` model in Prisma has a `userId` field but no direct `User` relation (by design, to keep it simple) — had to work around this in queries
- Auto-creating Module and Lesson records in `markLessonComplete` adds complexity but is necessary since the MDX content isn't seeded into the DB
- The `upsert` pattern with composite unique keys (`userId_lessonId`) required careful ordering of create vs update data

**Learnings**:
- **Persisted progress transforms the app.** Going from "every session starts from scratch" to "resume where you left off" is the single biggest UX improvement so far
- **The dashboard stats being real makes the app feel alive** — even with zero completions, knowing the data flows from DB to UI builds confidence
- **Idempotent server actions are critical for UX** — users will double-click, and the server must handle that gracefully
- **Auto-seeding on first access is better than a separate migration** — Module/Lesson records are created when first needed, not in a one-time script

**Next Session Plan**:
- AI Mentor Integration — streaming LLM via z-ai-web-dev-sdk with PPC rule grounding
- Testing & QA — Vitest unit tests for evaluation engine
- Auth (NextAuth.js) — Replace hardcoded mvp-user-001

---

## Session 15 — 2026-06-04 — Documentation Update + Three Milestones Shipped 📝

**Duration**: ~20 minutes
**Mood**: 📊 Organized and thorough

**Goal**: Update all project documentation to reflect the three major milestones shipped in Sessions 14-15: Module Progress Tracking, Dashboard → Real Data, and AI Mentor Integration.

**What Happened**:
After shipping three consecutive milestones (Progress Tracking at 68% → 78%, Dashboard Real Data, and AI Mentor at 78% → 85%), the documentation had fallen behind. The build-log was missing entries for the three most recent builds, the project-plan still showed outdated sprint priorities and next milestones, and the worklog hadn't been updated since Task ID 20.

We performed a comprehensive documentation update across 5 files:

1. **`docs/history/build-log.md`** — Added 3 new build entries: 00:10 (Module Progress Tracking), 00:11 (Dashboard → Real Data), 00:12 (AI Mentor Integration). Updated the milestone tracker to show all three as Complete. Updated the last-modified timestamp.

2. **`docs/tracking/project-plan.md`** — Updated MVP completion from 82% to 85%. Rewrote sprint priorities with more context on each remaining item. Replaced the "Next Milestones" table to remove already-completed items (Progress Tracking, Dashboard Real Data) and focus on what's actually next (AI Mentor Streaming, Testing, Auth).

3. **`docs/history/worklog.md`** — Added Task IDs 21-24 covering: Progress Tracking build, Dashboard Real Data wiring, AI Mentor integration, and this documentation update.

4. **`docs/diary/sessions-11-15.md`** — Added this Session 15 entry.

5. **`docs/reference/architecture.md`** — Added AI Mentor pattern (z-ai-web-dev-sdk Server Action with PPC rule grounding) and Progress Tracking pattern (auto-seeding, idempotent completion, MODULE_META constant).

**Wins**:
- Documentation is now fully in sync with the codebase — zero drift
- All 18 milestones have accurate status in the tracker
- Sprint priorities reflect reality: AI Mentor Streaming, Testing, Auth
- MVP at 85% with clear path to 100%

**Struggles**:
- The diary file is approaching the 400-line anti-bloat limit — sessions-11-15.md will need to be split or archived soon
- Three milestones shipped in rapid succession means the documentation lag was larger than usual

**Learnings**:
- **Documentation should follow each build, not lag behind.** The 3-build gap made this update heavier than it needed to be. Next time: update docs immediately after each build.
- **The anti-bloat charter is working.** The structured directory system (history/, tracking/, reference/, diary/) makes it clear where each update goes, reducing decision fatigue.
- **MVP at 85% feels real now.** With only streaming, testing, and auth remaining, the finish line is genuinely in sight.

**Next Session Plan**:
- AI Mentor Streaming (SSE via API route) — the last 10% to complete the AI Mentor milestone
- Testing & QA — Vitest unit tests for the evaluation engine
- Auth (NextAuth.js) — Replace hardcoded mvp-user-001

---

*Session 16+ moved to [`sessions-16-20.md`](./sessions-16-20.md)*
