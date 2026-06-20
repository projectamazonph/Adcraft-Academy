# AdCraft Backend Technical Specification

> Backend reference translating the deterministic engine, simulation logic, and AI safety requirements into architecture. Originally designed for FastAPI + PostgreSQL + Redis; adapted for Monolith-First MVP (Next.js + Postgres JSONB). FastAPI extraction deferred to Phase 3.

> **Source**: Qwen chat — "AdCraft Product Development Gaps" (2026-06-03)
> **Architecture Context**: Monolith-First (ADR-001). MVP uses Next.js Server Actions + Postgres JSONB + Pure TypeScript engine. Python/FastAPI/Redis references are for Phase 3 extraction only.

---

## 1. Backend Architecture Overview

### MVP (Current: Next.js Monolith)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 16 (App Router + Server Actions) | Monolith; RSC + BFF; no separate backend needed |
| Language | TypeScript (Strict Mode) | Shared engine between client/server; type safety |
| Database | PostgreSQL 16 + Prisma | JSONB for simulation state; strong relational integrity |
| Engine | Pure TypeScript (`/src/engine/`) | Deterministic scoring; zero framework deps; extractable |
| AI | Vercel AI SDK + Server Actions | Streaming; rule-grounded feedback; safety guardrails |
| Auth | NextAuth.js | Single auth instance; JWT verification via middleware |
| State | Postgres JSONB + Zustand (client) | Simulation state; no Redis needed for single-user MVP |

### Phase 3 (FastAPI Extraction — Future)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | FastAPI (Python 3.12+) | Async-native; Pydantic V2; math-heavy PPC logic |
| ORM | SQLAlchemy 2.0 (Async) | Mature async support; Alembic migrations |
| Cache/State | Redis 7+ (Cluster) | Simulation state; session cache; rate limiting |
| Task Queue | Celery + Redis Broker | Async STR generation; file sanitization |
| AI Orchestration | LangChain / LlamaIndex | Structured output; citation-aware RAG |
| Validation | Pydantic V2 + Zod (shared) | Schema-driven; shared with frontend |

---

## 2. Core Service Specifications

### 2.1 Deterministic Evaluation Engine (`/src/engine/evaluation.ts`)

The most critical service. **ZERO LLM calls. Pure math + logic.**

```typescript
// src/engine/evaluation.ts (MVP — Pure TypeScript)
interface EvaluationEngine {
  evaluate(
    simulationState: SimulationState,
    userDecision: UserDecision,
    ruleVersion: string
  ): ScoreResult;
}

// Implementation Requirements:
// 1. Load active rules for version (from engine/types.ts or JSON fixture)
// 2. Evaluate ALL conditions deterministically (no randomness, no external calls)
// 3. Calculate score based on triggered rules + weights
// 4. Check data sufficiency FIRST (before scoring)
// 5. Return ScoreResult with triggered_rules, score, pass_fail, confidence

interface ScoreResult {
  score: number;
  pass_fail: boolean;
  triggered_rules: TriggeredRule[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  insufficiency_reason?: string;
  cannibalization_risk?: boolean;
  warnings: string[];
}
```

**API Contract (MVP — Server Action):**
```typescript
// src/app/actions/simulation.ts
async function evaluateDecision(request: {
  simulation_id: string;
  decision: UserDecision;
  rule_version: string;
}): Promise<ScoreResult>
```

**Latency SLA:** <50ms p99 (Pure TS, no I/O)

### Phase 3 FastAPI Contract:
```
POST /api/v1/evaluate
Request: { simulation_id, decision, rule_version }
Response: { score, pass_fail, triggered_rules[], confidence, warnings[] }
Latency SLA: <50ms p99
```

### 2.2 Simulation State Manager

Handles mutable game state with checkpointing and event sourcing.

```typescript
// MVP: Postgres JSONB via Prisma
interface SimulationStateManager {
  STATE_TTL: 86400; // 24h
  CHECKPOINT_INTERVAL: 5; // Every 5 decisions
  
  applyDecision(simId: string, decision: DecisionEvent): SimulationState;
  replayFrom(simId: string, checkpointId: string): SimulationState;
  createCheckpoint(simId: string, state: SimulationState): void;
}

// Prisma Model:
// model SimulationAttempt {
//   id          String   @id @default(cuid())
//   userId      String
//   type        SimulationType
//   state       Json     // Postgres JSONB — full SimulationState
//   events      Json     // DecisionEvent[] — event log for replay
//   checkpoints Json     // StateSnapshot[] — every 5 decisions
//   score       Float?
//   status      AttemptStatus
//   createdAt   DateTime @default(now())
//   updatedAt   DateTime @updatedAt
// }
```

**Phase 3 Redis Key Schema:**
```
sim:{id}:state → JSONB current state
sim:{id}:events → List of DecisionEvent JSON
sim:{id}:checkpoint:{n} → Frozen state snapshot
sim:{id}:lock → Distributed lock for concurrent access prevention
```

### 2.3 Synthetic Data Generation (Build-Time for MVP)

Produces realistic, statistically valid, PII-safe training data.

**MVP Approach: Pre-generated JSON fixtures**
- `fixtures/str-triage-pack-1.json` — 20 search term scenarios
- `fixtures/bid-elevator-pack-1.json` — 10 bidding scenarios
- `fixtures/campaign-builder-pack-1.json` — Campaign Builder data

