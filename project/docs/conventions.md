# AdCraft Documentation Conventions & Anti-Bloat Charter

> Rules that keep our documentation healthy, navigable, and bloat-free. Every contributor MUST follow these.

---

## Directory Structure

```
docs/
├── README.md                  # Navigation hub (THIS is the starting point)
├── conventions.md             # This file — rules & anti-bloat charter
│
├── reference/                 # Stable docs (change rarely, < 200 lines each)
│   ├── architecture.md        # System architecture & design patterns
│   ├── api-reference.md       # Server Actions & types API docs
│   ├── karpathy-guidelines.md # Coding principles
│   ├── mvp-scope-definition.md# Locked MVP scope & exclusion list
│   └── agents-spec.md         # Development agent team spec
│
├── decisions/                 # Architecture Decision Records
│   └── ADR-001-monolith-first.md
│
├── tracking/                  # Active tracking (changes often, current state only)
│   ├── project-plan.md        # MVP progress, milestones, risks
│   └── error-log.md           # Active error tracking
│
├── diary/                     # Session-by-session narrative (split by range)
│   ├── README.md              # Index + session timeline
│   ├── sessions-01-05.md      # 5 sessions per file
│   ├── sessions-06-10.md
│   ├── sessions-11-15.md
│   └── _template.md           # Blank entry template
│
├── history/                   # Archived/resolved (append-only, read-rarely)
│   ├── build-log.md           # Full build history
│   ├── worklog.md             # Full task worklog
│   ├── pre-build-concerns.md  # Archived (mostly resolved)
│   └── archive-manifest.md    # What's archived and why
│
└── templates/                 # Entry templates for consistency
    ├── diary-entry.md
    ├── build-entry.md
    ├── error-entry.md
    └── worklog-entry.md
```

---

## Anti-Bloat Rules

### Rule 1: File Size Limit — 400 Lines

Any documentation file exceeding 400 lines MUST be split or archived. The 300-line mark is the proactive split threshold — start planning the split before you hit the hard limit. **Exception:** Files in `history/` are exempt — they're append-only archival records, not actively maintained.

| Action | Trigger |
|--------|---------|
| **Proactive split** | File reaches 300 lines |
| **Mandatory split** | File reaches 400 lines |
| **Emergency** | File reaches 500 lines |
| **Exempt** | Files in `history/` (append-only archives) |

### Rule 2: Diary Rotation — 5 Sessions Per File

Diary files are named by session range: `sessions-{start}-{end}.md`. Each file holds a maximum of 5 sessions. When the current file reaches 5 sessions, create the next file in sequence.

```
sessions-01-05.md    ← Sessions 1–5
sessions-06-10.md    ← Sessions 6–10
sessions-11-15.md    ← Sessions 11–15
sessions-16-20.md    ← Created when session 16 starts
```

Always use the `_template.md` for new entries.

### Rule 3: Archive After Resolve — 7 Days

When a tracking item (error, concern, risk) is resolved, it stays in the tracking doc for 7 days for visibility, then moves to `history/`. This keeps active tracking docs focused on what matters now.

### Rule 4: Single Source of Truth — No Duplicates

Every piece of information lives in exactly ONE place. If you find duplicate content:

1. Keep the version in the more appropriate directory (reference > tracking > diary > history)
2. Replace the duplicate with a cross-reference link
3. Delete the redundant copy

Common violations to watch for:
- Root-level `worklog.md` duplicating `docs/history/worklog.md`
- Same architecture decision described in both README and architecture.md
- Error descriptions appearing in both diary and error-log

### Rule 5: Stale Content Sweeping — Monthly Review

On the first of every month, review ALL tracking docs for:
- Resolved errors past the 7-day window → move to history
- Completed milestones past 30 days → summarize in project-plan, remove details
- Pre-build concerns with all items resolved → move to history
- Superseded architecture decisions → mark clearly, don't delete

### Rule 6: Current vs. History — Tracking Docs Show CURRENT State Only

