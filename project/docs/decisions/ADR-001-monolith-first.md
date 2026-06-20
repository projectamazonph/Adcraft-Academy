# ADR-001: Monolith-First with Extractable Engine

**Status:** Accepted
**Date:** 2026-06-04
**Decision Maker:** Product Owner
**Impact:** All agents, all components

---

## Context

The AdCraft agents specification defined a dual-stack architecture: Next.js frontend + FastAPI backend, connected via API contracts, with Redis for simulation state. Pre-build analysis identified 6 critical concerns with this approach (C-01 through C-06), including dual-stack orchestration complexity, cross-stack authentication, dual ORM maintenance, engine runtime latency trade-offs, Redis local dev dependency, and undefined MVP scope.

These concerns are interconnected: C-01 (orchestration), C-02 (auth), and C-05 (Redis) all stem from the dual-stack decision. C-03 (dual ORM) stems from using both Prisma and SQLAlchemy. C-04 (engine runtime) is architectural but solvable independently.

## Decision

**Start monolithic Next.js for MVP, architect for FastAPI extraction later.**

### Core Architecture
- **Single Next.js application** serves frontend, API routes, and server-side logic
- **Pure TypeScript deterministic engine** at `/src/engine/` with zero framework dependencies
- **Prisma only** as ORM — no SQLAlchemy until FastAPI extraction
- **Postgres JSONB + React state** for simulation state — no Redis until extraction or multiplayer
- **Single auth instance** (NextAuth/Clerk) — no cross-stack JWT verification

### The Extractable Engine Pattern
The deterministic engine is written as a **pure TypeScript module** with these constraints:
- No database calls inside evaluation logic
- No framework-specific imports (no Next.js, no React)
- Pure functions only: input → output, no side effects
- All types defined in `/src/engine/types.ts`

When FastAPI is needed (for pandas/numpy synthetic data generation or performance scaling), the engine is extracted into a Python service behind an OpenAPI contract. Frontend code doesn't change — only the import path.

### Hybrid Execution Model
Simulations use a hybrid client/server execution model:
- **Client-Side (<100ms):** Validation, UI state, drag-drop, formula preview, naming checks. Pure TS functions running in the browser.
- **Server-Side (Authoritative):** Final scoring, state persistence, AI feedback, anti-cheat validation. Client shows "Preview Score" instantly; server confirms "Official Score" asynchronously.
- **Deterministic Integrity:** The *same* pure TS function runs on both client (preview) and server (grading). If they diverge, server wins and the discrepancy is logged.

## Consequences

### Positive
- Eliminates C-01, C-02, C-03, C-05 immediately (4 of 6 critical concerns)
- Single deployment target (Vercel) for MVP
- Single codebase, single ORM, single auth flow
- Faster development velocity — no context-switching between stacks
- Deterministic engine is testable in isolation (pure functions)
- Extraction path is clean when the time comes

### Negative
- No access to Python ecosystem (pandas, numpy, Hypothesis) for MVP
- Synthetic data generation must be build-time (pre-generated JSON fixtures) not runtime
- Property-based testing uses fast-check (TypeScript) instead of Hypothesis (Python)
- Large simulations may hit serverless function timeout limits on Vercel
- Multiplayer features deferred (require Redis/WebSockets)

### Migration Triggers (When to Extract FastAPI)
1. Need for runtime synthetic data generation with statistical validation (pandas/numpy)
2. Simulation calculations exceeding Vercel serverless function time limits
3. Requirement for WebSocket-based multiplayer simulations
4. Need for long-running background jobs (batch scoring, report generation)

## Related Decisions

| ADR | Title | Status |
|-----|-------|--------|
| ADR-002 | MVP Scope Definition | Accepted |
| ADR-003 | Hybrid Execution Model | Accepted |
| ADR-004 | Prisma-Only ORM Strategy | Accepted |

---

## Resolution Mapping

| Concern | Before | After |
|---------|--------|-------|
| C-01 Dual-Stack Orchestration | 🔴 Critical | ✅ Resolved — No dual-stack in MVP |
| C-02 Auth Across Stacks | 🔴 Critical | ✅ Resolved — Single auth instance |
| C-03 Prisma vs SQLAlchemy | 🔴 Critical | ✅ Resolved — Prisma only for MVP |
| C-04 Engine Runtime | 🔴 Critical | ✅ Resolved — Hybrid client/server model |
| C-05 Redis Local Dev | 🔴 Critical | ✅ Resolved — Postgres JSONB + React state |
| C-06 MVP Scope | 🔴 Critical | ✅ Resolved — 5 modules + 3 sims |
| C-07 AI Streaming | 🟠 High | ✅ Resolved — Vercel AI SDK + Server Actions |
| C-08 Synthetic Data | 🟠 High | ✅ Resolved — Build-time JSON fixtures |
| C-09 Content Authoring | 🟠 High | ✅ Resolved — MDX by founders/SMEs |
| C-10 Multi-tenancy | 🟠 High | ✅ Resolved — Single-tenant, org_id column prep |
| C-11 Amazon TM Compliance | 🟠 High | ✅ Resolved — Legal review + disclaimer |
| C-12 Amazon API | 🟠 High | ✅ Resolved — 100% simulation for MVP |
