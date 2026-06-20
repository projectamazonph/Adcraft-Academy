# Sessions 21–25 — Post-MVP: Engagement & Gamification

> AdCraft Development Diary — Sessions 21 through 25
>
> Sessions 21–22 complete. Sessions 23–25 will be added as they occur.

---

## Session 21 — 2026-06-06 — A1 Achievement Badges: Gamification Layer 🏅

**Duration**: ~1.5 hours
**Mood**: 🎨→🎉 Creative design work to satisfying completion

**Goal**: Build A1: Achievement Badges — a gamification layer that rewards learners for key milestones across their PPC training journey. Badges are awarded automatically when users hit specific criteria, creating tangible incentives to explore every corner of the platform.

**What Happened**:
Achievement badges are one of those features that seem simple on the surface but have deep integration implications. Every key action in the app — completing lessons, passing quizzes, finishing simulations, chatting with the AI Mentor, earning XP — now needs to trigger a badge check. This means touching almost every server action file, which is why the atomic build methodology is so important: the badge system is self-contained, well-documented, and doesn't break any existing functionality.

**Badge design.** Designed 17 badges across 5 categories: Engagement (first-time actions like completing your first lesson or quiz), Mastery (completion and excellence badges like Module Master and Quiz Master), XP Milestones (Century Club at 100 XP through XP Legend at 2,500 XP), Streak (Consistent Learner at 3 days, Week Warrior at 7 days), and Social (Mentor Seeker and Mentor Regular for AI Mentor interactions). Each badge has a tier (Bronze → Silver → Gold → Platinum) and an optional XP bonus. Three badges are marked "secret" — Sim Trifecta (complete all 3 sims), Perfectionist (100% on any quiz), and Mentor Regular (10 mentor chats) — they're hidden from the badge grid until earned, creating surprise moments.

**Schema design.** Added two new Prisma models: `Badge` (the badge definition with slug, title, description, icon, category, tier, criteria JSON, and XP reward) and `UserBadge` (the user-badge junction with earned timestamp and XP earned). Added `BadgeCategory` and `BadgeTier` enums. The `@@unique([userId, badgeId])` constraint prevents double-awarding. The `criteria` field is JSON — it stores a type (e.g., "lesson_count", "quiz_passed", "xp_earned") and a threshold value, which the `evaluateCriteria()` function interprets.

**Server actions.** Created `src/app/actions/badge.ts` with two actions: `getBadges(userId)` returns all badges with the user's earned status (secret badges hidden unless earned), and `checkAndAwardBadges(userId)` which is the core engine — it computes user stats, evaluates all unearned badge criteria, awards any newly earned badges with bonus XP, and returns the list of newly awarded badges for UI notification. The lazy seed pattern ensures badges are seeded from `fixtures/badges.json` on first access.

**Integration across 5 server actions.** This was the most delicate part — adding `checkAndAwardBadges()` calls to the end of five existing actions: `progress.ts` (after lesson completion — checks for First Steps, Module Master, XP milestones), `quiz.ts` (after quiz submission — checks for Quiz Ace, Quiz Master, Perfectionist), `simulation.ts` (after sim grading — checks for Sim Pioneer, Sim Specialist, Sim Trifecta), and `mentor.ts` (after mentor chat — checks for Mentor Seeker, Mentor Regular, and creates AiChatSession records for tracking). Each call is wrapped in try/catch so badge check failures never block the main action — badges are a nice-to-have, not critical path.

**BadgeShowcase component.** Built `src/components/adcraft/badge-showcase.tsx` — a grid display organized by category, with earned badges showing full color and unearned badges grayed out with a lock icon. Clicking a badge opens a detail modal with the badge description, criteria, tier, and XP bonus. When a new badge is earned (detected via the `newlyAwarded` return from `checkAndAwardBadges`), a toast notification slides in from the top-right with the badge icon and congratulatory message. The component is dynamically imported into the Dashboard between Simulation Cards and Quick Actions.

**Badge fixture.** Created `fixtures/badges.json` with all 17 badge definitions. Each entry includes: slug, title, description, icon (emoji for now — will be replaced with custom SVGs later), category, tier, xpReward, criteria JSON, order for display, isSecret flag, and isPublished flag.

**Wins**:
- 17 badges across 5 categories provide comprehensive coverage of the learner journey
- Auto-award integration across 5 server actions works seamlessly — badges appear naturally as users progress
- Secret badges create delightful surprise moments when earned
- Badge check failures never break the main action — defensive programming in action
- Lazy seed pattern means adding new badges requires only updating the JSON file
- BadgeShowcase component adds visual richness to the Dashboard

**Struggles**:
- The `evaluateCriteria()` function needed to be flexible enough to handle diverse criteria types (count thresholds, boolean flags, XP amounts) while remaining type-safe. Solved with a switch statement on criteria type that delegates to specific evaluation functions.
- Badge icon design is deferred — using emoji placeholders for now. Custom SVG icons will be a separate atomic build in the Content tier.
- The toast notification for newly earned badges required careful state management — the badge check happens server-side, but the toast needs to appear client-side. Solved by having each server action return `newlyAwarded[]` and the client component checking this array after each action call.

**Learnings**:
- **Gamification needs to feel earned, not given.** Badges should reward meaningful actions, not just existing. The three tiers (Engagement for first steps, Mastery for deep accomplishment, XP Milestones for consistency) ensure that badges represent real progress.
- **Secret badges are powerful motivation.** When learners know there are hidden badges, they explore more of the platform trying to find them. This drives engagement with features they might otherwise skip (like the AI Mentor).
- **Badge checks must be non-blocking.** If the badge system goes down or has a bug, the app should still work perfectly. The try/catch pattern around every `checkAndAwardBadges()` call ensures this.
- **JSON criteria is more flexible than enum-based criteria.** Using a JSON field for badge criteria means new criteria types can be added without schema migrations — just add a new case to `evaluateCriteria()`.

**Next Session Plan**:
- A2: Daily Streak Tracker — consecutive-day login tracking with streak-freeze mechanic
- Continue post-MVP atomic build sequence
