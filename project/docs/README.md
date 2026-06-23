# AdCraft: Amazon PPC Command Center

> A comprehensive Amazon PPC training and simulation platform that transforms sellers into advertising experts through hands-on, risk-free campaign simulations with AI-powered feedback.

---

## Quick Navigation

| Section | Go To | Updates |
|---------|-------|---------|
| Project overview & tech stack | You are here | On significant changes |
| Architecture & design patterns | [`reference/architecture.md`](./reference/architecture.md) | On arch changes |
| Server Actions API docs | [`reference/api-reference.md`](./reference/api-reference.md) | On API changes |
| Frontend technical spec | [`reference/frontend-spec.md`](./reference/frontend-spec.md) | On component/route changes |
| Backend technical spec | [`reference/backend-spec.md`](./reference/backend-spec.md) | On engine/API changes |
| Security & admin spec | [`reference/security-admin-spec.md`](./reference/security-admin-spec.md) | On security/RBAC changes |
| Content production kit | [`reference/content-production-kit.md`](./reference/content-production-kit.md) | On content/template changes |
| Course syllabus (all 13 modules) | [`reference/course-syllabus.md`](./reference/course-syllabus.md) | On curriculum changes |
| User journey & paths | [`reference/user-journey.md`](./reference/user-journey.md) | On UX flow changes |
| Post-MVP atomic builds | [`reference/post-mvp-build-list.md`](./reference/post-mvp-build-list.md) | On roadmap changes |
| Coding principles | [`reference/karpathy-guidelines.md`](./reference/karpathy-guidelines.md) | Rarely |
| MVP scope & exclusions | [`reference/mvp-scope-definition.md`](./reference/mvp-scope-definition.md) | On scope changes |
| **Post-MVP atomic build docs** | [`atomic-builds/`](./atomic-builds/) | Per atomic build |
| Agent team spec | [`reference/agents-spec.md`](./reference/agents-spec.md) | On agent changes |
| MVP progress & milestones | [`tracking/project-plan.md`](./tracking/project-plan.md) | Every session |
| Active errors | [`tracking/error-log.md`](./tracking/error-log.md) | As errors occur |
| Development diary | [`diary/`](./diary/) | Every session |
| Architecture decisions | [`decisions/`](./decisions/) | On major decisions |
| **Doc conventions & anti-bloat rules** | [`conventions.md`](./conventions.md) | On rule changes |

---

## Project Overview

AdCraft is an interactive learning platform designed to teach Amazon PPC (Pay-Per-Click) advertising through realistic simulations, structured curriculum, and AI mentorship. Users practice creating campaigns, managing bids, and optimizing ad spend in a sandbox environment that mirrors real Amazon Seller Central — without risking real money.

### Core Value Proposition

- **Learn by doing**: Simulated Amazon PPC environment with real-world scenarios
- **AI Mentor**: Personalized feedback and guidance on every decision
- **Structured curriculum**: 13 modules from beginner to advanced (Modules 0-12)
- **Risk-free practice**: Make mistakes in a sandbox, not on live campaigns
- **Team dashboards**: Managers track team progress and certify competency

---

## Tech Stack (MVP)

> **Architecture: Monolith-First** — Single Next.js application. FastAPI extraction deferred to Phase 3. See [ADR-001](./decisions/ADR-001-monolith-first.md).

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16 + React 19 | Monolith: frontend + API + server logic |
| UI Components | shadcn/ui + Tailwind CSS | Design system, styling |
| State Management | Zustand + TanStack Query | UI state (client) + server state |
| Deterministic Engine | Pure TypeScript (`/src/engine/`) | Evaluation, scoring, simulation logic |
| Database | PostgreSQL + Prisma | Relational data, JSONB for sim state |
| AI (Client) | Puter.js (CDN) | Client-side AI chat via Puter — no API key, free tier |
| Auth | NextAuth.js | Single auth instance |
| Content | MDX | Lesson authoring |
| Synthetic Data | Pre-generated JSON fixtures | Build-time, not runtime |
| Testing | Vitest + fast-check + Playwright | Unit, property-based, E2E |
| Deployment | Vercel | Single deployment target |
| Animations | Framer Motion | UI animations |

