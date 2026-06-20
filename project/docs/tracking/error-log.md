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

### [ERR-007] — 🟠 High — 2026-06-04

**Component**: Mobile rendering (dark mode, sidebar, dashboard)
**Error Type**: Runtime (CSS / Data / UX)
**Error Message**: App not rendering correctly on mobile — white background instead of dark, sidebar visible when it should be hidden, dashboard stuck on "Loading..."
**Root Cause**: Three compounding issues: (1) `getUserStats()` returned `{ success: false, error: 'User not found' }` for new users, causing dashboard to hang indefinitely; (2) Sidebar's `cn()` call had `flex flex-col` conflicting with `hidden lg:flex` in Tailwind v4 class merging; (3) Missing `html.dark` CSS fallback rule meant dark mode relied solely on component-level `bg-background` classes which could have specificity issues or load timing problems.
**Resolution**: (1) Made `getUserStats()` auto-create user records (same pattern as `getProgressOverview()`), added `.catch()` handlers to all mount-time Server Action calls; (2) Restructured sidebar to use `hidden lg:flex` as base with `!flex` for mobile-open override, moved `flex-direction: column` to inline style; (3) Added `html.dark { background-color: var(--background); color: var(--foreground); }` to `@layer base` block. Also fixed operator precedence bug in dashboard (`overview?.modulesCompleted ?? 0 > 0` → `(overview?.modulesCompleted ?? 0) > 0`).
**Time to Resolve**: ~30 minutes
**Status**: Resolved

---

### [ERR-008] — 🟠 High — 2026-06-04

**Component**: src/app/auth/signin/page.tsx, src/app/auth/signup/page.tsx
**Error Type**: Runtime (Authentication)
**Error Message**: "Created an account but can't sign in" — Users could create accounts via the sign-up page, but subsequent sign-in attempts failed. The sign-in appeared to succeed on the server (302 redirect), but the session cookie was not properly established on the client, causing a redirect loop back to the sign-in page.
**Root Cause**: Both sign-in and sign-up pages used `signIn('credentials', { redirect: false })` from NextAuth v4. This uses a fetch-based approach that doesn't reliably persist session cookies in certain browser/proxy configurations (especially behind reverse proxies like preview deployments). The fetch response includes `Set-Cookie` headers, but the browser may not apply them correctly when the request doesn't cause a full page navigation. The session cookie was set on the server side, but the client-side navigation via `router.push('/')` triggered the middleware, which couldn't find the JWT token (because the cookie wasn't persisted), resulting in a redirect back to `/auth/signin`.
**Resolution**: (1) Switched both pages from `redirect: false` to the default redirect behavior (full page navigation via form submission), which reliably sets session cookies; (2) Added `callbackUrl` parameter to redirect users to the correct page after sign-in; (3) Added `useSearchParams()` Suspense boundary (required by Next.js 16 for static generation); (4) Mapped NextAuth error codes (e.g., "CredentialsSignin") to user-friendly messages; (5) Also removed all `mvp-user-001` hardcoded fallbacks from server actions (14 instances) — now properly returns `UNAUTHENTICATED` error instead of silently attributing data to a ghost user.
**Time to Resolve**: ~45 minutes
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
| Total Errors | 8 |
| Critical | 1 |
| High | 3 |
| Medium | 1 |
| Low | 3 |
| Resolved | 6 |
| Open | 0 |
| Won't Fix | 2 |
| Avg Time to Resolve | ~12 min |

---

## Recurring Issues Tracker

| Pattern | Occurrences | First Seen | Last Seen | Root Cause Category |
|---------|------------|-----------|-----------|-------------------|
| (none yet) | - | - | - | - |

---

*Last updated: 2026-06-07*
