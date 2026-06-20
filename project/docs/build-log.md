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

### [2026-06-04 18:00] — MODULE PROGRESS TRACKING + DASHBOARD REAL DATA — ✅ COMPLETE

**Task**: Implement lesson completion persistence and wire the dashboard to real database data
**Details**:
- Created `src/app/actions/progress.ts` with `markLessonComplete`, `getLessonProgress`, `getProgressOverview` server actions
- Dashboard stats row, XP bar, and module cards now read from real DB data via `getUserStats` and `getProgressOverview`
- Simulation cards dynamically unlock based on module progress
- Auto-creates user records on first access (same pattern as `getUserStats`)
- All server actions properly handle the "first visit" case

**Files Changed**:
- `src/app/actions/progress.ts` — Progress server actions (NEW)
- `src/components/adcraft/dashboard.tsx` — Wired to real data (UPDATED)
- `src/app/page.tsx` — Updated to use real progress data (UPDATED)

**Dependencies**: No new packages
**Next Steps**: AI Mentor integration, testing, deployment hardening

---

### [2026-06-04 20:00] — AI MENTOR INTEGRATION — ✅ COMPLETE

**Task**: Build the AI Mentor chat with real LLM integration via z-ai-web-dev-sdk
**Details**:
- Created `src/app/actions/mentor.ts` with `chatWithMentor` server action using z-ai-web-dev-sdk
- System prompt: PPC expert tutor with pedagogical constraints (no financial guarantees, no black-hat, Amazon TM compliant)
- Context-aware: receives module and lesson context for relevant responses
- Conversation management: stores chat history, supports multi-turn conversations
- Markdown rendering in chat bubbles with code blocks, tables, and formulas
- Copy message and clear conversation UX actions
- AI Mentor milestone: 10% → 95% (streaming was the last 5%)

**Files Changed**:
- `src/app/actions/mentor.ts` — AI Mentor server action (NEW)
- `src/components/adcraft/mentor-chat.tsx` — Full rewrite with real LLM (UPDATED)
- `src/app/api/mentor/stream/route.ts` — SSE streaming API route (NEW)

**Dependencies**: z-ai-web-dev-sdk (pre-installed)
**Next Steps**: AI Mentor streaming (SSE), deployment hardening

---

### [2026-06-04 22:00] — AI MENTOR STREAMING (SSE) — ✅ COMPLETE

**Task**: Add real-time token-by-token streaming to the AI Mentor via Server-Sent Events
**Details**:
- Created `/api/mentor/stream` POST endpoint that calls z-ai-web-dev-sdk with `stream: true`
- Transforms upstream SSE stream into custom events: `token`, `done`, `error`
- Client-side streaming via `fetch()` + `ReadableStream.getReader()`
- StreamingCursor component (blinking `|` during generation)
- AbortController for cancel support + Stop button
- Status indicator: "Online" (green) → "Streaming..." (amber)
- Dual-path: streaming API route + non-streaming Server Action fallback

**Files Changed**:
- `src/app/api/mentor/stream/route.ts` — SSE streaming API route (NEW)
- `src/components/adcraft/mentor-chat.tsx` — Rewrote message sending for streaming (UPDATED)

**Dependencies**: No new packages — z-ai-web-dev-sdk already supports streaming
**Next Steps**: Auth, testing, deployment hardening

---

### [2026-06-05 10:00] — AUTHENTICATION (NEXTAUTH) — ✅ COMPLETE

**Task**: Implement authentication with NextAuth Credentials provider, replacing hardcoded mvp-user-001
**Details**:
- NextAuth v4 with Credentials provider (email/password)
- Sign-in and sign-up pages with form validation
- JWT sessions with `NEXTAUTH_SECRET`
- Middleware route protection — redirects unauthenticated users to `/auth/signin`
- All server actions use `getAuthUserId()` from session — no more mvp-user-001 fallbacks
- Server actions return `{ success: false, code: 'UNAUTHENTICATED' }` when no session exists
- ERR-008 fix: switched from `redirect: false` to default redirect behavior for reliable cookie persistence
- Removed 14 instances of hardcoded mvp-user-001 across 3 server action files