### Deferred to Phase 3+
| Technology | Purpose | Trigger |
|-----------|---------|--------|
| FastAPI + Pydantic V2 | Python backend for pandas/numpy | Runtime synthetic data gen |
| Redis | Simulation state, event sourcing | Multiplayer or perf needs |
| SQLAlchemy | Python ORM | FastAPI extraction |
| pgvector | RAG for AI grounding | Knowledge base scale |
| Terraform / AWS CDK | IaC | Self-hosted deployment |

---

## Project Structure (MVP)

```
adcraft/
├── docs/                           # Project documentation (see conventions.md)
│   ├── README.md                  # This file — navigation hub
│   ├── conventions.md             # Doc rules & anti-bloat charter
│   ├── reference/                 # Stable docs (change rarely)
│   ├── decisions/                 # Architecture Decision Records
│   ├── tracking/                  # Active tracking (changes often)
│   ├── diary/                     # Split session journal
│   ├── history/                   # Archived/resolved content
│   └── templates/                 # Entry templates
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── page.tsx              # Main app (dashboard, modules, simulations, mentor)
│   │   ├── layout.tsx            # Root layout with dark theme + AuthProvider
│   │   ├── globals.css           # Custom emerald/slate theme variables
│   │   ├── auth/                 # Auth pages
│   │   │   ├── signin/page.tsx   # Custom sign-in page
│   │   │   └── signup/page.tsx   # Custom sign-up page
│   │   ├── api/auth/             # NextAuth API routes
│   │   │   ├── [...nextauth]/route.ts  # NextAuth handler
│   │   │   └── signup/route.ts  # Registration API endpoint
│   │   ├── api/mentor/stream/    # AI Mentor SSE streaming endpoint
│   │   │   └── route.ts          # POST — token-by-token LLM response
│   │   └── actions/              # Server Actions
│   │       ├── types.ts          # Shared types (no 'use server')
│   │       ├── simulation.ts     # Hybrid execution: start/grade/history/stats
│   │       ├── lesson.ts         # Lesson content fetching from MDX files
│   │       ├── progress.ts       # Lesson/module progress tracking
│   │       ├── mentor.ts         # AI Mentor via z-ai-web-dev-sdk
│   │       ├── quiz.ts           # Quiz lifecycle: get/submit/history (Post-MVP A4)
│   │       └── badge.ts          # Badge lifecycle: get/checkAndAward (Post-MVP A1)
│   ├── engine/                    # Pure TS Deterministic Engine
│   │   ├── types.ts              # 50+ domain types, type guards
│   │   ├── evaluation.ts         # Scoring & evaluation (3 simulations)
│   │   ├── simulation.ts         # Simulation state lifecycle
│   │   ├── formulas.ts           # 9 PPC formulas, health assessment, registry
│   │   └── index.ts              # Barrel export
│   ├── components/
│   │   ├── adcraft/              # All custom AdCraft components (24+ files)
│   │   │   ├── quiz-player.tsx   # Interactive quiz UI (Post-MVP A4)
│   │   │   └── badge-showcase.tsx # Badge grid + detail modal + notification toast (Post-MVP A1)
│   │   └── ui/                   # shadcn/ui base components
│   ├── stores/                    # Zustand stores
│   │   ├── str-triage-store.ts   # STR Triage Arena state + engine + Server Actions
│   │   ├── bid-elevator-store.ts # Bid Elevator state + engine + Server Actions
│   │   └── campaign-builder-store.ts # Campaign Builder state + engine + Server Actions
│   ├── hooks/                     # Custom React hooks
│   └── lib/                       # Utilities, helpers, database client
│       ├── auth.ts                # NextAuth configuration (Credentials, JWT)
│       ├── auth-guard.ts          # Server-side auth helpers (getAuthUserId)
│       └── db.ts                  # Prisma client singleton
├── src/middleware.ts                # JWT route protection (redirects to /auth/signin)
├── content/                        # Educational content
│   └── modules/                   # Module MDX files (5 modules, 19 lessons)
├── fixtures/                       # Pre-generated synthetic data
│   ├── str-triage-pack-1.json    # 20 search term scenarios
│   ├── bid-elevator-pack-1.json  # 10 bidding scenarios
│   ├── campaign-builder-pack-1.json # Campaign Builder data
│   ├── quiz-questions.json       # 30 quiz questions across 5 modules (Post-MVP A4)
│   └── badges.json               # 17 badge definitions across 5 categories (Post-MVP A1)
├── prisma/                         # Database schema
│   └── schema.prisma              # 17 models, 9 enums, org_id prep
└── public/                         # Static assets
```

