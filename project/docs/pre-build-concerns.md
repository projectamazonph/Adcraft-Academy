# AdCraft Pre-Build Questions & Concerns

> Raised before writing any code. All critical and high concerns resolved on 2026-06-04. Code gate passed.

---

## 🔴 CRITICAL — ✅ ALL RESOLVED

### C-01: Dual-Stack Orchestration Complexity ✅ RESOLVED
**Concern**: We're running Next.js AND FastAPI as separate services. How do they communicate in development? In production?
- Does the Next.js BFF proxy all requests to FastAPI, or does the frontend call FastAPI directly?
- CORS configuration between the two?
- How do we run both simultaneously in dev? (concurrently? docker-compose? separate terminals?)
- **Risk**: If not decided upfront, we'll have conflicting API patterns and auth flows.

**Resolution**: Monolithic Next.js for MVP. No dual-stack until Phase 3. FastAPI extraction deferred.
**Date**: 2026-06-04 | **Owner**: Architect | **ADR**: ADR-001

---

### C-02: FastAPI + Next.js Auth Strategy ✅ RESOLVED
**Concern**: NextAuth.js runs on Next.js, but the FastAPI backend also needs to verify authentication.
- Do we use JWT tokens that FastAPI validates independently?
- Does Next.js BFF attach session cookies/headers when proxying to FastAPI?
- How does the AI Mentor streaming endpoint work? Does it go through BFF or direct to FastAPI?
- **Risk**: Auth is cross-cutting — getting it wrong means rewriting both stacks.

**Resolution**: Single NextAuth/Clerk instance. Server actions handle all auth. No JWT verification needed in separate backend.
**Date**: 2026-06-04 | **Owner**: Backend Eng

---

### C-03: Prisma vs SQLAlchemy — Which is the Source of Truth? ✅ RESOLVED
**Concern**: The spec mentions both Prisma (for Next.js/PostgreSQL) and SQLAlchemy (for FastAPI models).
- Do we maintain two separate schema definitions?
- Which one generates migrations?
- How do we keep them in sync?
- **Risk**: Schema drift between the two ORMs will cause runtime errors.

**Resolution**: Prisma only for MVP. Schema defined in `schema.prisma`. SQLAlchemy migration happens only when FastAPI is extracted.
**Date**: 2026-06-04 | **Owner**: Backend Eng

---

### C-04: Deterministic Engine — Where Does It Live? ✅ RESOLVED
**Concern**: The EvaluationEngine, SimulationStateManager, and STRGenerator are Python/FastAPI services, but the simulations are interactive UI components in Next.js.
- Does every user action in the Campaign Builder hit the FastAPI backend?
- Or does some simulation logic run client-side with periodic sync?
- What's the latency budget? If every click is a round-trip to FastAPI, the UX will feel sluggish.
- **Risk**: Wrong decision here means either a laggy UI or a non-deterministic client-side engine.

**Resolution**: Hybrid execution model. Pure TS engine shared between client (preview <100ms) and server (authoritative grading). Same pure function runs both sides; server wins on divergence. Engine at `/src/engine/` with zero framework deps.
**Date**: 2026-06-04 | **Owner**: Architect | **ADR**: ADR-001

---

### C-05: Redis — Local Development Without It ✅ RESOLVED
**Concern**: Redis is required for simulation state management.
- Do we require developers to install Redis locally?
- Do we provide a Docker Compose with Redis?
- Can we fall back to in-memory state for local dev?
- **Risk**: Redis dependency makes onboarding harder and local dev fragile.

**Resolution**: Not needed for MVP. Simulation state stored in Postgres JSONB + React state. Redis introduced only when extracting FastAPI or adding multiplayer.
**Date**: 2026-06-04 | **Owner**: DevOps

---

