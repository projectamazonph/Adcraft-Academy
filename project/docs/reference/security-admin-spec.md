# AdCraft Security & Admin Specification

> Security architecture and admin system for AdCraft. Addresses the unique risks of a platform that mimics financial tools, uses AI agents, and serves enterprise teams with multi-tenancy requirements.

> **Source**: Qwen chat — "AdCraft Product Development Gaps" (2026-06-03)
> **Architecture Context**: Monolith-First MVP (ADR-001). Multi-tenancy, RLS, and PII Sanitization are Phase 3+. MVP is single-tenant with org_id column prep.

---

## 1. Security Architecture

AdCraft is an ed-tech platform that mimics financial tools. Security must prevent data leakage between agencies and ensure AI safety.

### A. Data Isolation & Multi-Tenancy (Phase 3+)

| Control | Implementation | Rationale |
|---------|---------------|-----------|
| Row-Level Security (RLS) | Enforced at PostgreSQL level via `organization_id` foreign key on every user-data table. Middleware injects org context; direct DB queries without it return empty sets. | Prevents cross-tenant data leakage even if application logic fails. Critical for agency trust. |
| PII Sanitization Pipeline | All uploads pass through async sanitizer (Regex + NER) before storage. Raw files stored in ephemeral S3 bucket (24h TTL); only sanitized versions persist. | Users may accidentally upload real client data. Auto-redaction limits liability and GDPR/CCPA exposure. |
| Signed URLs Only | No public S3 buckets. All downloadables and sanitized uploads served via time-limited (15min) signed URLs with IP binding. | Prevents unauthorized sharing of proprietary templates or uploaded account data. |
| AI Context Scoping | LLM context windows strictly partitioned by `user_id + org_id`. System prompts explicitly forbid referencing other users' data. | Prevents "prompt injection" attacks where users try to extract other agencies' strategies via AI Mentor. |
| Encryption | AES-256 at rest (RDS/S3); TLS 1.3 in transit. Field-level encryption for emails/names in users table. | Standard compliance baseline for B2B SaaS handling business data. |

### B. AI Safety & Guardrails

The AI Mentor and Coaches are high-risk surfaces. They must never give unverified financial advice.

| Guardrail | Technical Enforcement | Fallback Behavior |
|-----------|---------------------|-------------------|
| **Deterministic Primacy** | AI receives only the `ScoreResult` JSON from the Evaluation Engine. It cannot calculate scores independently. Prompt: "Explain this result. Do NOT recalculate." | If AI output contradicts ScoreResult → discard response → serve cached rule template. |
| **Safety Classifier** | Post-generation scan for: financial guarantees ("you will profit"), policy violations ("fake reviews"), PII leakage, hallucinated rules. | Flagged response → blocked → logged to `ai_safety_audit` → user sees generic safe response. |
| **Citation Requirement** | Advanced mode responses must include `[RuleID]` tags linked to `ppc_rules` table. Missing citation = low confidence badge. | Ensures AI grounds answers in approved SOPs, not training data hallucinations. |
| **Rate Limiting** | Per-user sliding window: 20 msgs/min (Mentor), 50 decisions/hr (Simulations). Stricter for free tier. | Prevents abuse, cost spikes, and automated scraping of proprietary curriculum. |
| **Human Escalation** | "Report AI Issue" button on every response. Flags entry in admin dashboard for curriculum team review. | Creates feedback loop to catch edge cases the classifier misses. |

### C. Application Security

| Area | Specification |
|------|--------------|
| Auth | Delegated to NextAuth.js (MVP) / Clerk (Phase 3). JWT validation middleware on all API routes. Session rotation every 24h. MFA enforced for Admin/Manager roles (Phase 3+). |
| Input Validation | Zod strict mode on all endpoints. Server Actions validate all inputs. SQL injection prevented via Prisma parameterization. |
| API Security | CORS locked to app domain. CSP headers restrict script sources. HSTS enabled. Dependency scanning (Snyk/Dependabot) in CI. |
| Audit Logging | Immutable `audit_logs` table for: logins, data uploads, AI interactions, admin changes, cert issuance, legal acceptances. Retained 2 years. |
| Secrets | Environment variables (MVP) → HashiCorp Vault / AWS Secrets Manager (Phase 3). Zero secrets in repo. Rotated quarterly. |

---

## 2. Admin System Specification

Admin serves two masters: **Internal Content Teams** (curriculum updates) and **External Managers** (team oversight).