---

## Feature Modules

### Learning System (MVP: 5 Modules + Post-MVP Quizzes)
- **Module 0**: Onboarding — Welcome, platform tour, first sim intro
- **Module 1**: Foundations — PPC basics, key metrics (CPC, ACoS, TACoS, RoAS)
- **Module 4**: Campaign Architecture — Sponsored Products, Brands, Display
- **Module 6**: Bidding Lab — Bid strategies, position economics, budget pacing
- **Module 7**: Search Term Triage — Negative keywords, STR analysis, optimization
- **Progress Tracking**: XP, levels, module completion status
- **Lesson Quizzes** *(Post-MVP A4)*: Multiple-choice knowledge checks at end of each module, 70% pass threshold, 100 XP on first pass, 30 questions across 5 modules
- **Achievement Badges** *(Post-MVP A1)*: 17 badges across 5 categories (Engagement, Mastery, XP Milestone, Streak, Social), 4 tiers (Bronze→Platinum), bonus XP, auto-award on key actions, 3 secret badges

### Simulation Engine (MVP: 3 Simulations)
- **Campaign Builder**: Form-based campaign creation with keyword selection, bid configuration, and 5-criteria evaluation
- **Bid Elevator**: Sequential bidding with per-scenario feedback, quick bid suggestions, CPC hints
- **STR Triage Arena**: TanStack Table grid for search term triage with 5 action types
- **Hybrid Execution**: Client preview (<100ms) + server authoritative scoring
- **Status**: 3 of 3 simulations complete (100%)

### AI Mentor
- **SSE streaming**: Token-by-token real-time response via /api/mentor/stream
- **Cancel support**: Stop generation mid-stream, preserve received content
- **Context-aware**: Module/lesson-aware responses with suggested questions
- **Rule-grounded**: AI answers grounded in PPC rule database (12 rule IDs)
- **Markdown rendering**: Rich formatted responses with ReactMarkdown + remarkGfm
- **Dual-path**: Streaming API route + non-streaming Server Action fallback

### Post-MVP Features (Phase 2 — In Progress)
- **A4: Lesson Quizzes** ✅ — Knowledge checks at end of each module with XP rewards
- **A1: Achievement Badges** ✅ — 17 badges, 5 categories, 4 tiers, auto-award, bonus XP
- **A2: Daily Streaks** ⬚ — Consecutive-day login tracking
- **A3: Leaderboard** ⬚ — Top learners by XP
- **A5: XP Multiplier Events** ⬚ — Time-limited bonus XP

### Excluded from MVP
Modules 2,3,5,8-12 | Team Dashboard | File Uploads | Real API Integration | Multiplayer | Voice Exam | Certifications

---

## Development Agent Team

The project is built by a team of 6 specialized development agents. See [`agents-spec.md`](./reference/agents-spec.md) for the full specification.

| Agent | Role | Subagent Type |
|-------|------|---------------|
| Architect | System design, schemas, infra | `Plan` |
| Backend Engineer | Deterministic engine, logic | `general-purpose` |
| Frontend Engineer | Next.js, React, UI components | `full-stack-developer` |
| AI Orchestrator | LLM integration, safety guardrails | `general-purpose` |
| Content Strategist | Curriculum, scenarios, prompts | `general-purpose` |
| DevOps Engineer | Security, compliance, deployment | `general-purpose` |

### Core Principles
1. **Deterministic First** — All scoring, logic, rules are deterministic. AI is only for explanation/generation.
2. **Safety & Compliance** — No black-hat tactics, no financial guarantees, strict PII sanitization, Amazon TM compliance.
3. **Pedagogical Integrity** — Every feature supports "Do The Thing" learning model. No passive consumption.
4. **Monolith-First, Extractable Engine** — Single Next.js app for MVP. Pure TS engine at `/src/engine/` with zero framework deps, extractable to FastAPI when needed. See [ADR-001](./decisions/ADR-001-monolith-first.md).

