# Sessions 1–5 — Foundation & Architecture

> AdCraft Development Diary — Sessions 1 through 5

---

## Session 1 — 2026-06-04 — Project Initialization & Documentation

**Duration**: ~30 minutes
**Mood**: 🎉 Excited to start

**Goal**: Set up the project foundation — read the PRD, install development tools, create documentation suite.

**What Happened**:
Kicked off the AdCraft build by first extracting the full PRD from the Qwen chat link. The original conversation covered an enormous amount of ground — the Master PRD v2.0, a detailed implementation blueprint, a comprehensive UI/UX specification, identification of 6 critical missing components, and full operational execution drafts including legal docs, content supply chain SOPs, and more. All told, roughly 142,000 characters of product planning content.

After reviewing the full scope, the user asked to install 6 GitHub skill repos to beef up development capabilities. We cloned and installed all 6:
- The antigravity-awesome-skills repo contributed a massive 1,377 new skills
- The cc-thingz repo added 4 new skills plus a hooks system (10 hooks including git guardrails, smart lint, test runner)
- The fullstack-starter contributed its new-feature workflow skill
- The other three were either already installed or reference-only awesome lists

Then we created this documentation suite — README, build-log, error-log, and this diary. The idea is to maintain these meticulously throughout the entire build, updating after every run so we never lose context.

**Wins**:
- Successfully extracted 142K+ characters of PRD content from a JavaScript-rendered Qwen chat page
- Installed 1,382+ new skills in one batch with zero errors
- Clean documentation foundation established from day one
- All 6 repos installed and verified

**Struggles**:
- The Qwen chat page required Playwright headless browser to extract content (SPA with dynamic loading)
- Had to carefully check which skills already existed to avoid overwriting customizations

**Learnings**:
- The PRD is extremely detailed and covers everything from curriculum design to legal compliance — this is a well-thought-out product
- The skill ecosystem is massive (1,630 skills total now) — will be selective about which ones to invoke
- Documentation-first approach will pay dividends as the project grows

**Next Session Plan**:
- Initialize the Next.js project with fullstack-dev skill
- Set up the design system (color palette, typography, spacing from the UI/UX spec)
- Create the database schema with Prisma
- Build the main app shell (layout, navigation, sidebar)

---

## Session 2 — 2026-06-04 — Agent Specification & Architecture Refinement

**Duration**: ~20 minutes
**Mood**: 😊 Focused and structured

**Goal**: Formalize the development agent team and update project architecture to match the agents spec.

**What Happened**:
The user provided a comprehensive 6-agent specification that defines who builds what. This is a pivotal document — it shifts the project from "I'll figure it out as I go" to "here's the team, here's the workflow, here's the output." Each agent has specific skills, responsibilities, and artifacts they're accountable for.

The biggest architectural insight from the spec: the backend is **FastAPI**, not Next.js API routes. The agents spec calls for a Python backend with Pydantic V2, Pandas/Numpy, and property-based testing (Hypothesis) — all things that need the Python ecosystem. Next.js API routes become the BFF (Backend for Frontend) layer, proxying to the FastAPI core.

Other key additions to the architecture: Redis for simulation state management (event sourcing, session persistence), and pgvector for RAG to ground AI answers in the PPC rule database. The collaboration workflow is sequential: Architect → Backend → Frontend → AI → Content → DevOps.

I saved the full spec to `docs/agents-spec.md`, updated the README with the agent team table, refined the tech stack (now 14 rows instead of 9), restructured the project directory tree to show frontend/ and backend/ as separate concerns, and added 4 new architecture decisions to the build-log.

**Wins**:
- Agent spec is now a living document in the project, not just chat history
- Architecture correctly reflects dual-stack (Next.js + FastAPI) pattern
- Agent-to-subagent mapping makes it clear which tool to use for each agent
- All documentation files updated consistently

**Struggles**:
- Deciding whether to keep Next.js API routes at all (resolved: yes, as BFF layer)
- The project structure is more complex now with separate frontend/backend directories — will need careful orchestration

**Learnings**:
- The "Deterministic First" principle is the most important one — it means the simulation engine is testable, auditable, and predictable. AI is only for the explanation layer
- Redis event sourcing for simulation state is clever — it means we can replay any simulation step by step
- The 6-agent workflow naturally creates a build order: schema first, then logic, then UI, then AI, then content, then deployment

**Next Session Plan**:
- Initialize the Next.js + FastAPI dual-stack project
- Agent 1 (Architect): Design the database schema (schema.prisma + SQLAlchemy models)
- Agent 2 (Backend): Scaffold the FastAPI service with evaluation engine skeleton
- Agent 3 (Frontend): Set up Next.js with design system and app shell

---

## Session 3 — 2026-06-04 — Pre-Build Concerns & Risk Assessment

**Duration**: ~15 minutes
**Mood**: 😐 Cautious — need answers before building

**Goal**: Identify every question, concern, and risk before writing any code. Stop and think.

