# AdCraft Frontend Technical Specification

> Frontend engineering reference for Next.js + React + TypeScript stack. Translates the PRD and UI/UX designs into concrete component architectures, state management patterns, and performance budgets.

> **Source**: Qwen chat — "AdCraft Product Development Gaps" (2026-06-03)
> **Architecture Context**: Monolith-First (ADR-001). Some specs reference React Flow / Recharts which are deferred; MVP uses TanStack Table + shadcn/ui + Framer Motion.

---

## 1. Frontend Architecture Overview

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 16 (App Router) | RSC for content-heavy lessons; Server Actions for BFF pattern; Image optimization |
| Language | TypeScript (Strict Mode) | Non-negotiable for complex simulation state and PPC formula safety |
| Styling | Tailwind CSS + shadcn/ui | Utility-first for rapid iteration; design system consistency |
| State (Global) | Zustand | Lightweight, no boilerplate, supports persistence middleware for simulation state hydration |
| State (Server) | TanStack Query v5 | Caching, background refetching, optimistic updates for triage actions |
| Forms/Validation | React Hook Form + Zod | Schema-driven validation shared with backend; performance-critical for large STR tables |
| Data Grids | TanStack Table v8 | Virtualization for 1000+ row STRs; headless architecture allows custom Bloomberg-style styling |
| Diagrams/Builders | React Flow (Phase 3+) | Node-based campaign builder; customizable nodes/edges; built-in pan/zoom/minimap |
| Charts | Recharts (Phase 3+) | Composable, responsive, SSR-friendly; adequate for PPC dashboards without D3 complexity |
| Animations | Framer Motion | Layout animations for drag-drop; micro-interactions for feedback; performant GPU-accelerated transforms |
| Rich Text/Content | MDX | Type-safe markdown for lessons; embed React components directly in lesson content |
| AI (Client) | Puter.js (CDN) | Client-side AI via Puter; no API key needed; streaming via async iterables |
| Testing | Vitest + Playwright | Unit tests for formulas/logic; E2E for critical simulation flows |

---

## 2. Core Component Library Specs

### 2.1 Data-Dense Components (Bloomberg-Lite)

#### `<STRDataGrid />` — Search Term Report Triage Table

```typescript
interface STRRow {
  searchTerm: string;
  clicks: number;
  spend: number;
  sales: number;
  orders: number;
  ctr: number;
  cvr: number;
  acos: number | null;
  action?: TriageAction;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
}

// Key Requirements:
// - Virtualized rendering (only visible rows + buffer)
// - Sticky header + first column
// - Conditional cell formatting via style callbacks
// - Multi-select with Shift+Click range selection
// - Keyboard navigation: J/K (row), Space (select), Enter (action menu)
// - Action bar appears on selection with disabled states + tooltips
// - Sort/filter state persisted in URL params for shareability
// - Export to CSV client-side (no server roundtrip)
```

#### `<MetricCard />` — KPI Display Widget

```typescript
interface MetricCardProps {
  label: string;
  value: number;
  format: 'currency' | 'percentage' | 'number' | 'ratio';
  delta?: number;          // vs previous period
  deltaLabel?: string;
  status?: 'good' | 'warning' | 'critical' | 'neutral';
  benchmark?: number;      // category median line
  sparklineData?: number[]; // last 7 days trend
}
// Monospace font for values; color-coded delta arrows;
// optional mini-chart; responsive grid layout
```

### 2.2 Interactive Simulation Components

#### `<CampaignBuilderCanvas />` — Figma-like Drag-Drop Builder (Phase 3+)

```typescript
// React Flow Configuration:
// - Node Types: PortfolioNode, CampaignNode, AdGroupNode, KeywordNode
// - Edge Types: HierarchyEdge (solid), NegativeEdge (dashed red), CannibalizationEdge (pulsing amber)
// - Validation: Real-time on-connect callback checks naming rules + intent mixing
// - Auto-layout: dagre algorithm for initial arrangement
// - Minimap: Bottom-right corner, clickable navigation
// - Undo/Redo: Command pattern stack, Ctrl+Z / Ctrl+Shift+Z
// - Export: Generate bulk upload CSV from graph state
// - Persistence: Debounced save to Postgres JSONB every 5s or on node change
```

