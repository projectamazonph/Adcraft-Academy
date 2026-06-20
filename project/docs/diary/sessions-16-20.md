# Sessions 16–20 — Auth, Testing, MVP Release & Post-MVP Kickoff

> AdCraft Development Diary — Sessions 16 through 20
>
> All sessions complete.

---

## Session 16 — 2026-06-04 — Rendering Fix: Dark Mode, Mobile Layout, Data Bugs 🔧

**Duration**: ~30 minutes
**Mood**: 😤→😌 Debugging frustration to relief

**Goal**: Fix the app rendering incorrectly on mobile — dark mode not applying, sidebar showing when it shouldn't, dashboard stuck on loading for new users.

**What Happened**:
The user reported the build was not rendering correctly on mobile (Android Chrome). A VLM screenshot analysis revealed: light/white background instead of dark, sidebar navigation elements visible on mobile when they should be hidden, and layout elements stacked in a broken way. The root causes turned out to be three separate issues compounding into one bad mobile experience.

**Fix 1: getUserStats() fails for new users (ERR-007).** The `getUserStats` server action returned `{ success: false, error: 'User not found' }` when the MVP user didn't exist in the database yet. This caused the dashboard to stay stuck on "Loading..." because the page.tsx called `getUserStats()` on mount and silently dropped the error. Meanwhile, `getProgressOverview()` (used by the Dashboard component) auto-created the user — but by then the page had already failed to load initial XP/level data. Fixed by making `getUserStats()` auto-create the user record (same pattern as `getProgressOverview`), and adding `.catch()` handlers to both the page and dashboard useEffect calls.

**Fix 2: Sidebar class merging conflict on mobile.** The sidebar's `cn()` call included `flex flex-col` in the base string and `hidden lg:flex` in the responsive string. While `tailwind-merge` should resolve this, the conflict between `flex` and `hidden` created a potential class ordering issue in Tailwind v4. Restructured the sidebar to use `hidden lg:flex` as the base display rule with `!flex` as the mobile-open override, and moved `flex-direction: column` to an inline style to avoid any class merge ambiguity.

**Fix 3: Dark mode CSS robustness.** Added `html.dark { background-color: var(--background); color: var(--foreground); }` to the `@layer base` block as a defensive fallback. This ensures the dark background is applied at the html element level even if component-level `bg-background` classes have specificity issues. Also cleaned up `tailwind.config.ts` — removed the v3-style `theme.extend.colors` block that was being ignored by Tailwind v4 (since the `@theme inline` block in globals.css handles all color definitions). The stale v3 config wasn't causing errors but added confusion.

**Fix 4: Operator precedence bug in dashboard.** The quick actions section had `overview?.modulesCompleted ?? 0 > 0` which evaluates as `overview?.modulesCompleted ?? (0 > 0)` due to operator precedence, not `(overview?.modulesCompleted ?? 0) > 0`. This caused the "Continue Learning" subtitle to always show "Module 0: Onboarding" even when modules were completed. Fixed by adding parentheses: `(overview?.modulesCompleted ?? 0) > 0`.

**Wins**:
- All four bugs fixed in one session — mobile experience should now be clean
- Dark mode is definitively applied with both CSS custom properties AND an html.dark fallback
- getUserStats auto-creates users — no more "Loading..." dead-end on first visit
- Build compiles clean, production server returns correct HTML with `class="dark"` and all CSS variables
- The operator precedence bug was subtle but affected UX every time modules were completed

**Struggles**:
- Debugging rendering issues from a mobile screenshot required VLM analysis + CSS inspection — couldn't reproduce in desktop browser
- The Tailwind v3/v4 config mismatch was confusing but turned out to be a red herring — the real issues were server action failures and class merging

**Learnings**:
- **Mobile-first testing is essential.** The app looked fine on desktop but was broken on mobile — the sidebar mobile behavior and dark mode rendering need explicit mobile verification.
- **Server actions must handle the "first visit" case.** Any action called on mount should auto-create resources, not return errors for missing records.
- **CSS class merging in Tailwind v4 needs care.** When combining base utilities (`flex flex-col`) with responsive overrides (`hidden lg:flex`), use explicit overrides (`!flex`) or inline styles to avoid ambiguity.
- **Operator precedence with `??` and `>`** — the nullish coalescing operator has lower precedence than comparison, so always use parentheses.

**Next Session Plan**:
- AI Mentor Streaming (SSE via API route)
- Testing & QA — Vitest unit tests for evaluation engine
- Auth (NextAuth.js) — Replace hardcoded mvp-user-001