Tracking docs (`tracking/`) contain only the current state. Historical data goes to `history/`. If a tracking doc starts recounting "what happened" instead of "what is," it's drifting into history territory.

| Doc Type | Contains | Does NOT Contain |
|----------|----------|-----------------|
| `tracking/project-plan.md` | Current progress, active risks, open issues | Past milestone details, resolved items |
| `tracking/error-log.md` | Open/unresolved errors | Resolved errors (those go to history after 7 days) |
| `history/build-log.md` | Full chronological record | Current status (that's in project-plan) |
| `history/worklog.md` | Full task-by-task record | Current status (that's in project-plan) |

### Rule 7: No Growth Without Split

When any doc is trending past 300 lines, proactively plan the split BEFORE it becomes a problem. Ask: "Can this be split by time? By topic? By lifecycle stage?"

Split strategies by document type:
- **Diary**: Split by session range (Rule 2)
- **Build-log**: Split by sprint/phase
- **Error-log**: Archive resolved errors to history
- **Worklog**: Split by milestone or task range
- **Reference docs**: Split by sub-topic if needed

---

## Writing Conventions

### Server Actions

> **CRITICAL RULE**: `'use server'` files must export ONLY async functions. No type exports, no constant exports. Types go in `actions/types.ts`. This is enforced by Next.js 16 — non-function exports cause "Invalid Server Actions request" at runtime.

#### Pattern

```
// actions/types.ts — shared types (NO 'use server')
export interface LessonMeta { ... }
export type ActionResult<T> = ...

// actions/simulation.ts — server actions ONLY
'use server'
import { ActionResult, GradeAttemptOutput } from './types'
export async function gradeAttempt(...) { ... }

// component file — import types from types.ts, functions from action files
import type { LessonMeta } from '@/app/actions/types'
import { listModuleLessons } from '@/app/actions/lesson'
```

### Authentication

> **CRITICAL RULE**: All server actions must use `getAuthUserId()` from `@/lib/auth-guard` for user identification. No hardcoded user ID fallbacks (no `mvp-user-001`). When no session exists, return `{ success: false, code: 'UNAUTHENTICATED' }`.

#### Pattern

```
// In server actions:
import { getAuthUserId } from '@/lib/auth-guard'

export async function myAction(userId?: string) {
  const uid = userId || await getAuthUserId();
  if (!uid) {
    return { success: false, error: 'You must be signed in', code: 'UNAUTHENTICATED' };
  }
  // Use uid for all database queries
}

// In client components:
import { useSession } from 'next-auth/react'

function MyComponent() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  // Pass userId to server actions when needed
}
```

> **NextAuth redirect rule**: Always use the default redirect behavior (`signIn('credentials', { callbackUrl })`) instead of `redirect: false`. The fetch-based approach doesn't reliably persist session cookies behind reverse proxies (see ERR-008).

### File Naming

| Pattern | Example | Location |
|---------|---------|----------|
| `{module}-{topic}.md` | `sessions-01-05.md` | diary/ |
| `ADR-{number}-{title}.md` | `ADR-001-monolith-first.md` | decisions/ |
| `{feature}-{type}.md` | `api-reference.md` | reference/ |
| `{topic}-log.md` | `error-log.md` | tracking/ or history/ |

### Entry Formats

Each tracking doc has a template in `templates/`. Use them. Consistency prevents bloat because structured entries are easier to scan and archive.

---

## Health Checks

Run these checks weekly:

```bash
# Find files over 400 lines
find docs/ -name "*.md" -exec sh -c 'lines=$(wc -l < "$1"); [ "$lines" -gt 400 ] && echo "$1: $lines lines"' _ {} \;

# Find files over 20KB
find docs/ -name "*.md" -size +20k -exec ls -lh {} \;

# Check for duplicate content
diff -q worklog.md docs/history/worklog.md 2>/dev/null
```

---

*Established: 2026-06-04 — Documentation restructuring sprint*
