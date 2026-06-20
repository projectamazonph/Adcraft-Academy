# Sessions 6–10 — Simulations, Fixes & Server Actions

> AdCraft Development Diary — Sessions 6 through 10 (including both Session 10 entries)

---

## Session 6 — 2026-06-04 — STR Triage Arena: First Playable Simulation 🎮

**Duration**: ~30 minutes
**Mood**: 🎉 Milestone — the app does something real now

**Goal**: Build the interactive STR Triage Arena simulation — the first fully playable experience in AdCraft.

**What Happened**:
This session was about turning the evaluation engine from an abstract module into something users can actually interact with. The STR Triage Arena is the first of three simulations, and getting it right sets the pattern for the other two.

The simulation has 4 distinct phases, each feeling like a different moment in the user experience:

**Briefing** — A mission-style intro screen showing the product context (Premium Garlic Press), the ACoS target (25%), margin (35%), and explanations of the 5 triage actions. It feels like a mission briefing before entering combat — concise, clear, action-oriented. The "Begin Simulation" button starts the timer.

**Triage** — The main interaction. A TanStack Table with 20 search terms, each showing all the key metrics (impressions, clicks, CTR, spend, CPC, orders, sales, ACoS, ROAS). ACoS and ROAS are color-coded: green if good, amber if warning, red if critical. Each row has 5 action buttons with distinct colors. "Optimize Bid" reveals a bid input. "Negate" actions reveal a keyword input. A live preview score updates in the corner as decisions are made — this is the hybrid execution model in action: the engine's `previewStrTriageScore` runs client-side on every action.

**Scoring** — After submission, the full evaluation engine runs client-side using `evaluateStrTriage`. An animated circular SVG progress indicator reveals the score. Each search term is listed with the user's action vs. the recommended action, points earned, and expandable educational feedback. Before/after portfolio metrics show the projected improvement.

**Review** — Summary card with total score, accuracy percentage, XP earned, and ACoS improvement. "Try Again" and "Back to Simulations" buttons.

The Zustand store ties it all together. It maps fixture data to engine types, calls preview on every action change, and runs the full evaluation on submission. The store manages phase transitions and provides all the data each component needs.

One small fix: the JSON fixture had an `Infinity` value (search term str-017 with 0 sales = infinite ACoS). JSON doesn't support Infinity literals, so it was changed to 999.0. The engine already handles infinite ACoS gracefully.

The app shell was updated to support simulation launching: an `activeSimulation` state routes to the STR Triage Arena when its card is clicked. The STR Triage card is now unlocked (the other two remain locked).

**Wins**:
- The app now has a fully playable simulation — this is the biggest milestone so far
- The engine-to-UI pipeline works end-to-end: fixture data → Zustand store → TanStack Table → user actions → engine evaluation → scoring display
- Live preview scoring creates an addictive feedback loop — users can see their score change as they make decisions
- The 4-phase flow (Briefing → Triage → Scoring → Review) creates a complete narrative arc
- Color-coded metrics make it immediately obvious which terms are performing well vs. poorly
- Per-term educational feedback is the key differentiator — this isn't just a quiz, it's a learning tool

**Struggles**:
- TanStack Table's `useReactTable()` triggers a React Compiler warning about memoization — expected and harmless
- JSON doesn't support Infinity — had to replace with a large number in the fixture
- Initial compile caused a brief 500 error that resolved on second request (hot reload race condition)

**Learnings**:
- The simulation phases create a natural emotional arc: curiosity (briefing) → focus (triage) → tension (scoring) → satisfaction (review)
- Color-coding metrics is more powerful than I expected — users can instantly spot the "obvious negations" (rose ACoS) vs. "star terms" (emerald ROAS)
- Live preview scoring is the key to engagement — seeing the score go up when you negate a bad term is genuinely satisfying
- The Zustand store pattern (fixture → store → components) is clean and repeatable — the next two simulations will follow the same pattern

**Next Session Plan**:
- Build the Bid Elevator simulation
- Implement Server Actions for grading persistence
- Add formula calculator widget to Module 1 lessons

---

## Session 7 — 2026-06-04 — Bid Elevator: Sequential Decision Simulation 🎯

**Duration**: ~25 minutes
**Mood**: 🎉 Rhythm found — the pattern is repeatable

**Goal**: Build the interactive Bid Elevator simulation — the second playable simulation in AdCraft.

**What Happened**:
With the STR Triage Arena pattern established in Session 6, the Bid Elevator came together much faster. The key architectural difference: STR Triage presents all 20 search terms at once in a grid, while Bid Elevator presents 10 scenarios one at a time — a sequential decision flow that mirrors how real PPC managers actually adjust bids (keyword by keyword, not all simultaneously).