---

## Session 17 — 2026-06-04 — Auth Build + Sign-In Bug Fix + Documentation Update 🔐

**Duration**: ~45 minutes
**Mood**: 😤→🎉 Frustration to triumph — auth is working end-to-end

**Goal**: Fix the sign-in bug where users could create accounts but couldn't sign in, then update all documentation to reflect the auth implementation and fixes.

**What Happened**:
The user reported "Created an account but can't sign in" — the most critical user-facing bug since auth was built. Account creation worked (the sign-up page called the signup API, created the user in the DB, and even attempted to sign in), but the resulting session cookie was never established on the client. The user would be redirected back to the sign-in page in an infinite loop.

**Root cause (ERR-008):** Both the sign-in and sign-up pages used `signIn('credentials', { redirect: false })` from NextAuth v4. This pattern uses a fetch-based approach that returns the auth result as a JavaScript object instead of doing a full page navigation. The problem: the `Set-Cookie` headers in the fetch response may not be applied correctly by the browser in certain configurations — especially behind reverse proxies (like our preview deployment) or in some browser security contexts. The code then tried `router.push(callbackUrl)` for client-side navigation, which triggered the middleware. The middleware checked for the JWT token via `getToken()`, but the session cookie was never persisted, so the token was null, and the middleware redirected back to `/auth/signin`. Infinite loop.

**The fix:** Switched both pages from `redirect: false` to NextAuth's default redirect behavior. When you call `signIn('credentials', { callbackUrl: '/' })` without `redirect: false`, NextAuth does a full page navigation (form POST) which reliably sets the session cookie across all browser/proxy configurations. The browser handles the redirect automatically, and by the time the middleware runs on the destination page, the cookie is already persisted.

Also added: NextAuth error code mapping on the sign-in page (e.g., "CredentialsSignin" → "Invalid email or password"), `useSearchParams()` Suspense boundary (required by Next.js 16), and removal of all `mvp-user-001` hardcoded fallbacks from server actions (14 instances across progress.ts, simulation.ts, and mentor.ts). Server actions now properly return `{ success: false, code: 'UNAUTHENTICATED' }` when no session exists.

**After the fix**, the documentation was out of sync — the project-plan, architecture docs, build-log, and README all needed updates to reflect the auth system and ERR-008 fix. Spent the rest of the session bringing everything current across 7 documentation files, including a new Authentication Pattern section in architecture.md.

**Wins**:
- Sign-in now works end-to-end: create account → automatic sign-in → dashboard with user data
- All mvp-user-001 fallbacks eliminated — proper auth scoping across the entire app
- Authentication Pattern fully documented in architecture.md for future reference
- ERR-008 logged with complete root cause analysis
- MVP completion holds at 96% — only AI Mentor Streaming and deployment hardening remain

**Struggles**:
- The `redirect: false` issue was hard to diagnose — the server logs showed a successful 302 redirect, but the cookie never made it to the client. The problem only surfaced when testing behind a reverse proxy.
- NextAuth v4 documentation doesn't clearly explain the cookie persistence difference between `redirect: false` and default redirect behavior.
- Removing 14 instances of `mvp-user-001` fallbacks across 3 server action files required careful testing to ensure auth-unauthenticated flows still worked.

**Learnings**:
- **NextAuth's `redirect: false` is a footgun behind reverse proxies.** The fetch-based approach doesn't reliably persist session cookies in all environments. Default redirect (full page navigation) is safer.
- **Session cookies and client-side navigation don't mix.** When the session cookie is set in a fetch response, the browser may not apply it before the next client-side navigation. Full page navigation ensures the cookie is persisted before any subsequent requests.
- **Every hardcoded fallback is a latent bug.** The `mvp-user-001` fallbacks silently attributed data to a ghost user when auth failed. Proper error handling (UNAUTHENTICATED) is better than silent degradation.
- **Documentation after auth requires touching every layer.** Auth touches server actions, middleware, client components, API routes, and the Prisma schema — updating docs means updating architecture, project-plan, build-log, error-log, worklog, diary, and README.

**Next Session Plan**:
- AI Mentor Streaming (SSE via API route) — the last 5% to complete the AI Mentor milestone
- Deployment hardening — rate limiting, env validation, error monitoring

---

## Session 18 — 2026-06-04 — AI Mentor Streaming: Token-by-Token Real-Time Delivery ⚡

**Duration**: ~25 minutes
**Mood**: 😎→🎉 Focused execution to satisfying result