### A. Role-Based Access Control (RBAC)

| Role | Scope | Key Permissions |
|------|-------|----------------|
| Super Admin | Platform-wide | Manage orgs, global rules, AI system prompts, legal docs, billing overrides |
| Content Author | Curriculum only | Create/edit lessons & scenarios, manage downloadables, preview unpublished content |
| QA Reviewer | Curriculum only | Approve/reject content changes, run regression tests, flag AI issues |
| Org Manager | Own organization | Manage team seats, assign paths, view team analytics, issue certs, upload data |
| Instructor | Assigned cohorts | View assigned learner progress, grade capstones manually, send cohort messages |
| Learner | Own profile | Complete content, use tools, download templates, chat with AI |

### B. Content Management System (CMS) — Phase 3+

| Feature | Spec | Safety Check |
|---------|------|-------------|
| Visual Scenario Builder | Drag-drop interface for branching simulations. Links to `ppc_rules` DB for scoring logic. | Preview mode requires passing QA checklist before publish. |
| Rule Versioning | Every rule edit creates new immutable version. Simulations pin specific rule versions. | Prevents retroactive score changes for completed attempts. |
| AI Prompt Registry | Version-controlled system prompts per agent. Diff view for changes. Rollback capability. | Prompt changes trigger safety regression suite automatically. |
| Downloadable Manager | Upload/version PDFs/Sheets. Auto-link to lesson modules. Expiry dates for outdated SOPs. | Virus scan on upload. Broken link checker runs nightly. |
| Marketplace Config | Edit CPC benchmarks, seasonality, currency per marketplace. | Changes require Super Admin approval (affects scoring globally). |

### C. Team & Organization Dashboard (Phase 3+)

Addresses Persona 4's need for governance and consistency.

| Widget | Data Source | Actionability |
|--------|-----------|---------------|
| Team Health Grid | `users + attempts` | Color-coded cards (Green/Amber/Red) based on activity + cert status. Click → drilldown. |
| Skill Heatmap | Aggregated `attempt.score_result` by skill tag | Identify systemic gaps (e.g., "Team weak on negation logic"). Assign remedial module. |
| Certification Registry | `certifications` table | Expiry tracking. Bulk renew via delta updates. Verify external hires. |
| Onboarding Wizard | Stepper component | Invite CSV → Assign Paths → Set Requirements → Configure Reports. <5 min setup. |
| AI Usage Monitor | `ai_interactions` aggregated | Track hint dependency. High hint usage = content gap or struggling learner. |
| Data Upload Status | `sanitization_logs` | View quarantine queue. Approve/reject flagged uploads. Audit trail visible. |

### D. Compliance & Legal Admin

| Tool | Function |
|------|----------|
| Legal Doc Manager | Version ToS, AI Disclaimer, DPA. Force re-acceptance on major version bump. Track acceptance rate. |
| Data Retention Policy | Configure auto-delete schedules per org (GDPR/CCPA). Manual purge workflow with confirmation. |
| AI Safety Dashboard | Review flagged responses. Tune classifier thresholds. Export audit logs for compliance reviews. |
| Certification Revocation | Revoke certs for policy violations or misconduct. Public verification URL updates instantly. |

---

## 3. Critical Implementation Notes

1. **Never Trust AI for Scoring**: The Evaluation Engine must be a pure TypeScript service with ZERO LLM dependencies. AI is only a presentation layer for pre-calculated results. This is the single most important security/architecture decision.

2. **Sanitization is Async** (Phase 3): Don't block uploads. Accept file → return job ID → notify via WebSocket/email when sanitized. Large STRs can take 10-30s to process safely.

3. **Admin Actions Are Audited**: Every admin click (rule change, user ban, prompt edit) writes to `audit_logs` with timestamp, IP, and previous/new values. Non-negotiable for enterprise trust.

4. **Staging Environment Parity**: Admin/CMS changes must deploy to staging first. Content authors test against synthetic data that mirrors production distributions. Never edit live curriculum.

5. **Emergency Kill Switch**: Global toggle to disable AI Mentor/chat instantly if safety classifier fails catastrophically. Falls back to static FAQ/help docs. Documented runbook for ops team.

---

*Source: Qwen chat "AdCraft Product Development Gaps" — 2026-06-03*
*Multi-tenancy and CMS features are Phase 3+. MVP is single-tenant with org_id column prep.*
*Last updated: 2026-06-04*