The fixture data was designed to teach specific bidding lessons. Each of the 10 scenarios tests a different bidding insight: bid down when ACoS is far above target and CVR is low (bid-001), maintain or increase when ACoS is below target and volume is growing (bid-003, bid-005, bid-006), small adjustments when near target (bid-009), and understand match type implications for bid strategy (bid-003, bid-007, bid-008). The Kitchen Gadgets product context carries over from the STR fixture, keeping the training universe consistent.

The **Zustand store** follows the same pattern as STR Triage — fixture mapping, engine integration, phase management — but adds per-scenario timing. Each `submitBid` call records `decisionTimeMs`, which the evaluation engine uses to assess decision speed alongside accuracy. The store also auto-transitions to scoring when all 10 scenarios are completed, eliminating the need for a manual "Submit" button.

The **Bid Arena** component is the core interaction. It shows one scenario at a time with: keyword and match type, current bid with Amazon's suggested range (min/rec/max), full performance metrics, market context (competition level, search volume trend), and a visual bid comparison bar. Quick bid buttons (Min/Rec/Max) let users select from Amazon's suggested range, or they can type a custom amount. The max profitable CPC hint (AOV × CVR × Target ACoS) appears as a reference — teaching the fundamental bidding formula while the user makes real decisions.

The **Scoring** phase shows an animated score circle followed by per-scenario feedback. Each scenario displays the user's bid vs. the optimal bid, whether it fell within the acceptable range, and projected ACoS impact. Expandable reasoning explains why the optimal bid is what it is — connecting the decision back to the underlying PPC math.

The **Review** phase summarizes: total score, accuracy percentage (bids within acceptable range), acceptable bids count, average decision time, and XP earned. The amber color theme distinguishes it from STR Triage's rose theme.

The app shell was updated to route to Bid Elevator when its simulation card is clicked, and the card is now unlocked alongside STR Triage.

**Wins**:
- The sequential pattern is faster to build than the grid pattern — each scenario is a self-contained card, no table state management
- Per-scenario timing adds a dimension that STR Triage doesn't have — speed matters in real PPC management
- The max profitable CPC hint teaches the bidding formula implicitly, without a separate lesson
- Quick bid buttons (Min/Rec/Max) create a satisfying "fast path" for confident decisions
- 2 of 3 simulations now playable — the finish line is visible

**Struggles**:
- Deciding between auto-advance vs. manual "Next Scenario" button — went with auto-advance after each bid for flow, but some users might want to review before moving on
- The bid comparison bar's visual scaling required some thought (current bid vs. suggested range vs. user bid all on the same axis)

**Learnings**:
- The "fixture → store → components" pattern is now a proven template. Each simulation follows: (1) design fixture, (2) build Zustand store with engine integration, (3) build phase components, (4) wire into app shell
- Sequential vs. grid presentation creates fundamentally different user experiences — sequential creates focus and narrative, grid creates comparison and speed
- The max profitable CPC calculation (AOV × CVR × Target ACoS) is the single most important formula for bidding — embedding it as a visible hint in the simulation is better than teaching it in a lesson
- Per-decision timing is a simple addition that adds real pedagogical value — fast AND accurate is the goal

**Next Session Plan**:
- Build the Campaign Builder simulation (the final simulation)
- Implement Server Actions for grading persistence
- Add formula calculator widget to Module 1 lessons
- Draft more Module 0 + 1 content in MDX

---

## Session 8 — 2026-06-04 — Hydration Fix & Documentation Audit 🔧

**Duration**: ~15 minutes
**Mood**: 😐 Meticulous — documentation integrity matters

**Goal**: Fix the hydration mismatch error reported in StatsRow, then audit all documentation for drift against the actual codebase.

**What Happened**:
The user reported a console error: a hydration mismatch in the `StatsRow` component. The decorative sparkline bars in the stats overview were rendering with different heights on the server vs. the client. The root cause was straightforward — `Math.random()` was being called during render, producing different values on each side of the SSR hydration boundary. The fix was equally straightforward: replace `Math.random()` with a deterministic array `[25, 40, 30, 45, 28, 35, 20]`. The visual appearance remains identical as a decorative placeholder, but now the server and client agree on every render.

After the fix, the user reiterated "the vital need for constant documentation." This triggered a comprehensive documentation audit across all 9 project files. The audit revealed significant drift:

