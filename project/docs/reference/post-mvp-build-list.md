# AdCraft Post-MVP Atomic Build List

> Comprehensive list of all post-MVP features, organized as atomic builds — small, independently deployable units that build on each other incrementally. Each build is self-contained, testable, and shippable on its own.

> **Source**: Updated 2026-06-07 with atomic build approach
> **MVP Completion**: 100% — Release Candidate shipped 2026-06-04

---

## Phase 2: Engagement & Content Depth (Current)

**Goal**: Increase learner engagement through knowledge validation, gamification, and deeper content.

### Tier 1: Engagement & Retention (Highest Impact)

| # | Build | Status | Description | Est. Effort |
|---|-------|--------|-------------|-------------|
| **A4** | **Lesson Quizzes** | ✅ **Shipped** | Multiple-choice knowledge checks at end of each module, 70% pass threshold, 100 XP on first pass, 30 questions across 5 modules, lazy seed pattern | 1 day |
| **A1** | **Achievement Badges** | ✅ **Shipped** | 17 badges across 5 categories (Engagement, Mastery, XP Milestone, Streak, Social), 4 tiers (Bronze→Platinum), bonus XP, lazy seed pattern, auto-award on key actions, 3 secret badges | 1 day |
| **A2** | Daily Streaks | ⬚ Not Started | Consecutive-day login tracking, streak counter in header, streak-freeze mechanic (1 freeze/week) | 1 day |
| **A3** | Leaderboard | ⬚ Not Started | Top learners by XP this week/month, materialized view, /leaderboard page | 1-2 days |
| **A5** | XP Multiplier Events | ⬚ Not Started | Time-limited 2x XP events, config in DB, visual indicator in UI | 1 day |

### Tier 2: Content & Learning Depth

| # | Build | Status | Description | Est. Effort |
|---|-------|--------|-------------|-------------|
| **B1** | Advanced Content Modules | ⬚ Not Started | 4 additional modules (Sponsored Brands Advanced, DSP Basics, Attribution, Budget Optimization) | 2-3 days |
| **B2** | Interactive Scenarios | ⬚ Not Started | "What would you do?" branching decision trees with AI-evaluated responses | 2-3 days |
| **B3** | Video Lesson Embeds | ⬚ Not Started | Support embedded video content, progress via watch percentage | 1-2 days |
| **B4** | Downloadable Cheat Sheets | ⬚ Not Started | PDF/one-page summaries per module, gated by lesson completion | 1-2 days |
| **B5** | Mentor Context Memory | ⬚ Not Started | Remember past mentor conversations per user, summarize for follow-ups | 2 days |

### Tier 3: Analytics & Insights

| # | Build | Status | Description | Est. Effort |
|---|-------|--------|-------------|-------------|
| **C1** | Learning Analytics Dashboard | ⬚ Not Started | Personal stats — time spent, completion rate, weak areas, XP trend chart | 2-3 days |
| **C2** | Admin Analytics Panel | ⬚ Not Started | Aggregate metrics — DAU/MAU, module drop-off, avg completion time | 2-3 days |
| **C3** | Event Tracking Pipeline | ⬚ Not Started | Structured event tracking (lesson_started, quiz_answered, mentor_asked) | 1-2 days |
| **C4** | A/B Test Framework | ⬚ Not Started | Feature flag system for testing UI variants, XP amounts, mentor prompts | 2 days |

### Tier 4: Platform & Monetization

| # | Build | Status | Description | Est. Effort |
|---|-------|--------|-------------|-------------|
| **D1** | Certificate Generation | ⬚ Not Started | Auto-generate PDF certificates with name, date, module, verification hash | 1-2 days |
| **D2** | Stripe Payment Integration | ⬚ Not Started | Premium tier gating, /pricing page, checkout session, webhook handler | 2-3 days |
| **D3** | Premium Content Gating | ⬚ Not Started | Role-based access (FREE vs PRO), middleware check, upgrade prompts | 1-2 days |
| **D4** | Email Notifications | ⬚ Not Started | Welcome email, streak reminders, weekly progress digest | 1-2 days |
| **D5** | PWA & Offline Support | ⬚ Not Started | Service worker, offline lesson caching, install prompt | 2-3 days |

### Tier 5: Infrastructure & Scale

| # | Build | Status | Description | Est. Effort |
|---|-------|--------|-------------|-------------|
| **E1** | PostgreSQL Migration | ⬚ Not Started | Move from SQLite → PostgreSQL (guide exists), connection pooling | 1-2 days |
| **E2** | Redis Session & Cache | ⬚ Not Started | Rate-limit state to Redis, session storage, content cache | 1-2 days |
| **E3** | Image/CDN Optimization | ⬚ Not Started | Static assets to CDN, next/image remote patterns, WebP conversion | 1 day |
| **E4** | Multi-Language (i18n) | ⬚ Not Started | next-intl setup, content JSON per locale, EN + ES + PT-BR | 2-3 days |
| **E5** | CI/CD Pipeline | ⬚ Not Started | GitHub Actions: lint → test → build → deploy, preview URLs per PR | 1-2 days |