**Goal**: Build SSE streaming for the AI Mentor so responses appear token-by-token in real-time, matching the UX of ChatGPT and Claude. This was the last 5% of the AI Mentor milestone.

**What Happened**:
The AI Mentor was functional but used a request/response pattern — the user sent a message and waited for the entire LLM response to generate before seeing anything. This felt slow, especially for longer responses. The fix was to implement Server-Sent Events (SSE) streaming through a new API route, with token-by-token rendering on the client.

**Architecture discovery.** The `z-ai-web-dev-sdk` already supports `stream: true` in its `chat.completions.create()` method. When enabled, it returns a `ReadableStream` instead of a JSON object. The stream contains OpenAI-format SSE chunks (`data: {"choices":[{"delta":{"content":"..."}}]}\n\n`). This meant no new dependencies were needed — just a new API route to bridge the SDK's stream to the client.

**API route: `/api/mentor/stream`.** Created a POST endpoint that accepts `{ message, chatHistory, context }`, calls the SDK with `stream: true`, then transforms the upstream SSE stream into a cleaner custom SSE format with three event types: `token` (each content chunk as it arrives), `done` (stream completion with latency and model metadata), and `error` (stream interruption). The transformation handles edge cases: the `[DONE]` signal from OpenAI, `finish_reason: "stop"`, malformed lines, and the case where the SDK returns a non-streaming response (fallback to a single content event).

**Client-side streaming in `mentor-chat.tsx`.** Rewrote the message sending flow from calling a Server Action to using `fetch()` with `ReadableStream.getReader()`. Each `token` event appends to the AI message content in state, creating a typing-in-real-time effect. Added a `StreamingCursor` component (a blinking `|` that appears during streaming), an `AbortController` for cancel support, and a Stop button that replaces the Send button during active streaming. The header status indicator changes from "Online" (green) to "Streaming..." (amber) during generation. Metadata (latency, model) is deferred until the stream completes.

**Dual-path design.** The non-streaming `chatWithMentor` Server Action is retained as a fallback. The streaming path bypasses Server Actions entirely (since they cannot stream responses). Both paths share the same system prompt and validation logic — the prompt is duplicated in the API route to avoid mixing `'use server'` and non-server dependencies.

**Wins**:
- AI Mentor milestone: 95% → 100% — fully complete
- MVP completion: 96% → 98% — only deployment hardening remains
- ChatGPT-like UX with real-time token delivery and cancel support
- No new dependencies needed — z-ai-web-dev-sdk already supported streaming
- Build passes clean with the new dynamic API route registered

**Struggles**:
- None — the SDK's streaming support was well-designed, and the SSE transformation was straightforward
- The main design decision was whether to duplicate the system prompt or share it via import; duplication was chosen to keep the streaming route independent of the `'use server'` module chain

**Learnings**:
- **Server Actions cannot stream.** This is a fundamental limitation — they return a single JSON response. For streaming, you must use a standard API route.
- **SSE buffering is the enemy.** Added `X-Accel-Buffering: no` header to prevent nginx/reverse-proxy buffering from holding tokens before delivering them to the client.
- **AbortController is essential for streaming UX.** Without cancel support, a long-running stream would block the UI indefinitely. The Stop button gives users control over their experience.
- **Dual-path (streaming + non-streaming) is a good pattern.** The Server Action remains useful for server-side-only calls (e.g., automated follow-ups, batch processing), while the streaming API route handles interactive chat.

**Next Session Plan**:
- Deployment hardening — rate limiting, env validation, error monitoring, database backup
- MVP Release Candidate preparation

---

## Session 19 — 2026-06-05 — Testing, Deployment Hardening & MVP Release Candidate 🚀

**Duration**: ~2 hours
**Mood**: 😤→🎉 Grinding through ops work to shipping relief

**Goal**: Complete the remaining MVP milestones — testing, deployment hardening, and produce a release candidate. After this session, the MVP should be 100% ready for production deployment.

**What Happened**:
This was a long session spanning three distinct phases: testing, deployment hardening, and documentation. Each phase had its own challenges, but the end result was a production-ready application that could be safely deployed to real users.