---

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local

# Run database migrations
npx prisma migrate dev

# Start development server
pnpm dev
```

---

## Build Status

| Component | Status | Last Updated |
|-----------|--------|-------------|
| Architecture Resolution | Complete | 2026-06-04 |
| MVP Scope Definition | Complete | 2026-06-04 |
| Project Setup & DB | Complete | 2026-06-04 |
| Deterministic Engine | Core Complete | 2026-06-04 |
| Database (Prisma Schema) | Complete | 2026-06-04 |
| Frontend App Shell | Complete | 2026-06-04 |
| STR Triage Arena Simulation | Playable | 2026-06-04 |
| Bid Elevator Simulation | Playable | 2026-06-04 |
| Campaign Builder Simulation | Playable | 2026-06-04 |
| Module Content (MDX) | Complete (100%) | 2026-06-04 |
| Server Actions (Persistence) | Complete | 2026-06-04 |
| Formula Calculator Widget | Complete | 2026-06-04 |
| Lesson Player (MDX Rendering) | Working | 2026-06-04 |
| Module Progress Tracking | Complete (100%) | 2026-06-04 |
| Dashboard → Real Data | Complete (100%) | 2026-06-04 |
| AI Mentor Integration | Complete (100%) — SSE streaming | 2026-06-04 |
| Testing & QA | Core Complete (75%) | 2026-06-04 |
| Authentication (NextAuth) | Complete (100%) | 2026-06-04 |
| **Lesson Quizzes (A4)** | **Complete (100%)** | 2026-06-07 |
| **Achievement Badges (A1)** | **Complete (100%)** | 2026-06-07 |
| MVP Deployment Hardening | Complete (100%) | 2026-06-04 |

---

## Documentation Directory Map

```
docs/
├── README.md                       ← You are here
├── conventions.md                  ← Anti-bloat rules & writing standards
│
├── reference/                      ← Stable docs (rarely change)
│   ├── architecture.md             ← System design & patterns
│   ├── api-reference.md            ← Server Actions & types API
│   ├── frontend-spec.md            ← Frontend technical specification
│   ├── backend-spec.md             ← Backend technical specification
│   ├── security-admin-spec.md      ← Security & admin specification
│   ├── content-production-kit.md   ← Universal lesson template & AI prompts
│   ├── course-syllabus.md          ← Full 13-module course syllabus
│   ├── user-journey.md             ← User paths from landing to cert
│   ├── post-mvp-build-list.md      ← Post-MVP atomic build list
│   ├── karpathy-guidelines.md      ← Coding principles
│   ├── mvp-scope-definition.md     ← Locked MVP scope
│   └── agents-spec.md              ← Agent team spec
│
├── atomic-builds/                  ← Post-MVP atomic build docs (one per build)
│   ├── A4-lesson-quizzes.md        ← A4: Lesson Quizzes
│   └── A1-achievement-badges.md    ← A1: Achievement Badges
│
├── decisions/                      ← Architecture Decision Records
│   └── ADR-001-monolith-first.md   ← Monolith-First pivot
│
├── tracking/                       ← Current state (changes often)
│   ├── project-plan.md             ← MVP progress & milestones
│   └── error-log.md                ← Active error tracking
│
├── diary/                          ← Session journal (split by range)
│   ├── README.md                   ← Session timeline index
│   ├── sessions-01-05.md           ← Sessions 1-5
│   ├── sessions-06-10.md           ← Sessions 6-10
│   ├── sessions-11-15.md           ← Sessions 11-12+
│   └── _template.md                ← New entry template
│
├── history/                        ← Archived (resolved/stale)
│   ├── build-log.md                ← Full build history
│   ├── worklog.md                  ← Full task worklog
│   ├── pre-build-concerns.md       ← Archived concerns
│   └── archive-manifest.md         ← What's archived & why
│
└── templates/                      ← Entry templates
    ├── diary-entry.md
    ├── build-entry.md
    ├── error-entry.md
    └── worklog-entry.md
```

---

*Last updated: 2026-06-23 — Post-MVP Phase 2: A4 Lesson Quizzes + A1 Achievement Badges shipped*
