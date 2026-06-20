# Atomic Build A1: Achievement Badges

> **Status**: ✅ Complete
> **Phase**: Post-MVP (Phase 2)
> **Dependencies**: None (builds on existing MVP foundation)
> **Estimated Effort**: 1-2 days → Actual: ~1 day

---

## Overview

Achievement Badges add a gamification layer to AdCraft by rewarding learners for key milestones across their PPC training journey. Badges are awarded automatically when users hit specific criteria — completing their first lesson, passing quizzes, earning XP milestones, maintaining streaks, and interacting with the AI Mentor. Each badge carries a tier (Bronze → Silver → Gold → Platinum) and an optional XP bonus, creating tangible incentives that motivate learners to explore every corner of the platform.

The badge system is designed to be extensible: adding new badges requires only updating the `fixtures/badges.json` file and (if a new criteria type is needed) adding a case to the `evaluateCriteria` function. No schema changes or code deployment needed for new badge definitions.

---

## What Changed

### New Files

| File | Purpose |
|------|---------|
| `src/app/actions/badge.ts` | Server actions: `getBadges`, `checkAndAwardBadges` |
| `src/components/adcraft/badge-showcase.tsx` | Interactive badge showcase UI (grid by category, detail modal, notification toast) |
| `fixtures/badges.json` | Badge definitions — 17 badges across 5 categories |

### Modified Files

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added `Badge`, `UserBadge` models + `BadgeCategory`, `BadgeTier` enums + `badges` relation on `User` |
| `src/app/actions/types.ts` | Added 2 badge types: `BadgeView`, `BadgeAwardResult` |
| `src/app/actions/progress.ts` | Added `checkAndAwardBadges()` call after lesson completion (lesson count, module master, XP milestones) |
| `src/app/actions/quiz.ts` | Added `checkAndAwardBadges()` call after quiz submission (quiz ace, quiz master, perfectionist) |
| `src/app/actions/simulation.ts` | Added `checkAndAwardBadges()` call after each sim grading (sim pioneer, sim specialist, sim trifecta) |
| `src/app/actions/mentor.ts` | Added `checkAndAwardBadges()` call after mentor chat (mentor seeker, mentor regular) + AiChatSession creation |
| `src/components/adcraft/dashboard.tsx` | Added `BadgeShowcase` component (dynamic import) between Simulation Cards and Quick Actions |

### Database Schema

Two new models and two new enums:

```
Badge (1 per definition)
├── id, slug (unique), title, description, icon
├── category (BadgeCategory enum), tier (BadgeTier enum)
├── xpReward (bonus XP for earning), criteria (JSON)
├── order (display), isSecret, isPublished
├── createdAt, updatedAt
└── awards[] → UserBadge

UserBadge (N per user, 1 per badge per user)
├── id, userId, badgeId
├── xpEarned (bonus from badge.xpReward)
├── earnedAt, createdAt
└── @@unique([userId, badgeId])

BadgeCategory: ENGAGEMENT | MASTERY | XP_MILESTONE | STREAK | SOCIAL
BadgeTier: BRONZE | SILVER | GOLD | PLATINUM
```

---

## Badge Catalog

### Engagement Badges (First-time actions)

| Badge | Tier | XP Bonus | Criteria |
|-------|------|----------|----------|
| First Steps | Bronze | +25 | Complete 1 lesson |
| Quiz Ace | Bronze | +50 | Pass 1 quiz |
| Sim Pioneer | Bronze | +25 | Complete 1 simulation |

### Mastery Badges (Completion & excellence)

| Badge | Tier | XP Bonus | Criteria | Secret? |
|-------|------|----------|----------|---------|
| Module Master | Silver | +75 | Complete 1 module | No |
| Quiz Master | Gold | +200 | Pass all 5 quizzes | No |
| Sim Specialist | Gold | +150 | Score 90%+ on any sim | No |
| Sim Trifecta | Gold | +200 | Complete all 3 sims | Yes |
| Perfectionist | Gold | +100 | Score 100% on any quiz | Yes |
| Five Star Student | Platinum | +500 | Complete all 5 modules | No |

### XP Milestone Badges