- `agents-spec.md` still described the dual-stack FastAPI architecture from Session 2 — it had never been updated after the Monolith-First pivot in Session 4. This was the most critical gap. A complete rewrite from v1.0 to v2.0 replaced all Python/FastAPI/Redis references with the actual Pure TypeScript/Next.js/Postgres stack.
- `docs/worklog.md` was missing Task IDs 4, 5, and 6 (Architecture Resolution, Code Sprint 1, and STR Triage build).
- `docs/README.md` had an aspirational project directory tree that referenced directories that don't exist (like `src/types/`, `src/styles/`, `(auth)/`, `.github/workflows/`).
- Several minor inaccuracies in build-log and mvp-scope files.

All gaps were closed. The project now has zero drift between documentation and code.

**Wins**:
- Hydration mismatch resolved cleanly — deterministic values eliminate SSR/client divergence
- Documentation audit caught critical drift in agents-spec.md before it caused confusion
- All 9 documentation files now accurately reflect the actual codebase state
- Task IDs 1-10 are complete in all tracking documents

**Struggles**:
- The agents-spec.md rewrite was substantial — the entire document was built around a dual-stack architecture that no longer exists
- Keeping documentation in sync is easy to forget in the heat of development — the user's reminder was well-timed

**Learnings**:
- `Math.random()`, `Date.now()`, and any non-deterministic value in a server-rendered React component will cause hydration mismatches. This is a fundamental SSR rule that's easy to overlook in decorative UI elements.
- Documentation drift accumulates silently — by the time you notice, the gap can be enormous (as with agents-spec.md spanning 4 sessions of drift)
- "Constant documentation" isn't overhead — it's insurance. The 10 minutes spent on the audit saved potentially hours of confusion later.
- A deterministic array is better than a seeded PRNG for decorative values — simpler, more readable, and zero risk of edge cases.

**Next Session Plan**:
- Build the Campaign Builder simulation (3rd and final MVP simulation)
- After Campaign Builder: Server Actions for grading persistence
- Formula calculator widget for Module 1 lessons

---

## Session 9 — 2026-06-04 — Campaign Builder: The Final Simulation 🏁

**Duration**: ~35 minutes
**Mood**: 🎉 Milestone — all 3 MVP simulations are playable!

**Goal**: Build the Campaign Builder simulation — the 3rd and final interactive simulation in the AdCraft MVP.

**What Happened**:
With STR Triage Arena (grid-based triage) and Bid Elevator (sequential bidding) already built, the Campaign Builder needed a fundamentally different interaction model: a **form-based builder**. Instead of reacting to pre-existing data (like STR and Bid), the user actively *constructs* something — a complete campaign structure from scratch. This is the most creative and open-ended of the three simulations, and the closest to what real PPC managers do when launching a new product on Amazon.