### C-06: Scope — What Is MVP vs. Post-MVP? ✅ RESOLVED
**Concern**: The PRD covers 13 modules, 3 simulation types, AI mentor, team dashboards, certifications, and more. The original "MVP Critical Path" was 10 weeks / 3 phases, but that assumed a team.
- What exactly are we building in THIS build?
- Is it a working prototype? A full MVP? A demo?
- Do we implement all 13 modules or just 2-3?
- Do we implement all 3 simulations or just the Campaign Builder?
- **Risk**: Without a clear scope boundary, we'll never ship.

**Resolution**: MVP (Phase 1 + Phase 2 Core). 5 modules (0,1,4,6,7) + 3 simulations (Campaign Builder, Bid Elevator, STR Triage). Explicit exclusion list documented in mvp-scope-definition.md.
**Date**: 2026-06-04 | **Owner**: Product | **Doc**: mvp-scope-definition.md

---

## 🟠 HIGH — ✅ ALL RESOLVED

### C-07: AI Mentor — Streaming Architecture ✅ RESOLVED
**Concern**: The spec mentions a 2-second timeout with fallback to cached templates.
- Do we use Server-Sent Events (SSE) or WebSockets?
- Where does the streaming endpoint live — FastAPI or Next.js API route?
- z-ai-web-dev-sdk runs in Node.js — does the AI call happen in Next.js BFF and get proxied to FastAPI? Or does FastAPI call its own LLM?
- **Risk**: Wrong streaming choice affects both frontend and backend architecture.

**Resolution**: Next.js Server Actions + Vercel AI SDK. SSE native support. No WebSocket needed for MVP.
**Date**: 2026-06-04 | **Timing**: MVP

---

### C-08: Synthetic Data — Where Does It Come From? ✅ RESOLVED
**Concern**: The STRGenerator creates statistically validated synthetic search term reports.
- Is this a build-time tool that generates JSON files? A runtime service? Both?
- Do we pre-generate scenario packs and ship them as static data?
- How do we validate statistical properties (KS-tests) — at generation time or at runtime?
- **Risk**: If runtime, we need Pandas/Numpy in production. If build-time, we need a generation pipeline.

**Resolution**: Build-time tool for MVP. Pre-generate datasets as JSON fixtures. Runtime generator deferred to Phase 3.
**Date**: 2026-06-04 | **Timing**: MVP

---

### C-09: Content Authoring Workflow ✅ RESOLVED
**Concern**: 13 modules of MDX content + simulation scenarios + AI prompts.
- Who writes the actual lesson content? AI-generated? Human-curated?
- Do we build a CMS-like admin interface or author content in markdown files?
- How do we preview MDX content with interactive widgets during development?
- **Risk**: Content is the product — without it, the app is an empty shell.

**Resolution**: Founders/SMEs write MVP content directly in MDX. Visual builder deferred to post-MVP.
**Date**: 2026-06-04 | **Timing**: MVP

---

### C-10: Database Schema — Multi-Tenancy from Day One? ✅ RESOLVED
**Concern**: The DevOps agent mentions Row-Level Security (RLS) for multi-tenancy.
- Are we building for single-tenant (one org) first and adding multi-tenancy later?
- Or do we bake multi-tenancy into the schema from the start?
- RLS policies add complexity to every query — is this necessary for MVP?
- **Risk**: Multi-tenancy too early = over-engineering. Too late = painful migration.

**Resolution**: Single-tenant for MVP. Add `org_id` column to all tables now (nullable/default), enforce later.
**Date**: 2026-06-04 | **Timing**: MVP Prep

---

### C-11: Amazon Brand Compliance ✅ RESOLVED
**Concern**: The spec emphasizes Amazon trademark compliance.
- What specific TM rules apply? (e.g., "Amazon" vs "amazon", Sponsored Brands vs Sponsored Brands™)
- Do we need legal review of all content before it goes live?
- How do we programmatically enforce TM compliance in AI-generated content?
- **Risk**: Non-compliance could mean legal trouble or Amazon API access revocation.

**Resolution**: Legal review completed. Safe harbor language drafted. Footer disclaimer mandatory.
**Date**: 2026-06-04 | **Timing**: Pre-Launch

---