**Phase 1: Testing & QA (75% → 100%).** The evaluation engine was the most critical piece to test — it's the heart of AdCraft's pedagogical value. Wrote 103 Vitest tests: unit tests covering all 9 PPC formulas (boundary cases like zero spend, zero clicks, infinity ACoS), evaluation functions for all 3 simulations (STR Triage, Bid Elevator, Campaign Builder), and property-based tests using fast-check to verify that formulas are commutative, idempotent, and never produce NaN/Infinity for valid inputs. Also wrote 9 Playwright E2E smoke tests covering the critical user journey: sign-up → sign-in → dashboard loads → navigate to lessons → read a lesson → launch simulation → complete simulation. The E2E tests run against a real browser with a real dev server, which caught a timing issue where the dashboard tried to load stats before the user was created — this was already fixed but the E2E test confirmed the fix.

**Phase 2: Deployment Hardening.** This was the operational checklist work that nobody enjoys but everyone needs. Added rate limiting on the AI Mentor API route (10 requests per minute per user, implemented with an in-memory sliding window — good enough for MVP, will need Redis for multi-instance). Added environment variable validation at startup using a custom `validateEnv()` function that checks for required keys (DATABASE_URL, NEXTAUTH_SECRET, etc.) and fails fast with clear error messages if any are missing. Added structured logging with a `logger` utility that includes timestamp, level, context, and request ID. Implemented security headers via `next.config.ts` — Content-Security-Policy (production-only, allows self + CDN scripts), X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin. Hardened cookies by adding `secure: true` and `sameSite: 'lax'` to NextAuth session configuration. Added CORS headers to the streaming API route. Implemented a global Error Boundary component that catches runtime errors and shows a friendly fallback instead of a white screen. Added a `/api/health` endpoint that returns `{ status: 'ok', timestamp, uptime }` for uptime monitoring. Created a database backup script (`scripts/backup-db.sh`) that copies the SQLite file with a timestamp. Created a `.env.example` file documenting all required and optional environment variables. Wrote a migration guide (`docs/reference/migration-guide.md`) for the eventual SQLite → PostgreSQL transition.

**Phase 3: Documentation.** Updated 6 documentation files to reflect the MVP completion: project-plan (all milestones at 100%), build-log (added entries for testing and deployment hardening), README (added testing and deployment sections), architecture.md (added security patterns, deployment checklist), error-log (no new errors — clean session), and worklog (added task IDs for testing and deployment).

**Wins**:
- MVP Release Candidate is production-ready: all features shipped, all tests passing, all security hardening in place
- 103 unit + property tests and 9 E2E smoke tests provide solid regression coverage
- Security headers, rate limiting, and cookie hardening protect against common attack vectors
- Environment validation catches configuration errors at startup — no more silent failures in production
- Clean build with zero errors — the MVP is a solid foundation for post-MVP development

**Struggles**:
- Property-based testing with fast-check required careful constraint design — some properties are trivially true (e.g., "CPC is always positive") while others needed custom arbitraries to generate realistic PPC data
- CSP header was tricky to get right — development mode needs inline scripts for React DevTools and HMR, but production should lock it down. Solved with environment-conditional CSP that allows `'unsafe-eval'` only in development
- Rate limiting with in-memory state means it resets on server restart — acceptable for single-instance MVP but needs Redis for production scale

**Learnings**:
- **Test the engine first, everything else via E2E.** The evaluation engine is pure functions — perfect for unit testing. Server actions and pages are integration points — better tested end-to-end. This split maximizes test coverage per line of test code.
- **Deployment hardening is a checklist, not a design problem.** Every item (CSP, cookies, rate limiting, env validation, health check, backup) is well-documented and straightforward. The challenge is not forgetting anything — which is why a checklist is essential.
- **CSP in development vs. production is fundamentally different.** Development needs relaxed CSP for hot module replacement and React DevTools. Production needs strict CSP. Environment-conditional configuration is the only sane approach.
- **SQLite backup is just a file copy.** No fancy tooling needed — `cp db.sqlite db-backup-$(date).sqlite` is sufficient for MVP. The migration guide handles the real concern: transitioning to PostgreSQL without data loss.

**Next Session Plan**:
- Begin Post-MVP Phase 2 — Engagement & Content Depth
- First atomic build: A4 Lesson Quizzes (knowledge-check assessments at end of each module)

---

## Session 20 — 2026-06-06 — Post-MVP Kickoff: A4 Lesson Quizzes 🎯

**Duration**: ~1.5 hours
**Mood**: 😎→🎉 Fresh start energy — post-MVP builds feel different from MVP sprints

**Goal**: Build the first post-MVP atomic build — A4: Lesson Quizzes. Add knowledge-check assessments to the end of each module so learners can validate their understanding through active recall.