**What Happened**:
The user wisely asked us to pause and list all concerns before committing to code. This forced a hard look at the architecture decisions we've been making, and honestly, it revealed some cracks. I cataloged 23 concerns across 4 severity levels and 10 open questions for the product owner.

The biggest ones: We haven't decided how Next.js and FastAPI actually talk to each other (C-01). We haven't figured out auth across the two stacks (C-02). We're maintaining two ORMs for the same database (C-03). We don't know where the deterministic engine runs at runtime — every click hitting FastAPI would feel sluggish, but client-side logic violates "Deterministic First" (C-04). We require Redis but haven't solved local dev without it (C-05). And most critically, we don't have a clear MVP scope — the PRD covers everything, and we could build forever without shipping (C-06).

I also raised medium-level concerns about testing strategy, deployment target, mobile priority, i18n, and whether we need a monorepo. These can be deferred but shouldn't be forgotten.

The document is saved at `docs/pre-build-concerns.md` with a resolution tracker so we can mark each concern as we resolve it.

**Wins**:
- Caught architecture issues before they became code rewrites
- 23 concerns documented with severity, impact, and resolution tracking
- Product owner questions clearly separated from technical concerns
- Honest assessment of what we don't know

**Struggles**:
- It's uncomfortable to list this many unknowns — feels like we're not ready
- Some concerns are interconnected (e.g., C-01, C-02, and C-04 all depend on each other)
- The scope question (C-06) is the most important and the hardest to answer

**Learnings**:
- The dual-stack architecture adds significant complexity that a monolithic Next.js approach wouldn't have
- "Deterministic First" is a great principle but creates tension with responsive UX
- The gap between "the spec says X" and "how do we actually build X" is where projects fail
- Asking these questions now is 10x cheaper than discovering them after 2 weeks of coding

**Next Session Plan**:
- **WAIT for product owner to resolve C-01 through C-06** before writing code
- Specifically: define MVP scope, decide on FastAPI vs Next.js-only, clarify auth flow, decide on engine runtime location
- Once critical concerns are resolved, proceed with Agent 1 (Architect) work

---

## Session 4 — 2026-06-04 — Architecture Resolution Gate Passed 🚀

**Duration**: ~25 minutes
**Mood**: 🎉 Decisive and energized

**Goal**: Lock in all architecture decisions, resolve every critical concern, get cleared to write code.

**What Happened**:
The product owner came back with decisive, well-reasoned resolutions to all 12 critical and high-priority concerns. The biggest call: **Monolith-First**. Instead of the dual-stack Next.js + FastAPI architecture from the agent spec, we're going with a single Next.js application for MVP. This single decision eliminated C-01 through C-05 in one stroke — no more CORS, dual-auth, dual-ORM, or Redis-local-dev headaches.

The key insight is the **Extractable Engine Pattern**: the deterministic engine is written as a pure TypeScript module at `/src/engine/` with zero framework dependencies. Pure functions only, no DB calls, no side effects. This means:
1. It runs on both client (for instant preview) and server (for authoritative grading)
2. It's testable in complete isolation
3. When FastAPI is needed later, we extract it behind an OpenAPI contract — frontend code doesn't change

The **Hybrid Execution Model** is clever: the client shows "Preview Score" instantly (<100ms), while the server confirms "Official Score" asynchronously. If they diverge, server wins and logs a discrepancy. This preserves both "Deterministic First" and responsive UX.

Other resolutions: Prisma only for MVP (no SQLAlchemy), Postgres JSONB instead of Redis for simulation state, Vercel AI SDK + Server Actions for streaming, pre-generated JSON fixtures instead of runtime synthetic data, single-tenant with org_id column prep, and 100% simulation (no Amazon API).

MVP scope is now crystal clear: **5 modules (0,1,4,6,7) + 3 simulations**. Everything else is explicitly excluded and documented.

I created ADR-001 (Monolith-First), the MVP Scope Definition document, updated all 7 documentation files, and marked 4 previous architecture decisions as superseded.

**Wins**:
- 12 of 23 concerns fully resolved in one session
- Architecture went from "complex but theoretically correct" to "simple and shippable"
- The Extractable Engine pattern is genuinely elegant — it doesn't sacrifice long-term architecture quality
- MVP scope is airtight — no ambiguity about what we're building
- ADR-001 creates a formal record of the pivot and its rationale

