# AdCraft Build Log

> Chronological record of all build activities, milestones, and deliverables.

---

## Format

Each entry follows this structure:
```
### [TIMESTAMP] — [COMPONENT] — [STATUS]
**Task**: What was being built
**Details**: Implementation specifics
**Files Changed**: Key files modified/created
**Dependencies**: Any new packages or services added
**Next Steps**: What follows
```

---

## Build Entries

### [2026-06-04 00:01] — PROJECT INIT — ✅ COMPLETE

**Task**: Initial project documentation and environment setup
**Details**:
- Created project documentation suite (README, build-log, error-log, diary)
- Installed 6 GitHub skill repos for development capabilities
- Extracted full AdCraft PRD from Qwen chat link (142,000+ characters)
- Reviewed PRD v2.0, Implementation Blueprint, UI/UX Spec, and Operational Package

**Files Changed**:
- `docs/README.md` — Project overview and structure
- `docs/build-log.md` — This file
- `docs/error-log.md` — Error tracking
- `docs/diary.md` — Development diary

**Skills Installed**:
- sickn33/antigravity-awesome-skills: 1,377 new skills
- alexei-led/cc-thingz: 4 new skills + 10 hooks
- rdhawladar/claude-code-fullstack-starter: 1 skill (new-feature workflow)
- leejpsd/typescript-react-patterns: Already installed
- VoltAgent/awesome-agent-skills: Reference only
- helloianneo/awesome-claude-code-skills: Reference only

**Dependencies**: None yet (pre-build phase)
**Next Steps**: Initialize Next.js project, set up database schema, create UI design system

---

### [2026-06-04 00:02] — AGENT SPECIFICATION — ✅ COMPLETE

**Task**: Define and document the 6-agent development team
**Details**:
- Formalized the AdCraft Agents Specification with 6 specialized agents
- Each agent has defined skills, responsibilities, and output artifacts
- Established collaboration workflow: Architect → Backend → Frontend → AI → Content → DevOps
- Mapped each agent to a subagent type for execution
- Updated architecture from monolithic Next.js to dual-stack (Next.js frontend + FastAPI backend)
- Added Redis for simulation state management and event sourcing
- Added pgvector for RAG-based AI grounding
- Updated project structure to reflect content/, infra/, and backend/ directories

**Core Principles Established**:
1. Deterministic First — All scoring/logic deterministic; AI for explanation only
2. Safety & Compliance — No black-hat, no financial guarantees, PII sanitization, Amazon TM compliance
3. Pedagogical Integrity — "Do The Thing" learning model; no passive consumption
4. Modular Architecture — Next.js + FastAPI + Postgres/Redis loosely coupled via API contracts

**Files Changed**:
- `docs/agents-spec.md` — Full agent specification (NEW)
- `docs/README.md` — Updated tech stack, project structure, agent team section, documentation suite
- `docs/build-log.md` — This entry
- `docs/diary.md` — Session 2 entry

**Architecture Decisions Added**:
- #5: FastAPI as core backend (deterministic engine needs Python ecosystem)
- #6: Redis for simulation state (event sourcing, session management)
- #7: Dual-stack architecture (Next.js BFF + FastAPI core)
- #8: pgvector for RAG (ground AI in PPC rules)

**Dependencies**: FastAPI, Redis, pgvector added to planned stack
**Next Steps**: Initialize Next.js + FastAPI project structure, set up Prisma/SQLAlchemy models, create design system

---

### [2026-06-04 00:03] — PRE-BUILD CONCERNS — ⏳ OPEN

**Task**: Identify and document all questions, concerns, and risks before writing code
**Details**:
- Cataloged 23 concerns across 4 severity levels (Critical/High/Medium/Low)
- Identified 10 open questions for the product owner
- 6 Critical concerns must be resolved before coding begins
- Top concerns: dual-stack orchestration, auth strategy, schema source-of-truth, deterministic engine placement, Redis dev dependency, and MVP scope definition

**Files Changed**:
- `docs/pre-build-concerns.md` — Full concerns document with resolution tracker (NEW)
- `docs/build-log.md` — This entry
- `docs/diary.md` — Session 3 entry

**Dependencies**: None — this is a blocking gate
**Next Steps**: Resolve C-01 through C-06 before writing any code

---

### [2026-06-04 00:04] — ARCHITECTURE RESOLUTION — ✅ COMPLETE

**Task**: Resolve all 12 critical and high-priority concerns, receive product owner decisions, update architecture
**Details**:
- Product owner resolved all 6 critical concerns (C-01 through C-06) and 6 high concerns (C-07 through C-12)
- **Major pivot: Monolith-First architecture** — eliminated dual-stack for MVP
- Deterministic engine rewritten as pure TypeScript module at `/src/engine/`
- Hybrid execution model: client preview + server authoritative scoring
- Prisma only for MVP; SQLAlchemy deferred to FastAPI extraction
- Postgres JSONB replaces Redis for simulation state
- Vercel AI SDK + Server Actions replaces separate AI streaming service
- Pre-generated JSON fixtures replace runtime synthetic data generation
- MVP scope locked: 5 modules (0,1,4,6,7) + 3 simulations

**Files Changed**:
- `docs/architecture-decision-records/ADR-001-monolith-first.md` — Architecture Decision Record (NEW)
- `docs/mvp-scope-definition.md` — Full MVP scope + exclusion list (NEW)
- `docs/pre-build-concerns.md` — Updated with 12 resolutions
- `docs/README.md` — Rewritten for monolith-first: tech stack, structure, features, docs suite
- `docs/build-log.md` — This entry
- `docs/diary.md` — Session 4 entry

