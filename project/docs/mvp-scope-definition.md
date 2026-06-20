# AdCraft MVP Scope Definition

> Defines exactly what is in scope for the MVP (Phase 1 + Phase 2 Core). Everything not listed here is explicitly excluded.

**Status:** Approved
**Date:** 2026-06-04
**Approved By:** Product Owner

---

## MVP Success Criteria

> A single user can complete the 5 modules, pass the 3 core simulations with deterministic scoring, and receive AI feedback grounded in rules.

---

## ✅ IN SCOPE — MVP

### Modules (5 of 13)

| Module | Title | Focus |
|--------|-------|-------|
| 0 | Onboarding | Welcome, platform tour, first simulation intro |
| 1 | Foundations | PPC basics, key metrics (CPC, ACoS, TACoS, RoAS) |
| 4 | Campaign Architecture | Sponsored Products, Brands, Display structure |
| 6 | Bidding Lab | Bid strategies, position economics, budget pacing |
| 7 | Search Term Triage | Negative keywords, search term analysis, optimization |

### Simulations (3)

| Simulation | Component | Description |
|-----------|-----------|-------------|
| Campaign Builder | `CampaignBuilder` (not yet built) | Campaign structure creation with keywords, bids, and budgets |
| Bid Elevator | `BidElevator` | Sequential bidding decisions with per-scenario feedback, quick bid suggestions, CPC hints |
| STR Triage Arena | `StrTriageArena` | TanStack Table grid for search term triage with 5 action types and live preview scoring |

### Core Features

| Feature | Implementation |
|---------|---------------|
| Deterministic Evaluation Engine | Pure TS module at `/src/engine/` — shared client/server |
| Hybrid Execution Model | Client preview (<100ms) + server authoritative scoring |
| AI Mentor Feedback | Vercel AI SDK + Server Actions, SSE streaming |
| Progress Tracking | XP, levels, module completion status |
| User Authentication | NextAuth.js single instance |
| Lesson Player | MDX content with interactive widgets |

### Technical Infrastructure

| Component | Choice |
|-----------|--------|
| Framework | Monolithic Next.js (App Router) |
| ORM | Prisma only |
| Database | PostgreSQL (JSONB for simulation state) |
| AI | z-ai-web-dev-sdk + Vercel AI SDK |
| State | Postgres JSONB + React state (no Redis) |
| Auth | NextAuth.js |
| Content | MDX files authored by founders/SMEs |
| Synthetic Data | Pre-generated JSON fixtures (build-time) |
| Deployment | Vercel |
| Testing | Vitest + fast-check (property-based) |

---

## ❌ EXPLICITLY EXCLUDED — MVP

### Modules Not Included

| Module | Title | Reason |
|--------|-------|--------|
| 2 | Keyword Research | Deferred to Phase 2 |
| 3 | Ad Copy & Creative | Deferred to Phase 2 |
| 5 | Budget & Pacing | Deferred to Phase 2 |
| 8 | Advanced Targeting | Deferred to Phase 3 |
| 9 | Reporting & Analytics | Deferred to Phase 3 |
| 10 | Brand Defense | Deferred to Phase 3 |
| 11 | Scaling Strategies | Deferred to Phase 3 |
| 12 | Certification | Deferred to Phase 3 |

### Features Not Included

| Feature | Reason |
|---------|--------|
| Team Dashboard | Manager tools deferred to Phase 3 |
| File Uploads | No CSV/XLSX import for MVP |
| Real Amazon API Integration | 100% simulation — no Amazon Ads API calls |
| Multiplayer / Collaborative | Requires Redis/WebSockets — deferred |
| Voice Exam | Deferred to Phase 4 |
| Certification System | Deferred to Phase 3 |
| Content Management System | MDX files for MVP, visual builder later |
| Runtime Synthetic Data Generator | Build-time JSON fixtures for MVP |
| FastAPI Backend | Monolith-first; extraction when needed |
| Redis | Postgres JSONB sufficient for MVP |
| Multi-tenancy (RLS) | Single-tenant; org_id column prep only |
| Internationalization (i18n) | English only for MVP |
| Mobile-first Responsive | Desktop-primary; basic responsive only |

---

## 🏗️ Architecture Decisions for MVP

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Monolith-First Next.js | Eliminates dual-stack complexity for MVP |
| 2 | Pure TS Deterministic Engine | Extractable to FastAPI later; testable now |
| 3 | Hybrid Execution Model | Client preview + server authoritative scoring |
| 4 | Prisma Only | Single ORM, single migration path |
| 5 | Postgres JSONB for State | Replaces Redis for simulation state storage |
| 6 | Vercel AI SDK + SSE | Simpler than WebSocket; sufficient for AI feedback |
| 7 | Pre-generated JSON Fixtures | No runtime synthetic data generation needed |
| 8 | MDX Content Authoring | Founders write directly; no CMS needed |
| 9 | org_id Column Prep | Add nullable column now, enforce multi-tenancy later |

---

## MVP Module Map

```
Module 0: Onboarding ──────────────────────► Welcome + Tour
Module 1: Foundations ──────────────────────► Metrics, Formulas, Basics
Module 4: Campaign Architecture ────────────► Campaign Builder Sim
Module 6: Bidding Lab ──────────────────────► Bid Elevator Sim
Module 7: Search Term Triage ───────────────► STR Triage Arena Sim
```

---

## Immediate Action Items (Next 48 Hours)

| Priority | Task | Assignee | Deliverable |
|----------|------|----------|-------------|
| 🔴 P0 | Initialize repo + Prisma schema | Backend Eng | Working dev environment with DB |
| 🔴 P0 | Write Evaluation Engine types + interfaces | Architect | `src/engine/types.ts` approved |
| 🟡 P1 | Generate 3 synthetic STR datasets as JSON | Content Strategist | `fixtures/str-triage-pack-1.json` |
| 🟡 P1 | Draft Module 0 + 1.2 lessons in MDX | Content Strategist | 2 publishable lesson files |
| 🟢 P2 | Set up Vercel AI SDK + test streaming | Frontend Eng | Working chat prototype |
| 🟢 P2 | Legal review of TM disclaimer | Founder | Signed-off footer text |

---

*Document version: 1.0 — 2026-06-04 — Approved*