**Struggles**:
- Having to mark 4 previous architecture decisions as superseded (decisions #5-#8 from Session 2)
- The agents-spec.md still references FastAPI — we'll need to update it to reflect monolith-first
- The hybrid execution model adds a subtle complexity: ensuring client and server run the exact same pure function

**Learnings**:
- "Building a dual-stack system with unresolved architectural tensions is how projects die in month three" — the product owner was absolutely right
- The Monolith-First pattern is not "giving up" on good architecture — it's *sequencing* architecture decisions correctly
- The org_id column prep strategy is a great example of "cheap insurance" — add the column now, enforce the policy later
- Pre-generated JSON fixtures for synthetic data is a pragmatic MVP choice; we can always add runtime generation later
- When the same pure function runs on client and server, server-wins-on-divergence is the only sane policy

**Next Session Plan**:
- Initialize Next.js monorepo with Turborepo
- Define Prisma schema with org_id placeholder
- Implement pure TS Evaluation Engine types (`/src/engine/types.ts`)
- Write property-based tests for engine (fast-check)
- Scaffold Module 0 + 1 content in MDX
- Build Campaign Builder canvas (React Flow)

---

## Session 5 — 2026-06-04 — First Code Sprint: Engine, DB, Shell 🚀

**Duration**: ~45 minutes
**Mood**: 🎉 Productive and flowing

**Goal**: Execute all P0 tasks — initialize the project, write the database schema, implement the evaluation engine, and build the app shell.

**What Happened**:
Finally writing code! The fullstack dev environment initialized smoothly — Next.js 16 with all dependencies pre-installed (shadcn/ui, Prisma, Zustand, TanStack Query, Recharts, Framer Motion, z-ai-web-dev-sdk). The foundation was already there; we just needed to build the AdCraft-specific layers on top.

The **Prisma schema** was the first P0 task. I designed 12 models covering the entire MVP data model: User (with org_id prep), Account, Module, Lesson, ModuleProgress, LessonProgress, Simulation, SimulationAttempt, SearchTermRecord, CampaignTemplate, AiChatSession, AiChatMessage. Seven enums handle the type system. Every table has the nullable org_id column for future multi-tenancy. The schema pushed to SQLite without issues and Prisma Client generated cleanly.

The **Evaluation Engine** was the biggest P0 deliverable — four modules totaling ~1,200 lines of pure TypeScript:
- `types.ts` — The type foundation: 50+ domain types covering PPC metrics, search term triage, campaign builder, bid elevator, simulation state, XP system, and AI Mentor context. Plus type guards for discriminated unions.
- `formulas.ts` — All 9 core PPC formulas (CPC, ACoS, TACoS, ROAS, CTR, CVR, Break-Even ACoS, Max CPC, AOV) with a formula registry for teaching, metric health assessment, and formatted output.
- `evaluation.ts` — The scoring engine for all three simulations: STR Triage (action-by-action evaluation with partial credit), Bid Elevator (accuracy-based scoring with projected performance), Campaign Builder (structure validation + preview scoring). Plus client-side preview functions and validation.
- `simulation.ts` — State lifecycle management: create, start, pause, resume, submit, plus simulation-specific action recorders for each simulation type. Serialization/deserialization for JSONB persistence.

Every function is pure, deterministic, and has zero framework dependencies. The same `evaluateStrTriage` function will run on both the client (for instant preview) and the server (for authoritative grading). The hybrid execution model is real.

The **App Shell** was built by the Frontend Engineer subagent — 8 custom AdCraft components in the `src/components/adcraft/` directory. Dashboard, sidebar, module cards, simulation cards, stats row, XP progress bar, and an AI Mentor chat placeholder. Emerald/slate dark theme with PPC-themed decorative metrics. The sidebar collapses on mobile with a drawer overlay. Framer Motion handles card hover, progress bar fills, and tab transitions.

I also created the **STR Triage fixture** — a 20-term search term dataset for the Kitchen Gadgets category. Each term has full metrics (impressions, clicks, spend, sales, ACoS, ROAS), a recommended action (keep/pause/negate/optimize), reasoning, and a weight for scoring. This is the data that powers the STR Triage Arena simulation.

And I wrote **2 sample MDX lessons**: Module 0 Lesson 1 (Welcome to AdCraft) and Module 1 Lesson 1 (Understanding PPC Metrics: The Big Six). The metrics lesson is comprehensive — covers all six core metrics with formulas, healthy ranges, key insights, and a quick reference table.

TypeScript type-check passed clean on all engine files. ESLint passed with zero errors. Dev server running and serving 200s.

**Wins**:
- All 3 P0 tasks completed in a single sprint
- Zero errors during the entire build — not a single compilation, lint, or runtime error
- The engine is genuinely pure — no imports from Next.js, React, Prisma, or any framework
- The STR fixture has realistic PPC data with thoughtful reasoning for each recommended action
- App shell looks and feels like a real product, not a prototype
- Total new code: ~3,000 lines across engine + components

**Struggles**:
- Deciding how detailed to make the engine types — went with "comprehensive" because it's cheaper to have unused types than to need missing ones later
- The Campaign Builder evaluation is simpler than the other two simulations because campaign structure evaluation requires more subjective criteria — left as extensible criteria pattern

**Learnings**:
- Writing pure functions is incredibly freeing — no need to worry about React state, database connections, or API calls. Just input → output.
- The formula registry pattern is powerful for teaching — students can see the formula, the inputs, and the output all in one place
- JSON fixtures for synthetic data are quick to create and easy to iterate on — no runtime generator needed
- The app shell sets the emotional tone for the entire product — getting it right early motivates the rest of the build

**Next Session Plan**:
- Build the interactive STR Triage Arena simulation component
- Wire up Zustand stores for simulation state management
- Implement Server Actions for grading and state persistence
- Add the formula calculator widget to Module 1 lessons
- Continue Module 0 + 1 content authoring