The **fixture data** was the most complex of the three simulations. It includes:
- 3 available products (Premium Garlic Press, Chef's Citrus Juicer, Multi-Blade Herb Scissors) for cross-product campaign building
- 15 suggested keywords with relevance scores, search volume, competition levels, and suggested bids — ranging from highly relevant ("garlic press" exact, 0.95 relevance) to poor matches ("cooking tools" broad, 0.25 relevance)
- 5 suggested negative keywords with pedagogical reasoning (why "free", "cheap", "electric garlic press" should be negated)
- 2 reference (expert-built) campaign structures with full keyword lists and strategic reasoning
- 5 weighted evaluation criteria: Structure (25%), Keyword Selection (30%), Negative Keywords (20%), Bidding (15%), Budget (10%)
- A mission brief with scenario, objectives, and tips

The **evaluation engine** runs entirely client-side in the store (matching the hybrid execution model). It evaluates 5 criteria independently: whether the campaign type is correct (Sponsored Products for single ASIN), whether keywords span both high-intent exact match and discovery broad/phrase match, whether negative keywords filter out price-sensitive and irrelevant traffic, whether bids are reasonable relative to the max profitable CPC, and whether the daily budget allows meaningful data collection. Each criterion produces a 0-100 score with detailed educational feedback explaining what was good and what could be improved.

The **workshop** is the core interaction — a split-panel layout with campaign settings on the left (type, targeting, bid strategy, budget, ASINs) and keyword management on the right (tabbed between positive and negative keywords). Suggested keywords appear as clickable chips color-coded by relevance (emerald for high, amber for medium, rose for low). Users click to add them, then adjust match types and bids. Custom keywords can also be typed in. A live preview score in the bottom bar updates in real-time as the campaign takes shape.

The **scoring** phase reveals the weighted total score with an animated circle, followed by 5 criterion cards each showing their individual score, pass/fail status, and expandable feedback. The **review** phase adds a grade (A through F), a comparison with expert reference campaigns, and XP calculation.

One important design decision: unlike STR Triage and Bid Elevator which use the engine's built-in `evaluateStrTriage` and `evaluateBidElevator` functions, the Campaign Builder evaluation lives entirely in the Zustand store. This is because the engine's `evaluateCampaignBuilder` was designed as a generic criteria pattern that expects `CampaignBuilderCriteria` objects with function-valued weights — which can't be serialized to JSON for fixture data. The store-based evaluation provides the same deterministic behavior while keeping the fixture data clean. If needed later, this can be refactored into the engine.

All 3 simulations are now playable. The Simulation Components milestone is at **100%**.

**Wins**:
- The form-based builder pattern is fundamentally different from the grid and sequential patterns — it proves the architecture is flexible enough to support diverse interaction models
- 5-criteria weighted evaluation provides nuanced, multi-dimensional feedback — not just "right or wrong" but "good in these areas, needs work in those"
- Reference campaigns are a powerful teaching tool — users can compare their structure to an expert's and understand the gap
- The suggested keyword chips with relevance scores teach keyword selection implicitly — users learn that "cooking tools" (0.25 relevance) is a bad choice by seeing it highlighted in rose
- All 3 MVP simulations complete — this is the biggest project milestone so far

**Struggles**:
- The Campaign Builder is the most complex of the three simulations — more state to manage (campaign fields + keywords + negatives + validation)
- Deciding where to put the evaluation logic (engine vs. store) — ultimately went with store for pragmatic reasons
- The workshop UI needed careful layout work to balance campaign settings against keyword management

**Learnings**:
- Three distinct interaction patterns (grid, sequential, form) demonstrate that the "fixture → store → components" architecture is genuinely reusable, not just repeatable
- Weighted multi-criteria evaluation is more pedagogically effective than a single score — students can see exactly which skills they need to improve
- Reference solutions (expert-built campaigns) are the educational equivalent of "show your work" in math — they teach by example, not just by feedback
- The biggest value of building all 3 simulations is pattern validation: the architecture works at scale, not just for one lucky case

**Next Session Plan**:
- Implement Server Actions for grading persistence (save simulation results to the database)
- Add formula calculator widget to Module 1 lessons
- Draft more Module 0 + 1 MDX content
- Wire up Zustand stores to Server Actions for the hybrid execution model

---

## Session 10 — 2026-06-04 — Server Actions: The Hybrid Execution Model Comes Alive ⚡

**Duration**: ~30 minutes
**Mood**: 🎉 Architectural milestone — the hybrid execution model is no longer theoretical

**Goal**: Implement Server Actions for grading persistence, completing the hybrid execution model described in ADR-001.

**What Happened**:
The hybrid execution model has been a core architectural principle since Session 4 — "client preview + server authoritative grading" — but until now it was only theoretical. The client ran evaluations and showed scores, but nothing was persisted. This session made it real.

The **Server Actions** file (`/src/app/actions/simulation.ts`) implements 6 actions following the `ActionResult<T>` pattern (success with data, or error with code):

1. **`startAttempt`** — Creates a SimulationAttempt record when the user starts a simulation. Auto-creates the simulation and user records if they don't exist (MVP convenience). Returns an `attemptId` that the store uses for grading.

2. **`gradeStrTriageAttempt`** — Runs the SAME `evaluateStrTriage` function on the server that the client already ran. Compares the official score to the preview score. If they differ, sets `scoreDiscrepancy: true`. Persists everything to the database.

3. **`gradeBidElevatorAttempt`** — Same pattern for Bid Elevator: server-side `evaluateBidElevator`, score comparison, persistence.

4. **`gradeCampaignBuilderAttempt`** — Slightly different: the Campaign Builder evaluation lives in the store (not in the engine's exported functions), so the client sends its evaluation to the server. The server runs `previewCampaignBuilderScore` as a verification check and persists the client's evaluation as the official score.

5. **`getAttemptHistory`** — Retrieves the last 20 attempts for a user/simulation, enabling future "history" views.

6. **`getUserStats`** — Returns aggregate stats: XP, level, total attempts, best scores per simulation. Powers the dashboard.

All three Zustand stores were updated with 5 new fields: `officialScore`, `scoreDiscrepancy`, `xpEarned`, `attemptId`, `isGrading`. The flow is:
- `startSimulation` calls `startAttempt` non-blocking → gets `attemptId`
- Submit function runs client-side evaluation (instant) → shows score to user
- Submit function then calls the grade action non-blocking → server validates and persists
- If the server result differs, `scoreDiscrepancy` is set but the user already sees their score
- Server action failures are caught silently — the simulation always works client-side

This is the key design insight: **server actions are non-blocking and best-effort**. The client never waits for the server. The user sees their score instantly (client-side evaluation), and the server grading happens in the background. If the server is down, the simulation still works perfectly. If the server returns a different score, the discrepancy is flagged for audit.

The XP system is also live: `score * 2` (max 200 XP per simulation), level-up every 500 XP, persisted to the User table.

**Wins**:
- The hybrid execution model is no longer a slide in an ADR — it's running code
- Server actions are completely non-blocking — zero impact on UX responsiveness
- The same pure functions run on both client and server — this is the Deterministic First principle in action
- Score discrepancy detection creates an audit trail — if someone tampers with client-side code, the server will catch it
- Graceful degradation: server failures don't break anything

**Struggles**:
- The Campaign Builder evaluation can't use the engine's exported functions (function-valued criteria can't be serialized), so the server action accepts the client's evaluation with a verification check — slightly less authoritative than the other two
- MVP user ID is hardcoded — will need proper auth integration later
- The Prisma schema has `moduleId` as a required foreign key on `Simulation`, but we don't have Module records seeded — the Server Action auto-creates simulation records with a placeholder module ID

**Learnings**:
- Non-blocking server actions are the right pattern for educational software — never make the learner wait for a server round-trip to see their score
- The `ActionResult<T>` pattern (inspired by Rust's Result type) makes error handling explicit and type-safe
- Auto-creating database records in the Server Action (simulation, user) is pragmatic for MVP but should be replaced with proper seeding in production
- The hybrid execution model proves its value: the same code path serves both instant feedback and authoritative grading

**Next Session Plan**:
- Formula calculator widget for Module 1 lessons
- Draft more Module 0 + 1 MDX content
- Wire the dashboard to use `getUserStats` for real XP/level display

---

## Session 10 — 2026-06-04 — Formula Calculator Widget for Module 1

**Duration**: ~30 minutes
**Mood**: 😊 Steady progress

**Goal**: Build the Formula Calculator widget — an interactive learning tool that lets users explore, compute, and understand the 7 core PPC metrics from Module 1 (Foundations).

**What Happened**:
With Server Actions complete from the previous session, we shifted to building the Formula Calculator widget. This is a different kind of component from the simulations — it's a teaching tool, not a scoring tool. The key design decision was to use React local state instead of Zustand, because this is a simple calculator with no multi-step lifecycle or grading flow. The component reads directly from the engine's `PPC_FORMULAS` registry and uses `computeFormula()` for live computation, which means the same pure functions that power evaluation scoring also power the calculator — the Deterministic First principle at work again.

The widget has a rich feature set: formula selector tabs with category colors (cost, efficiency, performance, profitability), interactive sliders + number inputs with real-time computation, animated result display, a full calculation trace showing the substitution of inputs into the formula, health assessment with range breakdown (excellent/good/warning/critical), and three-tab educational tips (insight, worked example, common pitfall) for each formula. We also added a "Related Formulas" navigation section that lets users quickly jump between the 7 Module 1 metrics.

Integration was straightforward: we added an `expandedModule` state to the ModulesView, placed a "Formula Calculator" button in Module 1's action area, and the widget expands below the module card with a smooth AnimatePresence animation. We also changed Module 1's status from 'locked' to 'available' so the calculator button is visible.

**Wins**:
- Zero new Zustand stores — React local state was the right call for a calculator
- Reuses the engine's existing formula registry — no duplication
- Health assessment with industry benchmarks gives learners real-world context
- Educational tips (insight/example/pitfall) transform raw computation into actual learning
- Clean expand/collapse UX with AnimatePresence — the calculator feels like a natural part of the module, not a separate page

**Struggles**:
- None — this was a straightforward build with no hydration issues or type errors
- The health assessment thresholds are hardcoded for now — should be configurable per category later

**Learnings**:
- Not every interactive component needs a Zustand store — calculators, previewers, and one-shot tools are fine with React state
- The engine's `computeFormula()` function is a hidden gem — it provides a unified interface to all 9 formulas with formatted output, making the calculator almost data-driven
- Educational software benefits from "calculation traces" — showing the full substitution (e.g., "Spend / Clicks = 100 / 50 = $2.00") helps learners internalize the math

**Next Session Plan**:
- Continue MDX content authoring for Module 0 and Module 1
- AI Mentor integration with Vercel AI SDK streaming
- Wire dashboard to use `getUserStats` for real XP/level display
