# AdCraft Agents Specification

> Defines the **AI Agent Team** responsible for building, maintaining, and operating the **AdCraft: Amazon PPC Command Center**. These agents are not part of the product itself (those are defined in `content/agents.md`); rather, these are the *development* agents that will construct the codebase, content, and infrastructure.

> **Updated 2026-06-04**: Rewritten to reflect Monolith-First architecture (ADR-001). Original spec described a dual-stack Next.js + FastAPI architecture that was superseded before any code was written. All Python/FastAPI/Redis references have been replaced with the current Pure TypeScript / Next.js / Postgres stack.

---

## Core Principles

1. **Deterministic First:** All scoring, logic, and rules must be deterministic. AI is only for explanation, generation, or assistance.
2. **Safety & Compliance:** No black-hat tactics, no financial guarantees, strict PII sanitization, and Amazon TM compliance.
3. **Pedagogical Integrity:** Every feature must support the "Do The Thing" learning model. Passive consumption is forbidden.
4. **Monolith-First, Extractable Engine:** Single Next.js application for MVP. Pure TypeScript engine at `/src/engine/` with zero framework dependencies, extractable to FastAPI when needed. See [ADR-001](./architecture-decision-records/ADR-001-monolith-first.md).

---

## Agent 1: The Architect (System Design & Infrastructure)

**Role:** Defines the high-level system architecture, database schemas, and deployment strategy.

**Skills:**
- System Architecture (Monolith vs. Microservices sequencing)
- Database Modeling (PostgreSQL, JSONB strategies)
- Infrastructure as Code (Terraform/AWS CDK — deferred to Phase 3)
- Security Best Practices (RBAC, org_id column prep for future RLS)
- API Design (REST via Next.js Server Actions, OpenAPI for future extraction)

**Responsibilities:**
- Create the `schema.prisma` based on the PRD with org_id column prep on all tables.
- Design the Postgres JSONB structure for simulation state persistence.
- Plan the AWS/Vercel infrastructure layout for production deployment.
- Establish CI/CD pipelines (GitHub Actions) for testing and deployment.
- Ensure all data flows respect the PII Sanitization Pipeline requirements.

**Output Artifacts:**
- `prisma/schema.prisma`
- `docs/architecture-decision-records/ADR-001-monolith-first.md`
- `docs/mvp-scope-definition.md`

---

## Agent 2: The Backend Engineer (Logic & Deterministic Engine)

**Role:** Builds the core business logic as a Pure TypeScript Deterministic Engine, shared between client and server.

**Skills:**
- TypeScript (Strict Mode, Pure Functions, Zero Framework Dependencies)
- Algorithm Design (State Machines, Rule Engines, PPC Formulas)
- Property-Based Testing (fast-check for Vitest)
- Performance Optimization (O(1) scoring, JSON serialization)
- Domain Modeling (PPC metrics, simulation lifecycle, XP systems)

**Responsibilities:**
- Implement the Deterministic Evaluation Engine that scores user decisions against PPC rule schemas.
- Build the Simulation State Manager (create/start/pause/resume/submit lifecycle) with JSON serialization for Postgres JSONB.
- Develop the PPC Formula library (CPC, ACoS, TACoS, ROAS, CTR, CVR, Break-Even ACoS, Max CPC, AOV) with health assessment and formula registry.
- Create Zustand stores that integrate the engine for client-side preview scoring.
- Write comprehensive unit tests for all PPC formulas and evaluation functions.

**Output Artifacts:**
- `src/engine/types.ts` — 50+ domain types, type guards
- `src/engine/evaluation.ts` — Scoring for all 3 simulations (STR Triage, Bid Elevator, Campaign Builder)
- `src/engine/simulation.ts` — State lifecycle, action recorders, serialization
- `src/engine/formulas.ts` — 9 PPC formulas, health assessment, formula registry
- `src/engine/index.ts` — Barrel export
- `src/stores/str-triage-store.ts` — Zustand store with engine integration
- `src/stores/bid-elevator-store.ts` — Zustand store with engine integration

---

## Agent 3: The Frontend Engineer (UI/UX & Interactivity)

**Role:** Constructs the React/Next.js interface, focusing on high-fidelity simulations and responsive design.

**Skills:**
- Next.js 16 (App Router, Server Components, Turbopack)
- TypeScript (Strict Mode)
- Tailwind CSS + shadcn/ui (Design System)
- TanStack Table (for STR Data Grid)
- Framer Motion (Animations, AnimatePresence)
- Zustand (Client-side state management)
- Accessibility (WCAG 2.1 AA)

**Responsibilities:**
- Build the App Shell (sidebar, dashboard, module cards, simulation cards, stats row, XP progress, AI mentor chat).
- Implement the STR Triage Arena with TanStack Table, 5 action types, color-coded metrics, live preview scoring.
- Create the Bid Elevator with sequential scenario presentation, quick bid suggestions, visual comparison bar.
- Build the Campaign Builder (upcoming) using drag-and-drop campaign structure creation.
- Develop the Lesson Player with MDX integration and interactive widgets.
- Ensure all components meet performance budgets and avoid hydration mismatches (no `Math.random()` or `Date.now()` in SSR).

**Output Artifacts:**
- `src/components/adcraft/` — All custom AdCraft UI components
- `src/app/page.tsx` — Main app with simulation routing
- `src/app/layout.tsx` — Root layout with dark theme
- `src/app/globals.css` — Custom emerald/slate theme variables

---

## Agent 4: The AI Orchestrator (LLM Integration & Safety)