---

## Recommended Build Order (Dependency-Aware)

```
Week 1-2:  A4 (Quizzes) ✅ → A1 (Badges) ✅ → A2 (Streaks)
Week 2-3:  C3 (Event Tracking) → C1 (Personal Analytics)
Week 3-4:  B1 (Advanced Modules) → B5 (Mentor Memory)
Week 4-5:  A3 (Leaderboard) → A5 (XP Events)
Week 5-6:  D1 (Certificates) → D4 (Email Notifications)
Week 6-7:  D2 (Stripe) → D3 (Premium Gating)
Week 7-8:  C2 (Admin Analytics) → C4 (A/B Testing)
Week 8+:   E1 (PostgreSQL) → E2 (Redis) → E5 (CI/CD)
```

---

## Phase 3: Team, Reporting & Validation (Weeks 9-16)

**Goal**: Unlock B2B revenue, enable agency adoption, and validate learning transfer.

| Priority | Feature | Status | Key Tech Dependency |
|----------|---------|--------|-------------------|
| 🔴 P0 | Team Dashboard & Manager Wizard | ⬚ Not Started | Org RBAC, Aggregation Queries |
| 🔴 P0 | Client Roleplay Agent + Heat Gauge | ⬚ Not Started | AI Streaming, Safety Classifier |
| 🔴 P0 | Certification Lifecycle System | ⬚ Not Started | Cron Jobs, Cert Registry DB |
| 🟡 P1 | Instructor Mode & Cohort Assignments | ⬚ Not Started | Instructor RBAC, Messaging API |
| 🟡 P1 | QA Auditor Agent | ⬚ Not Started | LLM-as-Judge, Rule Engine Integration |
| 🟡 P1 | Psychometric Validation Hooks | ⬚ Not Started | Analytics Pipeline, Survey Integration |
| 🟢 P2 | Leaderboards & Streak Protection | ⬚ Not Started | Redis Leaderboard, Gamification Service |
| 🟢 P2 | "Explain My Mistake" AI Replay | ⬚ Not Started | Event Sourcing, State Replay |

---

## Phase 4: Data Integrations & Real-World Fidelity (Weeks 17-30)

**Goal**: Bridge simulation to production; support advanced users; enable white-label.

| Priority | Feature | Status | Key Tech Dependency |
|----------|---------|--------|-------------------|
| 🔴 P0 | File Upload Parser + Sanitization Pipeline | ⬚ Not Started | Presidio NER, S3 Ephemeral Storage |
| 🔴 P0 | Scenario Generator by Category | ⬚ Not Started | STR Generator Service, KS-Test Validation |
| 🟡 P1 | Helium 10 / MerchantSpring Import | ⬚ Not Started | API Adapters, Schema Mapping |
| 🟡 P1 | Real-Data Sandbox Mode | ⬚ Not Started | Amazon Ads API, OAuth, Read-Only Scopes |
| 🟡 P1 | White-Label Agency Portals | ⬚ Not Started | Multi-Tenant Config, CNAME Routing |
| 🟢 P2 | AI-Generated Client Report Drafts | ⬚ Not Started | RAG, Template Engine, Export Service |
| 🟢 P2 | Browser Extension for Ads Console | ⬚ Not Started | Chrome Extension API, Context Matching |
| 🟢 P2 | Voice-Based Oral Exam | ⬚ Not Started | STT/TTS APIs, Audio Processing Pipeline |

---

## Phase 5: Advanced Mastery & Ecosystem (Weeks 31+)

| Priority | Feature | Status |
|----------|---------|--------|
| 🟡 P1 | Multiplayer "Agency War Room" | ⬚ Not Started |
| 🟡 P1 | Adbrew/Xnurta Rule Simulation | ⬚ Not Started |
| 🟢 P2 | Amazon Marketing Stream Integration | ⬚ Not Started |
| 🟢 P2 | ClickUp/Asana Task Template Export | ⬚ Not Started |
| 🟢 P2 | Advanced Tactics Modules | ⬚ Not Started |
| 🟢 P2 | Community & Peer Review | ⬚ Not Started |

---

## Critical Dependencies Before Phase 3

1. **Legal & Compliance Package Signed** — ToS, AI Disclaimer, DPA templates, Amazon TM clearance
2. **Content Maintenance SOP Live** — Policy change monitoring, synthetic data refresh, author onboarding
3. **Support Infrastructure Ready** — Ticket system, macro library, feedback-to-product loop
4. **Demo Environment Deployed** — Isolated sandbox with seed data for sales calls
5. **ROI Calculator Validated** — Beta cohort data for sales enablement

---

*Last updated: 2026-06-07 — Phase 2 atomic builds listed, A4 shipped*