#### `<BidElevator />` — Interactive Bid Adjustment Slider

```typescript
interface BidElevatorProps {
  currentBid: number;
  cpcMax: number;
  minBid: number;
  maxBid: number;
  lifecycleStage: LifecycleStage;
  isRankPush: boolean;
  onChange: (newBid: number) => void;
  projectionFn: (bid: number) => BidProjection;
}
// Visual zones: Green (<cpcMax), Amber (=cpcMax), Red (>cpcMax)
// Rank push mode: Red zone becomes amber with timer badge
// Real-time projection chart updates on drag (throttled 60fps)
// Snap-to-grid at $0.05 increments
// Haptic feedback on mobile (navigator.vibrate)
```

#### `<TriageActionBar />` — Contextual Decision Panel

```typescript
interface TriageActionBarProps {
  selectedRows: STRRow[];
  onAction: (action: TriageAction) => void;
  accountMedianCVR: number;
  targetACoS: number;
}
// Sticky bottom panel, slides up on selection
// Buttons: Promote ✓ | Negate ✗ | Hold ⏸ | Reduce ↓ | Investigate 🔍
// Each button disabled independently based on data sufficiency
// Disabled tooltip explains WHY (e.g., "Need 20+ clicks for promotion decision")
// Confidence meter (circular gauge) aggregates selected rows
// Keyboard shortcuts displayed as badges
```

### 2.3 Learning & Content Components

#### `<LessonPlayer />` — Two-Column Learning Layout

```typescript
// Left Column (60%): MDX-rendered content blocks
// Right Column (40%): Sticky interactive widget slot
// Mobile: Tabbed view (Content | Practice)
// Progress indicator per section
// "Trap" callout component with amber warning styling
// Inline quiz component with immediate feedback expansion
// Download unlock animation on completion
```

#### `<MetricMixerGame />` — Drag-Drop Formula Builder

```typescript
// Draggable chips: Spend, Sales, Clicks, Impressions, Orders, Price, TargetACoS, CVR
// Drop zones: Numerator, Denominator, Multiplier slots
// Real-time validation on drop
// Wrong combo: Shake animation + consequence toast
// Correct combo: Green glow + confetti micro-interaction
// Reset button; Hint button (costs streak point)
```

#### `<AIMentorChat />` — Latency-Aware Chat Panel

```typescript
// Floating pill → expandable side panel
// Message types: User, AI, System, FallbackTemplate, ToolCall
// Streaming: Token-by-token render with typing cursor
// Fallback: If >2s, show cached template with "Refining..." badge
// Rule citations: Clickable [RULE_ID] badges → side panel definition
// Low confidence badge: ⚠️ amber warning on uncertain responses
// Input: Text + quick-reply chips + file upload (sanitized)
// Memory indicator: Shows context window usage bar
```

---

## 3. State Management Architecture

### 3.1 Zustand Store Slices

```typescript
// store/useSimulationStore.ts
interface SimulationState {
  // Metadata
  simulationId: string;
  type: SimulationType;
  marketplace: MarketplaceCode;
  
  // Mutable State
  currentDay: number;
  budgetRemaining: number;
  campaigns: Campaign[];
  searchTerms: STRRow[];
  decisions: DecisionEvent[];
  
  // Derived (memoized selectors)
  totalSpend: () => number;
  blendedACoS: () => number;
  inventoryDaysCover: () => number;
  
  // Actions
  makeDecision: (decision: DecisionEvent) => void;
  advanceDay: () => void;
  resetToCheckpoint: (checkpointId: string) => void;
  replayFromStart: () => void;
}

// Persistence Middleware:
// - Hydrate from Postgres JSONB on mount
// - Debounced persist to Postgres on state change
// - Version migration handler for schema changes
// - Checkpoint creation every 5 decisions
```