### C-12: Real Amazon Data — Any API Integration? ✅ RESOLVED
**Concern**: The platform simulates Amazon PPC, but:
- Do we integrate with the Amazon Advertising API at all?
- Or is everything 100% synthetic/simulated?
- If we do integrate, what's the auth flow? (Amazon OAuth, MWS tokens?)
- **Risk**: API integration changes the entire backend architecture.

**Resolution**: 100% simulation for MVP. No Amazon Ads API calls. Deferred to Phase 4.
**Date**: 2026-06-04 | **Timing**: MVP

---

## 🟡 MEDIUM — Important but Can Be Deferred

### C-13: State Management — Zustand vs Server State
**Concern**: We list both Zustand and TanStack Query.
- What state lives client-side (Zustand) vs server-state (TanStack Query)?
- Simulation state in Redis means TanStack Query manages it, but interim interactions (drag-and-drop in Campaign Builder) need Zustand?
- What's the boundary?
- **Risk**: Inconsistent state patterns across the app.

### C-14: Testing Strategy
**Concern**: The Backend agent uses Pytest + Hypothesis. The Frontend uses... what?
- Vitest? Jest? Playwright E2E?
- Do we test the BFF layer separately from the FastAPI backend?
- What's the minimum test coverage for MVP?
- **Risk**: No testing strategy = no quality gate.

### C-15: Deployment Target
**Concern**: Vercel + ECS/Lambda is mentioned, but:
- Vercel hosts the Next.js frontend, but where does FastAPI run?
- AWS ECS? A separate VPS? Railway? Fly.io?
- Who manages the database? (Managed RDS? Supabase? Neon?)
- **Risk**: Deployment architecture affects how we build the app.

### C-16: Design System — Custom or Off-the-Shelf?
**Concern**: The UI/UX spec has a detailed color palette and typography system.
- Do we build a custom design system on top of shadcn/ui?
- Or use shadcn/ui defaults with brand color overrides?
- How many custom components do we need beyond shadcn's library?
- **Risk**: Over-investing in design system = slow feature delivery.

### C-17: Mobile Responsiveness Priority
**Concern**: PPC management is fundamentally a desktop/tablet activity.
- Do we build mobile-first, or desktop-first?
- Are the simulations (Campaign Builder, STR Grid) even usable on mobile?
- What's the minimum responsive breakpoint?
- **Risk**: Wasting time on mobile if the target users are on desktop.

### C-18: Internationalization (i18n)
**Concern**: Amazon sellers are global.
- Do we build with i18n from the start?
- Or English-only for MVP?
- Does the curriculum content need translation?
- **Risk**: i18n retrofitting is expensive if not planned early.

---

## 🟢 LOW — Nice to Clarify, Not Blocking

### C-19: Monorepo vs Separate Repos
**Concern**: Frontend and Backend in one repo or separate?
- Monorepo = easier coordinated deploys, shared types
- Separate repos = independent deployment cycles, clearer ownership
- What about the `content/` directory — which repo owns it?

### C-20: Package Manager
**Concern**: Frontend uses... npm? pnpm? bun?
- The fullstack-starter skill references pnpm
- cc-thingz references bun
- Need to pick one and stick with it

### C-21: API Versioning
**Concern**: FastAPI endpoints will evolve.
- Do we version the API from the start (/api/v1/)?
- Or YOLO it for MVP?

### C-22: Logging & Observability Stack
**Concern**: The DevOps agent mentions OpenTelemetry, Sentry, Datadog.
- Which ones for MVP? Just Sentry for errors?
- Do we need distributed tracing across Next.js → FastAPI?

### C-23: The "Content/agents" vs "Docs/agents-spec" Distinction
**Concern**: The spec says in-app AI agents are defined in `content/agents.md`, while dev agents are in `docs/agents-spec.md`.
- How many in-app AI agents are there? (Mentor, Coach, Client — any others?)
- Do we need to spec these before building the AI Orchestrator?

---

## ❓ OPEN QUESTIONS FOR THE PRODUCT OWNER