**Architecture Decisions SUPERSEDED**:
- ~~#5 FastAPI as core backend~~ → SUPERCEDDED by #9 Monolith-First
- ~~#6 Redis for simulation state~~ → SUPERCEDDED by #10 Postgres JSONB
- ~~#7 Dual-stack architecture~~ → SUPERCEDDED by #9 Monolith-First
- ~~#8 pgvector for RAG~~ → DEFERRED to Phase 3

**New Architecture Decisions**:
- #9: Monolith-First Next.js (ADR-001)
- #10: Postgres JSONB for simulation state (replaces Redis)
- #11: Pure TS Deterministic Engine (extractable to FastAPI)
- #12: Hybrid Execution Model (client preview + server grading)
- #13: Pre-generated JSON fixtures (replaces runtime synthetic data)

**Dependencies**: Monolith eliminates FastAPI, Redis, SQLAlchemy dependencies for MVP
**Next Steps**: Initialize Next.js project, write Prisma schema, implement `/src/engine/types.ts`

---

### [2026-06-04 00:05] — CODE SPRINT 1: ENGINE + DB + SHELL — ✅ COMPLETE

**Task**: Implement P0 deliverables — Prisma schema, Evaluation Engine, App Shell
**Details**:
- Fullstack dev environment initialized (Next.js 16 + shadcn/ui + all deps)
- Prisma schema defined with 12 models, 7 enums, org_id column prep on every table
- Database pushed and Prisma Client generated (SQLite for dev)
- Pure TypeScript Evaluation Engine implemented at `/src/engine/`:
  - `types.ts` — 50+ domain types covering PPC metrics, simulations, evaluation, XP system, AI Mentor
  - `formulas.ts` — 9 PPC formulas with compute, format, health assessment, and formula registry
  - `evaluation.ts` — STR Triage, Bid Elevator, and Campaign Builder scoring; preview + validation
  - `simulation.ts` — State lifecycle management (create, start, pause, resume, submit, actions)
  - `index.ts` — Barrel export for the entire engine
- Frontend App Shell built with 8 custom AdCraft components:
  - Sidebar with 4 nav tabs + mobile responsive drawer
  - Dashboard with hero card, stats row, module cards, simulation cards, quick actions
  - AI Mentor chat placeholder with mock PPC responses
  - XP/level progress bar with animations
  - Emerald/slate dark theme with PPC-themed decorative metrics
- STR Triage fixture created: 20 search terms in Kitchen Gadgets category with scoring weights
- Module content structure: 2 module directories (0, 1) with 2 sample MDX lessons
- TypeScript type-check passes clean on all engine files
- ESLint passes with zero errors
- Dev server running and serving 200s on root route

**Files Changed**:
- `prisma/schema.prisma` — Complete schema with 12 models, 7 enums, org_id prep (REWRITTEN)
- `src/engine/types.ts` — 50+ domain types, type guards (NEW)
- `src/engine/formulas.ts` — 9 PPC formulas, health assessment, registry (NEW)
- `src/engine/evaluation.ts` — Simulation scoring, preview, validation (NEW)
- `src/engine/simulation.ts` — State lifecycle, action recording (NEW)
- `src/engine/index.ts` — Barrel export (NEW)
- `src/components/adcraft/sidebar.tsx` — Navigation sidebar (NEW)
- `src/components/adcraft/dashboard.tsx` — Dashboard view (NEW)
- `src/components/adcraft/module-cards.tsx` — Module card grid (NEW)
- `src/components/adcraft/simulation-cards.tsx` — Simulation launcher cards (NEW)
- `src/components/adcraft/stats-row.tsx` — Stats overview (NEW)
- `src/components/adcraft/mentor-chat.tsx` — AI Mentor chat (NEW)
- `src/components/adcraft/xp-progress.tsx` — XP progress bar (NEW)
- `src/app/page.tsx` — Complete app shell (REWRITTEN)
- `src/app/layout.tsx` — AdCraft branding, dark theme (UPDATED)
- `src/app/globals.css` — Custom emerald/slate theme variables (UPDATED)
- `fixtures/str-triage-pack-1.json` — 20-term STR dataset (NEW)
- `content/modules/0-onboarding/0.1-welcome.mdx` — Welcome lesson (NEW)
- `content/modules/1-foundations/1.1-what-is-ppc.mdx` — PPC fundamentals lesson (NEW)

**Dependencies**: None new — all packages pre-installed in fullstack init
**Next Steps**: Build interactive simulation components, wire up Zustand stores, implement Server Actions for grading

---

### [2026-06-04 00:06] — STR TRIAGE ARENA SIMULATION — ✅ COMPLETE

**Task**: Build the interactive STR Triage Arena simulation — the first fully playable simulation in AdCraft
**Details**:
- 4-phase simulation flow: Briefing → Triage → Scoring → Review
- Zustand store with full engine integration (`previewStrTriageScore` for live preview, `evaluateStrTriage` for final scoring)
- TanStack Table-based data grid with 20 search terms, color-coded ACoS/ROAS, inline action buttons
- 5 action types with distinct color coding: Keep (emerald), Pause (amber), Negate Exact (rose), Negate Phrase (rose), Optimize Bid (sky)
- Inline inputs for bid amounts (Optimize Bid) and negative keywords (Negate actions)
- Live preview score updating in real-time as user makes decisions
- Animated score reveal with circular SVG progress in scoring phase
- Per-term feedback with expandable educational reasoning
- Before/after portfolio metrics comparison
- Review phase with score, accuracy, XP earned, and ACoS improvement
- Integrated into app shell: STR Triage card unlocked on Simulations tab, launches arena on click
- Fixture data mapped from JSON to engine types with proper type casting
- Timer tracking elapsed time during triage phase
- Responsive design with scrollable table