### 3.2 Server State (TanStack Query)

| Query Key | Endpoint | Stale Time | Refetch | Notes |
|-----------|----------|-----------|---------|-------|
| `['lesson', moduleId]` | `/api/lessons/:id` | 1h | Never | Immutable content; cache aggressively |
| `['simulation', simId, 'state']` | `/api/simulations/:id/state` | 0 | On focus | Always fresh; hydrates Zustand |
| `['str', simId, 'page', filters]` | `/api/simulations/:id/str` | 30s | Manual | Paginated; invalidate on decision |
| `['ai', 'feedback', attemptId]` | `/api/ai/feedback` | ∞ | Never | Immutable once generated |
| `['user', 'progress']` | `/api/users/me/progress` | 5min | On mutation | Optimistic update on lesson complete |

### 3.3 URL State for Shareability

- Simulation filters/sorts: `?sort=acos-desc&filter=cvr>0.05`
- Lesson progress: `/learn/module-3/lesson-2#trap-section`
- Campaign builder view: `/simulations/builder?zoom=1.2&selected=camp_007`
- Enables bookmarking, sharing, and back-button correctness.

---

## 4. Page Route Structure (Next.js App Router)

```
app/
├── (auth)/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── legal-acceptance/page.tsx      # Mandatory ToS + AI disclaimer
├── (dashboard)/
│   ├── learn/
│   │   ├── page.tsx                   # Learning path overview
│   │   └── [moduleId]/
│   │       ├── page.tsx               # Module overview
│   │       └── [lessonId]/page.tsx    # Lesson player + interactive widget
│   ├── simulations/
│   │   ├── page.tsx                   # Simulation hub
│   │   ├── triage/[scenarioId]/page.tsx
│   │   ├── builder/[scenarioId]/page.tsx
│   │   ├── bid-lab/[scenarioId]/page.tsx
│   │   └── capstone/page.tsx
│   ├── tools/
│   │   ├── cpc-calculator/page.tsx
│   │   ├── naming-generator/page.tsx
│   │   └── keyword-classifier/page.tsx
│   ├── templates/page.tsx             # Download center
│   ├── ai-mentor/page.tsx             # Full chat interface
│   ├── team/                          # Manager-only routes (Phase 3+)
│   │   ├── dashboard/page.tsx
│   │   ├── members/page.tsx
│   │   └── certs/page.tsx
│   └── profile/page.tsx
├── api/                               # Server Actions (BFF)
│   ├── lessons/[id]/route.ts
│   ├── simulations/[id]/
│   │   ├── state/route.ts
│   │   ├── str/route.ts
│   │   └── evaluate/route.ts          # Deterministic scoring
│   ├── ai/
│   │   ├── chat/route.ts              # Streaming endpoint
│   │   └── feedback/route.ts
│   └── uploads/sanitize/route.ts
└── admin/                             # Content authoring (Phase 3+)
    ├── scenarios/builder/page.tsx
    ├── rules/page.tsx
    └── analytics/page.tsx
```

---

## 5. Performance Budgets & SLAs

| Metric | Target | Enforcement |
|--------|--------|-------------|
| LCP (Lesson Page) | <1.5s | Next.js Image optimization; MDX pre-rendering; font preload |
| LCP (Simulation Init) | <2.5s | Postgres state hydration; skeleton loaders; lazy-load charts |
| INP (Triage Action) | <100ms | Optimistic UI; web worker for scoring preview |
| STR Grid Render (1000 rows) | <200ms | TanStack virtualizer; fixed row height; no layout thrash |
| Campaign Builder FPS | ≥55fps | requestAnimationFrame throttling; offscreen canvas for edges |
| AI First Token | <800ms | Edge runtime; prompt caching; streaming |
| Bundle Size (Initial) | <150KB gzip | Code splitting; dynamic imports for simulations/charts |
| Memory (Simulation) | <100MB | Object pooling for STR rows; cleanup on unmount |