**Phase 3 Approach: Runtime Python Service**
```python
# app/services/str_generator.py
class STRGenerator:
    async def generate(
        self,
        category_profile: CategoryProfile,
        num_rows: int,
        anomaly_config: AnomalyConfig
    ) -> pd.DataFrame:
        # 1. Sample from statistical distributions
        # 2. Inject anomalies (cannibalization, bot clicks, seasonal spikes)
        # 3. Validate statistical fidelity (KS-test, p > 0.05)
        # 4. Sanitize (defense in depth)
        ...
```

### 2.4 AI Feedback Orchestrator

Safe, latency-aware, citation-grounded explanations.

```typescript
// MVP: Server Action with Vercel AI SDK
async function streamFeedback(params: {
  scoreResult: ScoreResult;
  userInput: string;
  learnerProfile: LearnerProfile;
  agentType: AgentType;
}): Promise<ReadableStream>

// Key Requirements:
// 1. Build grounded prompt with ONLY triggered rules
// 2. Start generation + timeout race (2s)
// 3. Fallback to cached template if timeout
// 4. Continue streaming full response in background
// 5. Post-generation safety check (async, non-blocking)
```

**Latency Protocol:**
- If generation takes >2s: serve cached template → stream full response asynchronously
- Fallback templates keyed by triggered rule ID
- Safety audit runs post-generation and logs discrepancies

### 2.5 PII Sanitization Pipeline (Phase 3+)

Mandatory pre-processing for all user uploads and generated data.

```python
# app/services/sanitizer.py (Phase 3)
class PIISanitizer:
    async def sanitize_upload(self, file_bytes: bytes, user_id: str, org_id: str) -> SanitizedFile:
        # Pass 1: Regex patterns (ASIN, email, SKU, phone)
        # Pass 2: NER model for brand names, person names, addresses
        # Pass 3: Confidence threshold check
        # - Low confidence items → quarantine for manual review
        # Log immutably for compliance audit
        ...
```

---

## 3. Database Schema (Prisma — MVP)

```prisma
model PPCRule {
  id        String   @id @default(cuid())
  ruleId    String   // e.g., "STR_PROMOTE_STD"
  version   String   // Semantic version
  conditions Json   // {"clicks": {"min": 20}, ...}
  actions   Json    // {"promote_to": "exact"}
  confidenceWeight Float
  category  String? // null = universal, "electronics" = category-specific
  active    Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model SimulationAttempt {
  id          String   @id @default(cuid())
  userId      String
  type        SimulationType
  state       Json     // Full SimulationState (JSONB)
  events      Json     // DecisionEvent[] (event log)
  checkpoints Json     // StateSnapshot[] (every 5 decisions)
  score       Float?
  status      AttemptStatus
  scenarioId  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id])
}

model UserProgress {
  id              String   @id @default(cuid())
  userId          String   @unique
  xp              Int      @default(0)
  level           Int      @default(1)
  streak          Int      @default(0)
  lastActiveDate  DateTime?
  completedLessons Json   @default("[]") // LessonCompletion[]
  moduleProgress   Json   @default("{}") // { moduleId: { status, lessonsCompleted } }
  settings        Json     @default("{}") // User settings, difficulty, selected ASIN
  orgId           String?  // Future: multi-tenancy prep
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  user            User     @relation(fields: [userId], references: [id])
}
```

---

## 4. API Endpoints (Server Actions — MVP)

| Action | Input | Output | Latency Target |
|--------|-------|--------|---------------|
| `startSimulation` | type, scenarioId | SimulationState | <200ms |
| `submitDecision` | simId, decision | ScoreResult | <50ms |
| `getSimulationHistory` | userId | AttemptSummary[] | <100ms |
| `getLessonContent` | moduleId, lessonId | MDXContent | <500ms (cached) |
| `markLessonComplete` | userId, lessonId | XP update | <100ms |
| `streamAIMentor` | context, message | ReadableStream | <800ms (first token) |
| `getUserStats` | userId | StatsSummary | <100ms |

---

## 5. Critical Backend Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Eval engine drift from AI explanations | High (trust destruction) | AI receives ONLY triggered rules; post-hoc consistency checker flags mismatches |
| Simulation state corruption | High (progress loss) | Event sourcing enables rebuild; checksums on state writes; automated recovery |
| Synthetic data statistical drift | Medium (learning transfer fails) | KS-test validation in generator; nightly regression suite; human QA sampling |
| AI latency exceeds SLA | Medium (engagement drop) | Hard timeout + pre-cached templates; model routing (fast model for simple, slow for complex) |
| PII leak in uploads (Phase 3) | Critical (legal/compliance) | Multi-pass sanitizer; quarantine for low-confidence; immutable audit logs; regular pentests |
| Rule version mismatch | High (scoring errors) | Rules pinned per simulation attempt; migration scripts for legacy attempts; admin override |

---

*Source: Qwen chat "AdCraft Product Development Gaps" — 2026-06-03*
*Architecture adapted for Monolith-First MVP. FastAPI/Redis/Python specs preserved for Phase 3 extraction reference.*
*Last updated: 2026-06-04*