**Files Changed**:
- `src/app/auth/signin/page.tsx` — Sign-in page (NEW)
- `src/app/auth/signup/page.tsx` — Sign-up page (NEW)
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth handler (NEW)
- `src/middleware.ts` — Route protection middleware (NEW)
- `src/app/actions/simulation.ts` — Replaced mvp-user-001 with getAuthUserId() (UPDATED)
- `src/app/actions/progress.ts` — Replaced mvp-user-001 with getAuthUserId() (UPDATED)
- `src/app/actions/mentor.ts` — Replaced mvp-user-001 with getAuthUserId() (UPDATED)

**Dependencies**: nextauth (added)
**Next Steps**: Testing, deployment hardening

---

### [2026-06-05 14:00] — TESTING & QA — ✅ COMPLETE

**Task**: Comprehensive testing of evaluation engine and critical user journeys
**Details**:
- 103 Vitest unit + property tests for evaluation engine
  - All 9 PPC formulas with boundary cases (zero spend, zero clicks, infinity ACoS)
  - Evaluation functions for all 3 simulations (STR Triage, Bid Elevator, Campaign Builder)
  - Property-based tests with fast-check (commutative, idempotent, no NaN/Infinity for valid inputs)
- 9 Playwright E2E smoke tests
  - Sign-up → sign-in → dashboard loads → navigate to lessons → read lesson → launch sim → complete sim
  - Confirmed timing fixes from ERR-007 (getUserStats auto-create user)

**Files Changed**:
- `src/engine/__tests__/formulas.test.ts` — Formula unit tests (NEW)
- `src/engine/__tests__/evaluation.test.ts` — Evaluation unit tests (NEW)
- `src/engine/__tests__/property.test.ts` — Property-based tests (NEW)
- `e2e/smoke.spec.ts` — Playwright E2E smoke tests (NEW)

**Dependencies**: vitest, @playwright/test (added as dev dependencies)
**Next Steps**: Deployment hardening, MVP Release Candidate

---

### [2026-06-05 16:00] — DEPLOYMENT HARDENING — ✅ COMPLETE

**Task**: Production hardening — security headers, rate limiting, env validation, error handling
**Details**:
- Rate limiting on AI Mentor API route (10 req/min per user, in-memory sliding window)
- Environment variable validation at startup (`validateEnv()`) — fails fast with clear error messages
- Structured logging utility (`logger`) with timestamp, level, context, request ID
- Security headers via `next.config.ts`: CSP (production-only), X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin
- Cookie hardening: `secure: true`, `sameSite: 'lax'` on NextAuth sessions
- CORS headers on streaming API route
- Global Error Boundary component (friendly fallback instead of white screen)
- `/api/health` endpoint for uptime monitoring
- Database backup script (`scripts/backup-db.sh`)
- `.env.example` documenting all required/optional environment variables
- Migration guide for SQLite → PostgreSQL transition

**Files Changed**:
- `next.config.ts` — Security headers (UPDATED)
- `src/lib/rate-limit.ts` — Rate limiting utility (NEW)
- `src/lib/logger.ts` — Structured logging (NEW)
- `src/lib/validate-env.ts` — Environment validation (NEW)
- `src/components/adcraft/error-boundary.tsx` — Global error boundary (NEW)
- `src/app/api/health/route.ts` — Health check endpoint (NEW)
- `scripts/backup-db.sh` — Database backup script (NEW)
- `.env.example` — Environment variable documentation (NEW)
- `docs/reference/migration-guide.md` — SQLite → PostgreSQL migration guide (NEW)

**Dependencies**: No new packages
**Next Steps**: MVP Release Candidate — all features shipped and deployment-hardened

---

### [2026-06-06 10:00] — POST-MVP: A4 LESSON QUIZZES — ✅ COMPLETE

**Task**: Add knowledge-check assessments to the end of each learning module
**Details**:
- 3 new Prisma models: `Quiz`, `QuizQuestion`, `QuizAttempt` + `AttemptStatus` enum
- Quiz fixture: 30 questions across 5 modules (5–8 questions each)
- Server actions: `getQuiz`, `submitQuiz`, `getQuizHistory`
- QuizPlayer component: 4-phase UI (Ready → Answering → Submitted → Review)
- Quiz-as-gate: lesson only marked complete when quiz is passed (70% threshold)
- 100 XP awarded on first quiz pass; subsequent passes earn 0 XP
- Lazy seed pattern: quizzes seeded from `fixtures/quizzes.json` on first access
- Module cards updated with "Quiz" badge indicator
- Anti-cheating: `getQuiz` strips `correctAnswer` from question data
- Server-side grading: all scoring happens in `submitQuiz` action