**Files Changed**:
- `src/stores/str-triage-store.ts` — Zustand store with engine integration (NEW)
- `src/components/adcraft/str-briefing.tsx` — Mission briefing phase (NEW)
- `src/components/adcraft/str-data-grid.tsx` — Interactive data grid with TanStack Table (NEW)
- `src/components/adcraft/str-scoring.tsx` — Scoring/results view (NEW)
- `src/components/adcraft/str-review.tsx` — Review/summary phase (NEW)
- `src/components/adcraft/str-triage-arena.tsx` — Phase orchestrator (NEW)
- `src/app/page.tsx` — Added activeSimulation state, STR launch integration (UPDATED)
- `fixtures/str-triage-pack-1.json` — Fixed Infinity → 999.0 for JSON compatibility (UPDATED)

**Dependencies**: No new packages — TanStack Table, Zustand, Framer Motion all pre-installed
**Next Steps**: Build Bid Elevator simulation, implement Server Actions for grading persistence, add formula calculator widget

---

### [2026-06-04 00:07] — BID ELEVATOR SIMULATION — ✅ COMPLETE

**Task**: Build the interactive Bid Elevator simulation — the second playable simulation in AdCraft
**Details**:
- 4-phase simulation flow: Briefing → Arena → Scoring → Review
- Sequential scenario presentation — one bid decision at a time (vs. STR's all-at-once grid)
- 10 realistic bidding scenarios in Kitchen Gadgets category (same product as STR for consistency)
- Each scenario provides: keyword, match type, current bid, suggested range, performance data, market context
- Zustand store with full engine integration (`previewBidElevatorScore` for live preview, `evaluateBidElevator` for final scoring)
- Quick bid suggestions (Min/Rec/Max from Amazon suggested range)
- Visual bid comparison bar showing current bid, user bid, and suggested range
- Max profitable CPC hint calculated per scenario (AOV × CVR × Target ACoS)
- Per-decision timer tracking (decisionTimeMs recorded for each bid)
- Auto-advances to scoring when all 10 scenarios are completed
- Animated score circle, per-scenario feedback with expandable projected metrics
- Review phase with accuracy, acceptable bids count, avg decision time, XP earned
- Unlocked on Simulations tab alongside STR Triage Arena
- Color-coded amber theme (vs. STR's rose theme) for visual distinction

**Files Changed**:
- `fixtures/bid-elevator-pack-1.json` — 10-scenario bidding dataset (NEW)
- `src/stores/bid-elevator-store.ts` — Zustand store with engine integration (NEW)
- `src/components/adcraft/bid-elevator.tsx` — Phase orchestrator (NEW)
- `src/components/adcraft/bid-briefing.tsx` — Mission briefing with formula explanation (NEW)
- `src/components/adcraft/bid-arena.tsx` — Interactive scenario-by-scenario bidding (NEW)
- `src/components/adcraft/bid-scoring.tsx` — Scoring/results with per-scenario breakdown (NEW)
- `src/components/adcraft/bid-review.tsx` — Review/summary phase (NEW)
- `src/app/page.tsx` — Added Bid Elevator routing, unlocked in simulations view (UPDATED)

**Dependencies**: No new packages — uses existing Zustand, Framer Motion, shadcn/ui
**Next Steps**: Build Campaign Builder simulation, implement Server Actions for grading persistence, add formula calculator widget

---

### [2026-06-04 00:08] — CAMPAIGN BUILDER SIMULATION — ✅ COMPLETE

**Task**: Build the interactive Campaign Builder simulation — the third and final MVP simulation
**Details**:
- 4-phase simulation flow: Briefing → Workshop → Scoring → Review
- Form-based campaign builder (vs. STR's grid and Bid's sequential flow)
- Campaign settings: name, type (SP/SB/SD), targeting (manual/auto), bid strategy, budget, default bid, ad group, ASINs
- Keyword management: suggested keyword chips (15 with relevance scores), custom keyword adder, match type selector, bid inputs
- Negative keyword management: suggested negatives (5 with reasoning), custom negative adder
- Live preview score updating in real-time as campaign is built
- 5-criteria evaluation engine: Structure (25%), Keyword Selection (30%), Negative Keywords (20%), Bidding (15%), Budget (10%)
- Per-criterion scoring with expandable educational feedback
- Reference campaign comparison showing expert-built structures with reasoning
- Grade system (A-F) based on total score
- Emerald/teal color theme (vs. STR's rose and Bid's amber)
- Unlocked on Simulations tab alongside STR Triage and Bid Elevator
- All 3 MVP simulations now playable — simulation milestone at 100%

**Files Changed**:
- `fixtures/campaign-builder-pack-1.json` — Product context, 15 keywords, 5 negatives, 2 reference campaigns, 5 evaluation criteria (NEW)
- `src/stores/campaign-builder-store.ts` — Zustand store with full engine integration, 5-criteria evaluation, preview scoring (NEW)
- `src/components/adcraft/campaign-builder.tsx` — Phase orchestrator with AnimatePresence transitions (NEW)
- `src/components/adcraft/campaign-briefing.tsx` — Mission briefing with product context, formula card, objectives, tips (NEW)
- `src/components/adcraft/campaign-workshop.tsx` — Interactive campaign builder with settings panel, keyword chips, bid inputs (NEW)
- `src/components/adcraft/campaign-scoring.tsx` — Animated score reveal with 5 criterion cards and projected metrics (NEW)
- `src/components/adcraft/campaign-review.tsx` — Summary with grade, criteria table, reference comparison, XP (NEW)
- `src/app/page.tsx` — Added CampaignBuilder routing, unlocked in simulations view (UPDATED)

**Dependencies**: No new packages — uses existing Zustand, Framer Motion, shadcn/ui
**Next Steps**: Implement Server Actions for grading persistence, add formula calculator widget, continue MDX content authoring

---

### [2026-06-04 00:09] — SERVER ACTIONS (HYBRID EXECUTION) — ✅ COMPLETE

**Task**: Implement Server Actions for grading persistence, completing the hybrid execution model
**Details**:
- Created `/src/app/actions/simulation.ts` with 6 Server Actions:
  - `startAttempt` — Creates SimulationAttempt record (status: IN_PROGRESS) with auto-creation of simulation + user records
  - `gradeStrTriageAttempt` — Runs `evaluateStrTriage` server-side, persists official score, updates user XP
  - `gradeBidElevatorAttempt` — Runs `evaluateBidElevator` server-side, persists official score, updates user XP
  - `gradeCampaignBuilderAttempt` — Accepts client-side evaluation, runs verification score, persists, updates XP
  - `getAttemptHistory` — Retrieves past 20 attempts for a user/simulation
  - `getUserStats` — Returns user XP, level, total attempts, best scores per simulation type
- All Server Actions follow the `ActionResult<T>` pattern (success/error with code)
- Score discrepancy detection: if preview != official, `scoreDiscrepancy` flag is set
- XP system: score * 2 (max 200 XP per simulation), level-up every 500 XP
- MVP user ID hardcoded as `mvp-user-001` (no auth yet)
- Updated all 3 Zustand stores to integrate with Server Actions:
  - `startSimulation` now calls `startAttempt` (non-blocking) to get an `attemptId`
  - Submit functions now call the corresponding grade action (non-blocking) after client-side evaluation
  - New store fields: `officialScore`, `scoreDiscrepancy`, `xpEarned`, `attemptId`, `isGrading`
  - Server action failures are caught silently — simulation still works fully client-side
- Hybrid Execution Model is now fully operational:
  1. Client runs engine for instant preview (<100ms) — user sees score immediately
  2. Server runs the SAME engine function for authoritative grading
  3. Server result is persisted to the database via Prisma
  4. If scores diverge, `scoreDiscrepancy` flag is set

**Files Changed**:
- `src/app/actions/simulation.ts` — 6 Server Actions with Prisma persistence (NEW)
- `src/stores/str-triage-store.ts` — Added Server Action integration (startAttempt + gradeStrTriageAttempt) (UPDATED)
- `src/stores/bid-elevator-store.ts` — Added Server Action integration (startAttempt + gradeBidElevatorAttempt) (UPDATED)
- `src/stores/campaign-builder-store.ts` — Added Server Action integration (startAttempt + gradeCampaignBuilderAttempt) (UPDATED)

**Dependencies**: No new packages — uses existing Prisma + Server Actions
**Next Steps**: Formula calculator widget for Module 1, continue MDX content authoring

---

### [2026-06-04 14:30] — FORMULA CALCULATOR WIDGET — ✅ COMPLETE

**Task**: Build an interactive Formula Calculator widget for Module 1 (Foundations) that teaches the 7 core PPC metrics through hands-on computation
**Details**:
- Created `FormulaCalculator` component (~420 lines) — self-contained widget with React local state (no Zustand needed)
- Reads directly from the engine's `PPC_FORMULAS` registry and uses `computeFormula()` for live computation
- 7 Module 1 formulas: CPC, ACoS, TACoS, ROAS, CTR, CVR, AOV
- Features: formula selector tabs with category colors, interactive sliders + number inputs, live result with animated transitions, calculation trace (shows full substitution), health assessment with range breakdown, educational tips (insight/example/pitfall per formula), related formulas navigation
- Wired into Modules view in page.tsx as expandable section below Module 1 card
- Added `expandedModule` state to ModulesView — Formula Calculator appears with smooth AnimatePresence expand/collapse
- Changed Module 1 status from 'locked' to 'available' so the calculator button is visible
- Added `Calculator` icon import from lucide-react

**Files Changed**:
- `src/components/adcraft/formula-calculator.tsx` — New (420 lines)
- `src/app/page.tsx` — Updated (import + ModulesView rewrite with expandable calculator)

**Dependencies**: No new packages — uses existing engine functions + shadcn/ui components (Input, Slider)
**Next Steps**: Continue MDX content authoring, AI Mentor integration

---

### [2026-06-04 15:00] — MDX MODULE CONTENT — ✅ COMPLETE (Modules 0 + 1)

**Task**: Author all remaining MDX lesson content for Module 0 (Onboarding) and Module 1 (Foundations)
**Details**:
- Authored 7 new MDX lessons (2 for Module 0, 5 for Module 1)
- Module 0 complete (3/3 lessons): 0.1 Welcome, 0.2 Platform Tour, 0.3 First Simulation
- Module 1 complete (5/5 lessons): 1.1 Big Six Metrics, 1.2 CPC & CTR, 1.3 ACoS/TACoS/Profitability, 1.4 ROAS/AOV, 1.5 Metrics in Practice
- Each lesson includes frontmatter (title, slug, moduleNumber, lessonNumber, type, estimatedMinutes, xpReward)
- Content depth: 500–1200 words per lesson with formulas, tables, examples, diagnostic frameworks
- Lessons cross-reference the Formula Calculator widget

**Files Changed**:
- `content/modules/0-onboarding/0.2-platform-tour.mdx` — New (~750 words)
- `content/modules/0-onboarding/0.3-first-simulation.mdx` — New (~950 words)
- `content/modules/1-foundations/1.2-cpc-ctr.mdx` — New (~1100 words)
- `content/modules/1-foundations/1.3-acos-tacos-profitability.mdx` — New (~1200 words)
- `content/modules/1-foundations/1.4-roas-measuring-return.mdx` — New (~1000 words)
- `content/modules/1-foundations/1.5-metrics-in-practice.mdx` — New (~1200 words)

**Dependencies**: None
**Next Steps**: Module 4, 6, 7 content authoring, AI Mentor integration

---

### [2026-06-04 16:00] — MODULE CONTENT (MODULES 4, 6, 7) — ✅ COMPLETE

**Task**: Author all MDX lesson content for Module 4 (Campaign Architecture), Module 6 (Bidding Lab), and Module 7 (Search Term Triage)
**Details**:
- Authored 10 new MDX lessons across 3 modules (~12,330 words total)
- Module 4 complete (4/4 lessons): 4.1 Sponsored Products, 4.2 Sponsored Brands & Display, 4.3 Campaign Structure, 4.4 Campaign Architecture Practice
- Module 6 complete (3/3 lessons): 6.1 Bid Strategies, 6.2 Placement Adjustments, 6.3 Bid Elevator Prep
- Module 7 complete (3/3 lessons): 7.1 Search Term Analysis, 7.2 Negative Keywords, 7.3 STR Triage Prep
- All 19 lessons across 5 modules now complete — MDX Module Content milestone at 100%

**Files Changed**:
- `content/modules/4-campaign-architecture/4.1-sponsored-products.mdx` — New (~1,400 words)
- `content/modules/4-campaign-architecture/4.2-sponsored-brands-display.mdx` — New (~1,200 words)
- `content/modules/4-campaign-architecture/4.3-campaign-structure.mdx` — New (~1,350 words)
- `content/modules/4-campaign-architecture/4.4-campaign-architecture-practice.mdx` — New (~900 words)
- `content/modules/6-bidding-lab/6.1-bid-strategies.mdx` — New (~1,400 words)
- `content/modules/6-bidding-lab/6.2-placement-adjustments.mdx` — New (~1,200 words)
- `content/modules/6-bidding-lab/6.3-bid-elevator-prep.mdx` — New (~800 words)
- `content/modules/7-search-term-triage/7.1-search-term-analysis.mdx` — New (~1,500 words)
- `content/modules/7-search-term-triage/7.2-negative-keywords.mdx` — New (~1,280 words)
- `content/modules/7-search-term-triage/7.3-str-triage-prep.mdx` — New (~800 words)

**Dependencies**: None
**Next Steps**: Module Progress Tracking, AI Mentor integration, Dashboard → Real Data wiring

---

### [2026-06-04 17:00] — BUG FIX: SERVER ACTIONS + LESSON NAVIGATION — ✅ COMPLETE

**Task**: Fix "Invalid Server Actions request" runtime error and module click navigation bug
**Details**:
- **ERR-005 (Critical)**: Both `'use server'` files exported TypeScript types alongside async functions. Next.js 16 enforces that `'use server'` files can ONLY export async functions — non-function exports corrupt the Server Actions binding at runtime, causing "Invalid Server Actions request" on every server action call.
  - Created `src/app/actions/types.ts` (no `'use server'`) for all shared type definitions
  - Refactored `lesson.ts` and `simulation.ts` to import types from `./types` and only export async functions
  - Updated consumers (`lesson-player.tsx`, `str-triage-store.ts`) to import types from the shared file
- **ERR-006 (High)**: `findLessonFile()` searched for files starting with `${lessonOrder}.` which failed for Module 0 where files are named `0.1-welcome.mdx` (searching for "1." doesn't match "0.1-"). Fixed to use `${moduleNumber}.${lessonOrder}` prefix.
- Lesson Player now works: clicking a module card → `onOpenLesson` → `LessonPlayer` calls `listModuleLessons` + `getLessonContent` server actions → renders MDX content with navigation

**Files Changed**:
- `src/app/actions/types.ts` — NEW: shared types extracted from server action files
- `src/app/actions/lesson.ts` — Removed type exports, fixed findLessonFile prefix
- `src/app/actions/simulation.ts` — Removed type exports
- `src/components/adcraft/lesson-player.tsx` — Updated LessonMeta import to use types.ts
- `src/stores/str-triage-store.ts` — Removed unused type import

**Dependencies**: None
**Next Steps**: Module Progress Tracking (lesson completion persistence), AI Mentor integration

---

### [2026-06-04 18:00] — MODULE PROGRESS TRACKING — ✅ COMPLETE

**Task**: Implement lesson completion persistence and module progress tracking, transforming the app from session-only state to resumable, persisted learning journeys.
**Details**:
- Created `src/app/actions/progress.ts` with 3 Server Actions:
  - `markLessonComplete(moduleNumber, lessonNumber)` — Upserts LessonProgress, awards 50 XP per lesson, auto-creates Module/Lesson/User records if they don't exist, updates ModuleProgress status (IN_PROGRESS → COMPLETED), updates User XP and level, idempotent (no double XP on re-click)
  - `getLessonProgress(moduleNumber)` — Returns completed lessons for a specific module from the DB, returns NOT_STARTED for all lessons if module not yet in DB
  - `getProgressOverview()` — Full dashboard-ready data: XP, level, streak days, modules completed, sims passed, per-module progress with completion counts, best simulation scores
- Added `MODULE_META` constant mapping all 5 module numbers (0, 1, 4, 6, 7) to their metadata (slug, title, icon, color, description, totalLessons) — mirrors the MDX content structure
- All progress types defined in `src/app/actions/types.ts`: MarkLessonCompleteOutput, LessonProgressItem, ModuleProgressItem, ProgressOverview
- Auto-seeding pattern: Module, Lesson, and User records are created on first access rather than requiring a separate migration — this simplifies the bootstrapping process
- Idempotent completion: calling `markLessonComplete` on an already-completed lesson returns success with `xpEarned: 0` instead of double-awarding XP

**Files Changed**:
- `src/app/actions/progress.ts` — 3 Server Actions with Prisma persistence (NEW)
- `src/app/actions/types.ts` — Added MarkLessonCompleteOutput, LessonProgressItem, ModuleProgressItem, ProgressOverview types (UPDATED)

**Dependencies**: No new packages — uses existing Prisma + Server Actions
**Next Steps**: Wire dashboard components to real data, AI Mentor integration

---

### [2026-06-04 18:30] — DASHBOARD → REAL DATA — ✅ COMPLETE

**Task**: Replace all hardcoded placeholder values in the dashboard with real data from the database via Server Actions.
**Details**:
- Rewrote `dashboard.tsx` to fetch `getProgressOverview()` on mount, passing real data to all child components (StatsRow, ModuleCards). Added loading state with spinner while data loads.
- Refactored `stats-row.tsx` from hardcoded values to accept props: modulesCompleted, totalModules, simsPassed, totalSims, streakDays, totalXP — all now driven by database queries
- Rewrote `module-cards.tsx` to accept optional `moduleProgress` prop (ModuleProgressItem[]), showing real completion percentages and dynamic status badges (NOT_STARTED / IN_PROGRESS / COMPLETED) instead of static hardcoded values
- Updated `lesson-player.tsx` to integrate progress tracking:
  - Calls `getLessonProgress(moduleNumber)` on mount to load persisted state (resume from where user left off)
  - Calls `markLessonComplete(moduleNumber, currentOrder)` on "Mark Complete" button click with saving spinner
  - Shows green checkmark on completed lessons in the navigation bar
  - Displays module progress bar with real completion count
- Updated `page.tsx` to load XP/level from DB on mount via `getUserStats`, refresh dashboard data when lessons complete using a refresh key

**Files Changed**:
- `src/components/adcraft/dashboard.tsx` — Rewritten: fetches getProgressOverview, passes real data (UPDATED)
- `src/components/adcraft/stats-row.tsx` — Refactored: accepts real data props instead of hardcoded values (UPDATED)
- `src/components/adcraft/module-cards.tsx` — Rewritten: accepts moduleProgress prop, shows real completion % (UPDATED)
- `src/components/adcraft/lesson-player.tsx` — Rewritten: integrates progress tracking server actions (UPDATED)
- `src/app/page.tsx` — Updated: loads XP/level from DB, refreshes on completion (UPDATED)

**Dependencies**: No new packages
**Next Steps**: AI Mentor integration with real LLM

---

### [2026-06-04 19:00] — AI MENTOR INTEGRATION — ✅ COMPLETE

**Task**: Replace the mock AI Mentor chat with a real LLM-powered PPC coaching assistant using z-ai-web-dev-sdk.
**Details**:
- Created `src/app/actions/mentor.ts` with `chatWithMentor` Server Action:
  - Uses `z-ai-web-dev-sdk` (ZAI.create()) to call the LLM chat completions API
  - Production-ready PPC Mentor system prompt with 12 PPC rule references (ACOS_THRESHOLD, CPC_MAX, ROAS_BENCHMARK, etc.) that the AI cites by ID when explaining decisions
  - Input sanitization: strips HTML tags, limits message to 2000 characters
  - Chat history management: includes last 10 messages for context window management, each limited to 1000 characters
  - Context-aware: accepts module and lesson context string to personalize responses
  - Safety guardrails: explicit anti-black-hat response template, "INSUFFICIENT DATA" rule for guessing prevention
  - Response format: Direct answer → Rule citation → Example → Next step
  - Tracks latency in milliseconds for display in the UI
- Rewrote `mentor-chat.tsx` from mock to real LLM integration:
  - Calls `chatWithMentor` Server Action with message, chat history, and context
  - Context builder: sends current module number and lesson slug to the LLM for personalized coaching
  - Typing indicator with animated bouncing dots while waiting for AI response
  - Latency display per message (shows ms after each AI response)
  - Online/Thinking status indicator in header
  - Suggested questions for first-time users (4 PPC topic suggestions)
  - Error handling with distinct error message styling
  - Smooth message animations with Framer Motion
- Added MentorChatOutput type to `src/app/actions/types.ts`
- AI Mentor milestone upgraded from Placeholder (10%) to Live (90%) — streaming not yet implemented

**Files Changed**:
- `src/app/actions/mentor.ts` — AI Mentor Server Action with z-ai-web-dev-sdk (NEW)
- `src/components/adcraft/mentor-chat.tsx` — Rewritten: real LLM integration replacing mock (UPDATED)
- `src/app/actions/types.ts` — Added MentorChatOutput type (UPDATED)

**Dependencies**: z-ai-web-dev-sdk (already installed)
**Next Steps**: AI Mentor streaming (SSE via API route), Testing & QA, Auth

---

### [2026-06-04 20:00] — RENDERING FIX: DARK MODE + MOBILE + DATA BUGS — ✅ COMPLETE

**Task**: Fix mobile rendering issues — dark mode not applying, sidebar visible on mobile, dashboard stuck on loading for new users
**Details**:
- **ERR-007 (High)**: `getUserStats()` returned `{ success: false, error: 'User not found' }` for first-time users, causing the dashboard to hang on "Loading..." indefinitely. Fixed by auto-creating the user record (same pattern as `getProgressOverview`). Also added `.catch()` handlers to page.tsx and dashboard.tsx useEffect calls.
- **Sidebar mobile fix**: Restructured sidebar className to avoid `flex`/`hidden` class merging conflict in Tailwind v4. Used `hidden lg:flex` as base display rule with `!flex` for mobile-open override, moved `flex-direction: column` to inline style.
- **Dark mode CSS fallback**: Added `html.dark { background-color: var(--background); color: var(--foreground); }` to `@layer base` block. Ensures dark background applies at html element level regardless of component class specificity.
- **Tailwind config cleanup**: Removed stale v3-style `theme.extend.colors` from `tailwind.config.ts` — these were being ignored by Tailwind v4 (which uses `@theme inline` in globals.css). Retained file only for `tailwindcss-animate` plugin compatibility.
- **Operator precedence fix**: Fixed `(overview?.modulesCompleted ?? 0) > 0` in dashboard quick actions — the original `overview?.modulesCompleted ?? 0 > 0` evaluated incorrectly due to `??` having lower precedence than `>`.
- **Dashboard error handling**: Added error state with retry button to Dashboard component for when `getProgressOverview()` fails. Previously showed infinite loading spinner on error.

**Files Changed**:
- `src/app/actions/simulation.ts` — getUserStats auto-creates user (UPDATED)
- `src/components/adcraft/sidebar.tsx` — Restructured className for mobile robustness (REWRITTEN)
- `src/components/adcraft/dashboard.tsx` — Added error state, fixed operator precedence (UPDATED)
- `src/app/page.tsx` — Added .catch() to getUserStats useEffect (UPDATED)
- `src/app/globals.css` — Added html.dark fallback rule (UPDATED)
- `tailwind.config.ts` — Cleaned up stale v3 theme.extend.colors (UPDATED)

**Dependencies**: No new packages
**Next Steps**: AI Mentor streaming, Testing & QA, Auth

---

### [2026-06-04 21:00] — TESTING & QA — ✅ CORE COMPLETE

**Task**: Build testing infrastructure with Vitest unit tests, property-based tests, and Playwright E2E smoke tests.
**Details**:
- Installed testing dependencies: vitest, fast-check, @playwright/test, @vitejs/plugin-react
- Created vitest.config.ts with path alias resolution and node environment
- Created src/engine/formulas.test.ts (65 tests): 54 deterministic unit tests, 7 property-based tests with fast-check, 4 formula registry tests
- Created src/engine/evaluation.test.ts (38 tests): STR Triage (7 eval, 3 preview, 5 validation), Bid Elevator (5 eval, 2 preview), Campaign Builder (4 preview, 8 validation), 3 property-based score bounds tests
- Created e2e/smoke.spec.ts (9 Playwright E2E tests): dashboard, modules, simulations, mentor, lesson, dark mode, XP, quick actions, sidebar
- All 103 unit tests passing, all 9 E2E tests passing
- Total: 112 tests

**Files Changed**:
- `vitest.config.ts` — Vitest configuration (NEW)
- `src/engine/formulas.test.ts` — 65 formula tests (NEW)
- `src/engine/evaluation.test.ts` — 38 evaluation tests (NEW)
- `e2e/smoke.spec.ts` — 9 E2E smoke tests (NEW)
- `package.json` — Added test scripts and dependencies (UPDATED)

**Dependencies**: vitest, fast-check, @playwright/test, @vitejs/plugin-react
**Next Steps**: Auth (NextAuth.js), final testing polish

---

### [2026-06-04 22:00] — AUTHENTICATION (NEXTAUTH) — ✅ COMPLETE

**Task**: Replace hardcoded mvp-user-001 with real authentication using NextAuth.js Credentials provider.
**Details**:
- Installed bcryptjs + @types/bcryptjs for password hashing
- Updated Prisma schema: added `passwordHash` (nullable) to User model
- Created `src/lib/auth.ts` — NextAuth v4 config with Credentials provider, JWT strategy (30-day expiry), callbacks (id/role in token), bcrypt password comparison, hashPassword helper
- Created `src/app/api/auth/[...nextauth]/route.ts` — NextAuth API route handler (GET + POST)
- Created `src/app/api/auth/signup/route.ts` — POST endpoint for user registration (email/password validation, duplicate check, bcrypt hashing)
- Created `src/components/providers/session-provider.tsx` — Client-side AuthProvider wrapping next-auth/react SessionProvider
- Updated `src/app/layout.tsx` — Wrapped children with AuthProvider
- Created `src/app/auth/signin/page.tsx` — Custom sign-in page with email/password form, error display, sign-up link
- Created `src/app/auth/signup/page.tsx` — Registration page with name/email/password/confirm, password strength meter, auto sign-in after registration
- Created `src/middleware.ts` — JWT-based route protection, redirects unauthenticated users to /auth/signin, public paths excluded
- Created `src/lib/auth-guard.ts` — Server-side helper: getAuthUserId() using getServerSession(authOptions)
- Updated all server actions (progress.ts, simulation.ts, mentor.ts) — Replaced hardcoded MVP_USER_ID with session-based userId via getAuthUserId()
- Fixed critical bug: updateUserXP() now accepts userId parameter instead of always using MVP_USER_ID
- Updated 3 Zustand stores — startSimulation() accepts optional userId parameter
- Updated 3 briefing components — Use useSession() to get userId, pass to startSimulation(userId)
- Updated sidebar, dashboard, page.tsx — Use useSession() for user name and sign-out functionality
- Added NEXTAUTH_SECRET and NEXTAUTH_URL to .env

**Files Changed**:
- `src/lib/auth.ts` — NextAuth configuration (NEW)
- `src/lib/auth-guard.ts` — Server-side auth helpers (NEW)
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth API route (NEW)
- `src/app/api/auth/signup/route.ts` — Signup API endpoint (NEW)
- `src/components/providers/session-provider.tsx` — AuthProvider wrapper (NEW)
- `src/app/auth/signin/page.tsx` — Custom sign-in page (NEW)
- `src/app/auth/signup/page.tsx` — Custom sign-up page (NEW)
- `src/middleware.ts` — Route protection middleware (NEW)
- `prisma/schema.prisma` — Added passwordHash to User (UPDATED)
- `src/app/layout.tsx` — Wrapped with AuthProvider (UPDATED)
- `src/app/actions/progress.ts` — Session-based userId (UPDATED)
- `src/app/actions/simulation.ts` — Session-based userId, updateUserXP fix (UPDATED)
- `src/app/actions/mentor.ts` — Removed MVP_USER_ID (UPDATED)
- 3 Zustand stores, 3 briefings, sidebar, dashboard, page.tsx — All updated for auth

**Dependencies**: bcryptjs, @types/bcryptjs, next-auth
**Next Steps**: Fix sign-in bug (ERR-008), AI Mentor streaming

---

### [2026-06-04 23:00] — BUG FIX: SIGN-IN REDIRECT (ERR-008) — ✅ COMPLETE

**Task**: Fix sign-in bug where users could create accounts but couldn't sign in — session cookie not persisted.
**Details**:
- Diagnosed root cause: Both sign-in and sign-up pages used `signIn('credentials', { redirect: false })` from NextAuth v4
- The fetch-based approach doesn't reliably persist session cookies in certain browser/proxy configurations (especially behind reverse proxies)
- Fixed sign-in page: switched to default redirect behavior (`signIn('credentials', { callbackUrl })`) for full page navigation
- Fixed sign-up page: same switch from `redirect: false` to default redirect
- Added `useSearchParams()` Suspense boundary (required by Next.js 16)
- Added NextAuth error code mapping: "CredentialsSignin" → "Invalid email or password"
- Removed all mvp-user-001 hardcoded fallbacks from server actions (14 instances)
- Server actions now return `{ success: false, code: 'UNAUTHENTICATED' }` when no session exists

**Files Changed**:
- `src/app/auth/signin/page.tsx` — Default redirect + Suspense + error mapping (UPDATED)
- `src/app/auth/signup/page.tsx` — Default redirect (UPDATED)
- `src/app/actions/progress.ts` — Removed mvp-user-001 fallbacks (UPDATED)
- `src/app/actions/simulation.ts` — Removed mvp-user-001 fallbacks (UPDATED)
- `src/app/actions/mentor.ts` — Removed mvp-user-001 references (UPDATED)

**Dependencies**: None new
**Next Steps**: AI Mentor streaming, deployment hardening

---

## Milestone Tracker

| Milestone | Target Date | Status | Completion % |
|-----------|------------|--------|-------------|
| Project Setup & Documentation | 2026-06-04 | ✅ Complete | 100% |
| Architecture Resolution | 2026-06-04 | ✅ Complete | 100% |
| MVP Scope Definition | 2026-06-04 | ✅ Complete | 100% |
| Deterministic Engine (`/src/engine/`) | 2026-06-04 | ✅ Core Complete | 75% |
| Database (Prisma Schema) | 2026-06-04 | ✅ Complete | 100% |
| Frontend App Shell | 2026-06-04 | ✅ Complete | 100% |
| STR Triage Arena Simulation | 2026-06-04 | ✅ Playable | 100% |
| Bid Elevator Simulation | 2026-06-04 | ✅ Playable | 100% |
| Campaign Builder Simulation | 2026-06-04 | ✅ Playable | 100% |
| Module Content (MDX) | 2026-06-04 | ✅ Complete | 100% |
| AI Mentor Integration | 2026-06-04 | ✅ Enhanced | 95% |
| Server Actions (Persistence) | 2026-06-04 | ✅ Complete | 100% |
| Formula Calculator Widget | 2026-06-04 | ✅ Complete | 100% |
| Lesson Player (MDX Rendering) | 2026-06-04 | ✅ Working | 100% |
| Module Progress Tracking | 2026-06-04 | ✅ Complete | 100% |
| Dashboard → Real Data | 2026-06-04 | ✅ Complete | 100% |
| Testing & QA | 2026-06-04 | ✅ Core Complete | 75% |
| Authentication (NextAuth) | 2026-06-04 | ✅ Complete | 100% |
| MVP Release | - | Not Started | 0% |

---

## Architecture Decisions Log

| # | Decision | Rationale | Date | ADR | Status |
|---|----------|-----------|------|-----|--------|
| 1 | Next.js 16 as framework | SSR, API routes, full-stack capability | 2026-06-04 | - | Active |
| 2 | shadcn/ui for components | Consistent, accessible, customizable | 2026-06-04 | - | Active |
| 3 | Prisma + PostgreSQL | Type-safe ORM, relational data model | 2026-06-04 | - | Active |
| 4 | z-ai-web-dev-sdk for AI | Integrated LLM access, no external API keys | 2026-06-04 | - | Active |
| 5 | ~~FastAPI as core backend~~ | ~~Python ecosystem needed~~ | 2026-06-04 | - | ❌ Superseded |
| 6 | ~~Redis for simulation state~~ | ~~Event sourcing, sessions~~ | 2026-06-04 | - | ❌ Superseded |
| 7 | ~~Dual-stack architecture~~ | ~~Loose coupling~~ | 2026-06-04 | - | ❌ Superseded |
| 8 | ~~pgvector for RAG~~ | ~~Ground AI in rules~~ | 2026-06-04 | - | ⏳ Deferred |
| 9 | **Monolith-First Next.js** | Eliminates C-01 through C-05; single deploy | 2026-06-04 | ADR-001 | ✅ Active |
| 10 | **Postgres JSONB for state** | Replaces Redis for MVP | 2026-06-04 | ADR-001 | ✅ Active |
| 11 | **Pure TS Deterministic Engine** | Extractable, testable, zero framework deps | 2026-06-04 | ADR-001 | ✅ Active |
| 12 | **Hybrid Execution Model** | Client preview + server authoritative | 2026-06-04 | ADR-001 | ✅ Active |
| 13 | **Pre-generated JSON fixtures** | No runtime synthetic data needed for MVP | 2026-06-04 | - | ✅ Active |

---

*Last updated: 2026-06-04 — Added Testing & QA, Auth, ERR-008 entries; updated milestone tracker*