| Badge | Tier | XP Bonus | Criteria |
|-------|------|----------|----------|
| Century Club | Bronze | 0 | Earn 100 XP |
| XP Hunter | Silver | 0 | Earn 500 XP |
| Thousand Club | Gold | 0 | Earn 1,000 XP |
| XP Legend | Platinum | 0 | Earn 2,500 XP |

### Streak Badges

| Badge | Tier | XP Bonus | Criteria |
|-------|------|----------|----------|
| Consistent Learner | Bronze | +25 | 3-day login streak |
| Week Warrior | Silver | +100 | 7-day login streak |

### Social Badges

| Badge | Tier | XP Bonus | Criteria | Secret? |
|-------|------|----------|----------|---------|
| Mentor Seeker | Bronze | +10 | Ask AI Mentor 1 question | No |
| Mentor Regular | Silver | +50 | Have 10 mentor conversations | Yes |

**Total: 17 badges** — 6 visible from start, 3 secret (revealed when earned)

---

## Badge Awarding Flow

```
User completes a key action (lesson, quiz, simulation, mentor chat)
  → Server action calls checkAndAwardBadges(userId)
  → checkAndAwardBadges:
    1. Ensures badges are seeded from fixture (lazy seed)
    2. Computes user stats (lessons, modules, quizzes, sims, XP, streak, mentor chats)
    3. Fetches all badges and user's earned badge IDs
    4. For each unearned badge:
       a. Parses criteria JSON
       b. Evaluates against stats via evaluateCriteria()
       c. If met: creates UserBadge record + awards bonus XP
    5. Returns newlyAwarded[] for UI notification

  → If newlyAwarded.length > 0:
    → BadgeShowcase component shows toast notification
    → Badge grid updates to show newly earned badges
```

---

## XP Integration

| Event | Badge XP | Condition |
|-------|----------|-----------|
| Badge earned (with xpReward) | Badge.xpReward | Automatically added to user XP + level recalculated |
| XP milestone badges | 0 | No bonus XP — the XP itself is the milestone |

Badge XP is **additive** — it stacks on top of the XP earned from the action that triggered the badge. For example, completing a lesson awards 50 XP (lesson) + 25 XP (First Steps badge) = 75 XP total.

---

## Lazy Seed Pattern

Badge definitions follow the same lazy seed pattern as quizzes:

1. `ensureBadgesSeeded()` checks if badges exist in the DB
2. If not, reads `fixtures/badges.json` and creates `Badge` records
3. Only unseeded badges are created (idempotent)
4. Adding new badges = update the fixture JSON → next user action triggers seed

---

## API Reference

### `getBadges(userId?: string)`

Returns all badges with the user's earned status. Secret badges are hidden unless earned.

**Returns:** `BadgeView[]` with earned status, earned date, tier, category

### `checkAndAwardBadges(userId?: string)`

Evaluates all badge criteria against the user's current stats. Awards any newly earned badges with bonus XP.

**Returns:** `BadgeAwardResult` with `newlyAwarded[]`, `totalEarned`, `totalAvailable`

---

## Secret Badges

Three badges are marked `isSecret: true` — they are hidden from the badge grid until earned:

1. **Sim Trifecta** (Gold) — Complete all 3 simulations
2. **Perfectionist** (Gold) — Score 100% on any quiz
3. **Mentor Regular** (Silver) — Have 10 mentor conversations

Secret badges create surprise moments and reward thorough exploration of the platform.

---

## Security Considerations

1. **Auth required**: All badge actions require authenticated user via `getAuthUserId()`
2. **Idempotent awarding**: `@@unique([userId, badgeId])` prevents double-awarding
3. **Non-critical integration**: Badge check failures are caught and logged — they never block the main action
4. **Server-side evaluation**: All criteria evaluation happens server-side; client cannot manipulate badge awards
5. **XP idempotency**: Badge XP is only awarded when the UserBadge record is first created

---

## Future Enhancements (Post-A1)

These are NOT in this atomic build but are natural extensions:

- **Badge sharing**: Social share buttons for earned badges
- **Badge progression hints**: "X more lessons to earn Module Master" tooltip
- **Animated badge unlock**: Full-screen celebration animation for rare badges
- **Team badge comparison**: See which badges teammates have earned
- **Time-limited badges**: Event-specific badges available only during certain periods
- **Badge streak bonuses**: Extra XP multiplier when earning multiple badges in a week
