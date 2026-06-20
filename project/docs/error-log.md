# AdCraft Error Log

> Comprehensive record of all errors, bugs, issues, and their resolutions encountered during development.

---

## Format

Each entry follows this structure:
```
### [ERR-XXX] — [SEVERITY] — [TIMESTAMP]
**Component**: Which part of the system
**Error Type**: Category (Build/Runtime/Type/Lint/Logic/Performance/Security)
**Error Message**: The actual error output
**Root Cause**: What caused it
**Resolution**: How it was fixed
**Time to Resolve**: How long the fix took
**Status**: Open / Resolved / Won't Fix / Deferred
```

### Severity Levels

| Level | Meaning |
|-------|---------|
| 🔴 Critical | Blocks development, app won't run |
| 🟠 High | Major feature broken, workaround exists |
| 🟡 Medium | Feature partially broken, non-blocking |
| 🟢 Low | Minor issue, cosmetic, edge case |
| 🔵 Info | Note or observation, not an error |

---

## Error Entries

### [ERR-001] — 🟢 Low — 2026-06-04

**Component**: fixtures/str-triage-pack-1.json
**Error Type**: Data
**Error Message**: JSON serialization error — `Infinity` is not a valid JSON literal
**Root Cause**: Search term str-017 had 0 sales, producing ACoS = spend / 0 = Infinity. The fixture was written with a raw `Infinity` JavaScript value, which cannot be serialized to JSON.
**Resolution**: Replaced `Infinity` with `999.0` in the fixture. The evaluation engine already handles infinite ACoS gracefully by clamping to a maximum display value.
**Time to Resolve**: ~2 minutes
**Status**: Resolved

---

### [ERR-002] — 🟡 Medium — 2026-06-04

**Component**: src/components/adcraft/stats-row.tsx
**Error Type**: Runtime (Hydration)
**Error Message**: `A tree hydrated but some attributes of the server rendered HTML didn't match the client properties` — decorative bar chart heights differed between server and client renders.
**Root Cause**: `Math.random()` was used to generate random bar heights in the placeholder sparkline (line 142). During SSR, the server generates one set of random values; then on the client, React hydrates and `Math.random()` produces different values, causing a hydration mismatch.
**Resolution**: Replaced `Math.random()` with a deterministic array of heights `[25, 40, 30, 45, 28, 35, 20]`. The visual appearance remains as a decorative placeholder bar chart, but the values are now consistent between server and client.
**Time to Resolve**: ~5 minutes
**Status**: Resolved

---

### [ERR-003] — 🟢 Low — 2026-06-04

**Component**: src/components/adcraft/str-triage-arena.tsx
**Error Type**: Lint/Build Warning
**Error Message**: React Compiler warning about `useReactTable()` memoization — expected behavior with TanStack Table.
**Root Cause**: TanStack Table's `useReactTable()` hook creates new object references on each render, triggering React Compiler's memoization heuristic.
**Resolution**: No fix needed. This is a known, harmless interaction between TanStack Table and React Compiler. The warning does not affect functionality or performance.
**Time to Resolve**: 0 minutes (accepted as-is)
**Status**: Won't Fix

---

### [ERR-004] — 🟢 Low — 2026-06-04

**Component**: Next.js dev server
**Error Type**: Runtime (Transient)
**Error Message**: HTTP 500 on first page load after initial compile, resolved on second request.
**Root Cause**: Hot module reload race condition — the dev server returns a 500 before the first compilation completes. Subsequent requests succeed.
**Resolution**: No fix needed. This is a known Next.js dev server behavior that only occurs on the very first request after a fresh compile. Does not occur in production builds.
**Time to Resolve**: 0 minutes (self-resolving)
**Status**: Won't Fix

---

### [ERR-005] — 🔴 Critical — 2026-06-04

**Component**: src/app/actions/lesson.ts, src/app/actions/simulation.ts
**Error Type**: Runtime (Server Actions)
**Error Message**: `Invalid Server Actions request. Next.js version: 16.1.3 (Turbopack)`
**Root Cause**: Both 'use server' files exported TypeScript types and interfaces (LessonMeta, LessonContent, ActionResult, GradeAttemptOutput, etc.) alongside async functions. Next.js 16 enforces that 'use server' files can ONLY export async functions — non-function exports corrupt the Server Actions binding at runtime, causing all server action calls from the client to fail with "Invalid Server Actions request".
**Resolution**: Created `/src/app/actions/types.ts` (no 'use server') for all shared type definitions. Refactored both action files to only export async functions. Updated all consumers (lesson-player.tsx, str-triage-store.ts) to import types from the shared types file instead.
**Time to Resolve**: ~20 minutes
**Status**: Resolved

---

### [ERR-006] — 🟠 High — 2026-06-04

**Component**: src/app/actions/lesson.ts — findLessonFile()
**Error Type**: Logic (File Lookup)
**Error Message**: Lesson content not found when clicking Module 0 (Onboarding) — `Lesson 1 not found in module 0`
**Root Cause**: `findLessonFile()` searched for files starting with `${lessonOrder}.` (e.g., "1."), which matched files like "1.1-what-is-ppc.mdx" for Module 1. But for Module 0, lesson 1, the file is "0.1-welcome.mdx" — searching for prefix "1." would NOT match "0.1-". The actual naming convention is `{moduleNumber}.{lessonOrder}-{title}.mdx`.
**Resolution**: Changed prefix from `${lessonOrder}.` to `${moduleNumber}.${lessonOrder}`, correctly matching the file naming convention for all module numbers (including Module 0).
**Time to Resolve**: ~5 minutes
**Status**: Resolved

---

### [TEMPLATE] — [SEVERITY] — [TIMESTAMP]

**Component**:
**Error Type**:
**Error Message**:
```
(paste error output here)
```
**Root Cause**:
**Resolution**:
**Time to Resolve**:
**Status**: Open / Resolved / Won't Fix / Deferred

---

## Error Statistics

| Metric | Count |
|--------|-------|
| Total Errors | 6 |
| Critical | 1 |
| High | 1 |
| Medium | 1 |
| Low | 3 |
| Resolved | 4 |
| Open | 0 |
| Won't Fix | 2 |
| Avg Time to Resolve | ~6 min |

---

## Recurring Issues Tracker

| Pattern | Occurrences | First Seen | Last Seen | Root Cause Category |
|---------|------------|-----------|-----------|-------------------|
| (none yet) | - | - | - | - |

---

*Last updated: 2026-06-04*