**Files Changed**:
- `prisma/schema.prisma` — Added Quiz, QuizQuestion, QuizAttempt models (UPDATED)
- `src/app/actions/quiz.ts` — Quiz server actions (NEW)
- `src/app/actions/types.ts` — Added 7 quiz types (UPDATED)
- `src/components/adcraft/quiz-player.tsx` — Interactive quiz UI (NEW)
- `src/components/adcraft/lesson-player.tsx` — Quiz type detection + QuizPlayer handoff (UPDATED)
- `src/components/adcraft/module-cards.tsx` — Quiz badge indicator (UPDATED)
- `fixtures/quizzes.json` — 30 quiz questions across 5 modules (NEW)
- `docs/atomic-builds/A4-lesson-quizzes.md` — Atomic build documentation (NEW)

**Dependencies**: No new packages
**Next Steps**: A1 Achievement Badges, A2 Daily Streaks

---

### [2026-06-06 14:00] — POST-MVP: A1 ACHIEVEMENT BADGES — ✅ COMPLETE

**Task**: Add gamification layer with 17 badges across 5 categories, auto-awarded on key actions
**Details**:
- 2 new Prisma models: `Badge`, `UserBadge` + `BadgeCategory`, `BadgeTier` enums
- Badge fixture: 17 badges — Engagement (3), Mastery (6), XP Milestone (4), Streak (2), Social (2)
- 4 badge tiers: Bronze → Silver → Gold → Platinum
- 3 secret badges: Sim Trifecta, Perfectionist, Mentor Regular (hidden until earned)
- Server actions: `getBadges`, `checkAndAwardBadges` with `evaluateCriteria()` function
- BadgeShowcase component: grid by category, detail modal, notification toast
- Integration across 5 server actions: progress.ts, quiz.ts, simulation.ts, mentor.ts
- Badge check failures never block main action (try/catch pattern)
- Lazy seed pattern: badges seeded from `fixtures/badges.json` on first access
- XP bonuses: Bronze (+25/+50), Silver (+75/+100), Gold (+100/+150/+200), Platinum (+500)

**Files Changed**:
- `prisma/schema.prisma` — Added Badge, UserBadge models + enums (UPDATED)
- `src/app/actions/badge.ts` — Badge server actions (NEW)
- `src/app/actions/types.ts` — Added 2 badge types (UPDATED)
- `src/app/actions/progress.ts` — Added checkAndAwardBadges() after lesson completion (UPDATED)
- `src/app/actions/quiz.ts` — Added checkAndAwardBadges() after quiz submission (UPDATED)
- `src/app/actions/simulation.ts` — Added checkAndAwardBadges() after sim grading (UPDATED)
- `src/app/actions/mentor.ts` — Added checkAndAwardBadges() after mentor chat (UPDATED)
- `src/components/adcraft/badge-showcase.tsx` — Badge grid + modal + toast (NEW)
- `src/components/adcraft/dashboard.tsx` — Added BadgeShowcase (dynamic import) (UPDATED)
- `fixtures/badges.json` — 17 badge definitions (NEW)
- `docs/atomic-builds/A1-achievement-badges.md` — Atomic build documentation (NEW)

**Dependencies**: No new packages
**Next Steps**: A2 Daily Streaks, A3 Leaderboard

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
| AI Mentor Integration | 2026-06-04 | ✅ Complete | 100% |
| Server Actions (Persistence) | 2026-06-04 | ✅ Complete | 100% |
| Formula Calculator Widget | 2026-06-04 | ✅ Complete | 100% |
| Lesson Player (MDX Rendering) | 2026-06-04 | ✅ Working | 100% |
| Module Progress Tracking | 2026-06-04 | ✅ Complete | 100% |
| Dashboard → Real Data | 2026-06-04 | ✅ Complete | 100% |
| Authentication (NextAuth) | 2026-06-05 | ✅ Complete | 100% |
| Testing & QA | 2026-06-05 | ✅ Core Complete | 75% |
| Deployment Hardening | 2026-06-05 | ✅ Complete | 100% |
| MVP Release Candidate | 2026-06-05 | ✅ Shipped | 100% |
| A4: Lesson Quizzes | 2026-06-06 | ✅ Shipped | 100% |
| A1: Achievement Badges | 2026-06-06 | ✅ Shipped | 100% |

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

*Last updated: 2026-06-07*