---

## 6. Accessibility Requirements (WCAG 2.1 AA)

| Requirement | Implementation |
|------------|----------------|
| Keyboard Navigation | Full tab order; skip links; shortcut cheatsheet (? key); focus-visible rings |
| Screen Readers | ARIA labels on all interactive elements; live regions for scores/feedback; alt text for charts |
| Color Independence | Icons + labels accompany ALL status colors; high contrast toggle; never color-only encoding |
| Motion Sensitivity | prefers-reduced-motion respected; disable confetti/particles; instant transitions |
| Touch Targets | Minimum 44×44px on mobile; adequate spacing between interactive elements |
| Cognitive Load | Progressive disclosure; consistent primary action placement; clear error recovery paths |
| Focus Management | Trap focus in modals/chat panels; restore focus on close; announce route changes |

---

## 7. Error Handling & Resilience Patterns

| Scenario | Pattern | User Experience |
|----------|---------|----------------|
| API Timeout | Retry 3x exponential backoff → fallback cache → error boundary | Skeleton → stale data banner → graceful error message |
| AI Latency >2s | Serve cached template → stream full response async | Instant feedback badge → refined response replaces seamlessly |
| Simulation State Corrupt | Version check on hydrate → auto-migrate → fail-safe reset | Silent recovery or "Session restored" toast |
| Network Offline | Service Worker caches lessons/tools; queue decisions for sync | Offline banner; queued actions indicator; auto-sync on reconnect |
| Validation Failure | Inline field errors + summary toast; preserve user input | Never lose work; clear fix instructions; link to relevant rule |
| Rate Limit | Queue requests; show progress indicator | Transparent throttling; no silent failures |

---

## 8. Testing Strategy

| Type | Tool | Scope | CI Gate |
|------|------|-------|---------|
| Unit | Vitest | PPC formulas, validators, state reducers, utility functions | 100% coverage on core logic |
| Component | Vitest + RTL | Interaction behavior, accessibility, conditional rendering | Critical path components |
| Visual | Chromatic | Regression detection for UI changes | Storybook snapshots |
| E2E | Playwright | Full simulation flows, auth, team dashboard, AI chat | Smoke suite on every PR; full suite nightly |
| Performance | Lighthouse CI | LCP, CLS, INP, bundle size budgets | Fail if regression >10% |
| Accessibility | axe-core | Automated WCAG checks integrated in E2E | Zero critical violations |

---

## 9. Frontend Build Sequence (Aligned with MVP Plan)

| Week | Deliverables | Key Dependencies |
|------|-------------|-----------------|
| 1 | Design system tokens; base components (Button, Card, Badge, Input); layout shells; auth pages; legal acceptance flow | Tailwind config; shadcn/ui setup |
| 2 | Lesson player; MDX pipeline; MetricMixerGame; progress tracking UI | MDX compiler; Framer Motion |
| 3 | STRDataGrid (virtualized); TriageActionBar; TanStack Query setup; simulation state hydration | TanStack Table; Zustand |
| 4 | CampaignBuilder (form-based for MVP); naming validator UI; portfolio grouping visualization | Zustand |
| 5 | BidElevator; CPC calculator; projection charts; scenario card carousel | Framer Motion; touch gesture handling |
| 6 | AIMentorChat (streaming + fallback); rule citation panel; latency monitoring UI | Puter.js (CDN); Server API fallback |
| 7 | Polish pass: animations, micro-interactions, accessibility audit, performance optimization, E2E test suite | Framer Motion; Playwright; Lighthouse |
| 8 | Dashboard → real data, module progress tracking, MVP release candidate | All above |

---

*Source: Qwen chat "AdCraft Product Development Gaps" — 2026-06-03*
*Architecture adapted for Monolith-First (ADR-001). React Flow campaign builder deferred to Phase 3+; MVP uses form-based builder.*
*Last updated: 2026-06-23*