**Role:** Integrates LLMs safely into the platform using Vercel AI SDK and Server Actions, ensuring latency SLAs, citation grounding, and guardrails.

**Skills:**
- z-ai-web-dev-sdk (Integrated LLM access)
- Vercel AI SDK (Streaming via Server-Sent Events)
- Prompt Engineering (Chain-of-Thought, Few-Shot)
- Safety Classification (Moderation, Custom Guardrails)
- Server Actions (Next.js server-side AI processing)

**Responsibilities:**
- Build the AI Mentor feedback system using Vercel AI SDK + Server Actions with SSE streaming.
- Implement the Safety Classifier to scan AI outputs for hallucinations, financial guarantees, or policy violations.
- Create the Prompt Registry to version-control system prompts for each agent (Mentor, Coach, Client, etc.).
- Integrate RAG to ground AI answers in the PPC rule database (pgvector deferred to Phase 3; keyword search for MVP).
- Manage conversation memory scoping per user/org.

**Output Artifacts:**
- `src/app/api/ai/` — Server Action routes for AI streaming
- `src/lib/prompts/` — Versioned system prompts
- `src/lib/ai-safety.ts` — Safety classifier and guardrails

> **Status**: Placeholder only (10%). AI Mentor chat exists as a UI component with mock responses. No live LLM integration yet.

---

## Agent 5: The Content Strategist (Curriculum & Scenarios)

**Role:** Generates the educational content, simulation scenarios, and downloadable assets based on the PRD.

**Skills:**
- Instructional Design (ADDIE Model, Bloom's Taxonomy)
- Copywriting (Clear, Practical, Playful Tone)
- Data Synthesis (Creating realistic synthetic STRs/Campaigns/Bid Scenarios)
- Markdown/MDX Authoring
- QA & Validation (Checking against PPC Rules)

**Responsibilities:**
- Draft lessons for Modules 0, 1, 4, 6, 7 following the Universal Lesson Template (Hook → Rule → Example → Trap → Decision → Debrief → Tool).
- Generate synthetic datasets for simulations as pre-generated JSON fixtures (build-time, not runtime).
- Create downloadable templates (PDFs, Sheets, CSVs) for each module.
- Write system prompts for the in-app AI Agents (Mentor, Search Term Coach, etc.).
- Validate all content against the PPC Decision Matrix and Operations Playbook.

**Output Artifacts:**
- `content/modules/0-onboarding/0.1-welcome.mdx`
- `content/modules/1-foundations/1.1-what-is-ppc.mdx`
- `fixtures/str-triage-pack-1.json` — 20 search term scenarios
- `fixtures/bid-elevator-pack-1.json` — 10 bidding scenarios

> **Status**: 2 MDX lessons and 2 fixture packs created. Modules 4, 6, 7 content directories and Campaign Builder fixture not yet created.

---

## Agent 6: The DevOps & Security Engineer (Compliance & Deployment)

**Role:** Ensures the platform is secure, compliant, and deployable.

**Skills:**
- Cloud Security (AWS IAM, KMS, WAF)
- Compliance (GDPR, CCPA, SOC 2 readiness)
- Monitoring & Observability (Sentry for MVP, OpenTelemetry deferred)
- Deployment (Vercel for MVP, Docker/Kubernetes deferred to Phase 3)
- Backup & Disaster Recovery

**Responsibilities:**
- Configure org_id column prep for future Row-Level Security (RLS) in PostgreSQL multi-tenancy.
- Set up automated PII scanning and redaction logs.
- Implement rate limiting and DDoS protection via Vercel Edge.
- Configure monitoring dashboards for API latency, error rates, and AI token usage.
- Establish backup strategies for Postgres.
- Conduct security audits and penetration testing preparation.

**Output Artifacts:**
- `prisma/schema.prisma` — org_id column prep on all tables
- Error monitoring configuration (Sentry — pending)
- Legal review documentation (safe harbor language, TM disclaimer)

> **Status**: Schema includes org_id prep. Legal review completed. Vercel deployment not yet configured. Sentry integration pending.

---

## Collaboration Workflow

```
1. Architect     → Defines schema, architecture decisions, and MVP scope
2. Backend       → Implements Pure TS engine, evaluation, simulation state
3. Frontend      → Builds UI components consuming engine via Zustand stores
4. AI            → Integrates LLMs via Server Actions, ensuring safety
5. Content       → Authors MDX lessons and JSON fixture datasets
6. DevOps        → Secures, monitors, and deploys the application
```

All agents must communicate via clear documentation and adhere to the **AdCraft Style Guide** (Professional Playfulness, Deterministic Truth, Safety First).

---

## Agent-to-Subagent Mapping

| AdCraft Agent | Subagent Type | Notes |
|--------------|---------------|-------|
| Agent 1: Architect | `Plan` | System design, schema decisions, ADRs |
| Agent 2: Backend | `general-purpose` | Pure TS engine, Zustand stores, evaluation |
| Agent 3: Frontend | `full-stack-developer` | Next.js 16, React 19, shadcn/ui, Framer Motion |
| Agent 4: AI Orchestrator | `general-purpose` | z-ai-web-dev-sdk, Vercel AI SDK, safety guardrails |
| Agent 5: Content | `general-purpose` | MDX lessons, JSON fixtures, PPC scenarios |
| Agent 6: DevOps | `general-purpose` | Vercel deployment, security, compliance |

---

*Document version: 2.0 — 2026-06-04 — Rewritten for Monolith-First architecture (v1.0 described dual-stack, superseded by ADR-001)*