**What Happened**:
After shipping the MVP Release Candidate, this session kicked off the post-MVP phase with a different rhythm. The atomic build methodology means each feature is self-contained, fully tested, and thoroughly documented before moving on. A4 was the perfect first post-MVP build because it extends an existing pattern (lessons → completion → XP) with a new concept (knowledge validation).

**Schema design.** Added three new Prisma models: `Quiz` (one per module's last lesson), `QuizQuestion` (N multiple-choice questions per quiz with options A-D, correct answer, and explanation), and `QuizAttempt` (tracks every attempt with answers, score, time spent, and XP earned). Also added `AttemptStatus` enum and a `Quiz` relation on the `Lesson` model. The schema is designed to support future features like timed quizzes and question pools without migration.

**Quiz fixture.** Created `fixtures/quizzes.json` with 30 questions across 5 modules: Module 0 Onboarding (5 questions on PPC basics), Module 1 Foundations (8 questions on CPC, CTR, ACoS calculations), Module 4 Campaign Architecture (6 questions on SP/SB/SD types and match types), Module 6 Bidding Lab (5 questions on bid strategies and ACoS), and Module 7 Search Term Triage (6 questions on search terms vs keywords and negative keywords). Each question has 4 options, a correct answer, and a detailed explanation — the explanation is the educational payload, turning wrong answers into learning moments.

**Server actions.** Created `src/app/actions/quiz.ts` with three actions: `getQuiz(moduleNumber, userId)` returns questions with correct answers stripped (anti-cheating), `submitQuiz(quizId, answers, timeSpent, userId)` grades server-side and awards 100 XP on first pass, and `getQuizHistory(quizId, userId)` returns past attempts. The lazy seed pattern (same as the eventual badge system) means quizzes are seeded from the fixture on first access — no migration scripts needed. Adding new questions is just updating the JSON file.

**QuizPlayer component.** Built `src/components/adcraft/quiz-player.tsx` with a 4-phase UI flow: Ready (quiz info, previous attempts, start button) → Answering (step-by-step question navigation with progress bar and timer) → Submitted (score reveal with per-question breakdown showing correct/incorrect + explanations) → back to Ready for retries. The component integrates with the LessonPlayer — when a user reaches the last lesson of a module (type: 'quiz'), the LessonPlayer hands off to the QuizPlayer instead of showing MDX content. This means quizzes function as a completion gate: the lesson is only marked complete when the user passes the quiz, not just by clicking "Mark Complete."

**Module card integration.** Updated `module-cards.tsx` to show a Target icon and "Quiz" badge on each module card, signaling to learners that there's a knowledge check waiting. This small UI touch makes the quiz system discoverable — learners know from the dashboard that each module has a quiz they need to pass.

**Wins**:
- A4 shipped clean — first post-MVP atomic build complete with documentation
- 30 quiz questions authored with educational explanations that turn wrong answers into learning moments
- Quiz-as-gate pattern means modules can't be "completed" by just clicking through — learners must demonstrate understanding
- Lazy seed pattern means zero migration scripts — quizzes appear automatically when first accessed
- Build passes clean, all documentation updated (atomic build doc, worklog, project-plan)

**Struggles**:
- Authoring good quiz questions is harder than it looks — the distractors (wrong options) need to be plausible enough to test real understanding, not obviously wrong. Spent extra time making sure each question's wrong answers represented common misconceptions rather than random incorrect values.
- The QuizPlayer component went through two iterations — the first version tried to show all questions on one page (like a Google Form), but that didn't match the lesson-by-lesson pacing of the rest of the app. Switched to step-by-step navigation which feels more natural in the learning flow.

**Learnings**:
- **Active recall is the most effective learning technique.** Quizzes aren't just assessment — they're a pedagogical tool that strengthens memory. The explanation after each question is as important as the question itself.
- **Quiz-as-gate prevents checkbox learning.** Without quizzes, learners could click through lessons without absorbing anything. With quizzes as a gate, they have incentive to study carefully.
- **Lazy seed is the right pattern for content fixtures.** No migration scripts, no deployment coordination — just update the JSON file and the next user access triggers the seed. This is especially valuable for quiz content that will be iterated on frequently.
- **Post-MVP builds feel different.** The pressure of "must ship MVP" is gone, replaced by a more deliberate pace. Each atomic build is complete, documented, and reviewed before moving on. This is sustainable.

**Next Session Plan**:
- A1: Achievement Badges — gamification layer with 17 badges across 5 categories
- Continue post-MVP atomic build sequence