| # | Question | Impact If Unresolved |
|---|----------|---------------------|
| Q1 | What is the exact scope of THIS build? (Prototype? MVP? Demo?) | 🔴 We don't know when to stop |
| Q2 | Should FastAPI be the sole backend, or can we start with Next.js-only and add FastAPI later? | 🔴 Changes entire architecture |
| Q3 | Do we need real Amazon API integration or is 100% simulation acceptable? | 🟠 Affects backend complexity |
| Q4 | Who authors the curriculum content — AI-generated or human-written? | 🟠 Content is the product |
| Q5 | Do we need multi-tenancy (RLS) from day one? | 🟠 Schema complexity |
| Q6 | Is there a real Amazon seller we can interview for UX validation? | 🟡 Risk of building wrong thing |
| Q7 | What's the budget for external services (Redis hosting, DB hosting, AI tokens)? | 🟡 Affects deployment choices |
| Q8 | Desktop-only for MVP, or do we need mobile? | 🟡 Scope of responsive work |
| Q9 | English only, or multi-language from start? | 🟢 i18n architecture |
| Q10 | Any existing brand assets (logo, colors, fonts)? | 🟢 Design system starting point |

---

## 📊 RESOLUTION TRACKER

| Concern | Status | Resolution | Date |
|---------|--------|-----------|------|
| C-01 Dual-Stack Orchestration | ✅ Resolved | Monolithic Next.js for MVP | 2026-06-04 |
| C-02 Auth Strategy | ✅ Resolved | Single NextAuth/Clerk instance | 2026-06-04 |
| C-03 Prisma vs SQLAlchemy | ✅ Resolved | Prisma only for MVP | 2026-06-04 |
| C-04 Engine Location | ✅ Resolved | Hybrid client/server, pure TS engine | 2026-06-04 |
| C-05 Redis Local Dev | ✅ Resolved | Postgres JSONB + React state | 2026-06-04 |
| C-06 Scope Definition | ✅ Resolved | 5 modules + 3 sims | 2026-06-04 |
| C-07 AI Streaming | ✅ Resolved | Vercel AI SDK + Server Actions | 2026-06-04 |
| C-08 Synthetic Data Source | ✅ Resolved | Build-time JSON fixtures | 2026-06-04 |
| C-09 Content Authoring | ✅ Resolved | MDX by founders/SMEs | 2026-06-04 |
| C-10 Multi-Tenancy | ✅ Resolved | Single-tenant, org_id column prep | 2026-06-04 |
| C-11 Amazon TM Compliance | ✅ Resolved | Legal review + disclaimer | 2026-06-04 |
| C-12 Amazon API | ✅ Resolved | 100% simulation for MVP | 2026-06-04 |
| C-13 State Mgmt Boundary | ⏳ Deferred | Monolith simplifies this — Zustand for UI, TanStack for server state | - |
| C-14 Testing Strategy | ⏳ Deferred | Vitest + fast-check for TS engine; Playwright for E2E | - |
| C-15 Deployment Target | ⏳ Deferred | Vercel for MVP; DB: Neon/Supabase | - |
| C-16 Design System Depth | ⏳ Deferred | shadcn/ui + brand overrides; custom sim components | - |
| C-17 Mobile Priority | ⏳ Deferred | Desktop-primary; basic responsive only | - |
| C-18 i18n | ⏳ Deferred | English only for MVP | - |
| C-19 Monorepo vs Multi | ✅ Resolved | Monorepo (single Next.js app) | 2026-06-04 |
| C-20 Package Manager | ⏳ Deferred | pnpm (Turborepo standard) | - |
| C-21 API Versioning | ⏳ Deferred | /api/v1/ from start | - |
| C-22 Observability Stack | ⏳ Deferred | Sentry for errors; rest post-MVP | - |
| C-23 In-App Agent Specs | ⏳ Deferred | Spec before AI Orchestrator work | - |

---

*Document updated: 2026-06-04 — 12 of 23 concerns resolved. Code gate PASSED.*
