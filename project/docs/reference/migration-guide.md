# AdCraft: SQLite → PostgreSQL Migration Guide

> Step-by-step guide for migrating from SQLite (development) to PostgreSQL (production).

---

## Why Migrate?

SQLite is perfect for development and single-instance deployments. However, for production workloads with multiple users, PostgreSQL provides:

- **Concurrent writes** — SQLite locks the entire database on writes; PostgreSQL uses row-level locking
- **Multi-instance support** — Required for horizontal scaling (multiple containers/serverless functions)
- **Advanced indexing** — Full-text search, partial indexes, JSONB columns
- **Point-in-time recovery** — Built-in WAL archiving and replication
- **Managed hosting** — AWS RDS, Supabase, Neon, Railway all offer managed PostgreSQL

---

## Prerequisites

- PostgreSQL 15+ installed or a managed instance provisioned
- `pg_dump` / `psql` CLI tools (for verification)
- Node.js 20+ and the AdCraft project cloned locally

---

## Step 1: Provision a PostgreSQL Database

### Option A: Managed (Recommended for Production)

```bash
# Supabase (free tier available)
# Create project at https://supabase.com → Get connection string

# Neon (serverless PostgreSQL)
# Create project at https://neon.tech → Get connection string

# AWS RDS
# Provision via Console or CLI
aws rds create-db-instance \
  --db-instance-identifier adcraft-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username adcraft \
  --master-user-password <secure-password> \
  --allocated-storage 20
```

### Option B: Self-hosted (Docker)

```bash
docker run -d \
  --name adcraft-postgres \
  -e POSTGRES_DB=adcraft \
  -e POSTGRES_USER=adcraft \
  -e POSTGRES_PASSWORD=<secure-password> \
  -p 5432:5432 \
  postgres:16-alpine
```

---

## Step 2: Update Environment Variables

Update `.env` (or your deployment's environment configuration):

```bash
# Before (SQLite)
DATABASE_URL=file:./db/custom.db

# After (PostgreSQL)
DATABASE_URL=postgresql://adcraft:<secure-password>@localhost:5432/adcraft?schema=public
```

> **Important**: The `env.ts` validator already accepts both `file:` and `postgresql://` URLs.

---

## Step 3: Run Prisma Migration

Prisma will create all tables in PostgreSQL based on the existing schema:

```bash
# Generate the Prisma client (no changes needed — schema is database-agnostic)
npx prisma generate

# Push the schema to PostgreSQL (creates all tables)
npx prisma db push

# Or use migrations for production (creates a migration history):
npx prisma migrate dev --name init-postgres
```

---

## Step 4: Migrate Existing Data

Since SQLite data in the MVP is primarily development/seed data, the recommended approach is:

### Option A: Fresh Start (Recommended for MVP)

The MVP database contains only test users and progress data. For production, start fresh:

1. Deploy with PostgreSQL
2. Users sign up again (auth is email/password)
3. Progress resets (acceptable for MVP launch)

### Option B: Data Migration (If Preserving Data is Required)

```bash
# 1. Export SQLite data to JSON
node -e "
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const db = new PrismaClient();

async function exportData() {
  const users = await db.user.findMany();
  const lessonProgress = await db.lessonProgress.findMany();
  const moduleProgress = await db.moduleProgress.findMany();
  fs.writeFileSync('migration-data.json', JSON.stringify({ users, lessonProgress, moduleProgress }, null, 2));
  console.log('Exported:', users.length, 'users,', lessonProgress.length, 'lesson progress,', moduleProgress.length, 'module progress');
}
exportData();
"

# 2. Switch DATABASE_URL to PostgreSQL

# 3. Import data
node -e "
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const db = new PrismaClient();
const data = JSON.parse(fs.readFileSync('migration-data.json'));

async function importData() {
  for (const user of data.users) {
    await db.user.upsert({ where: { id: user.id }, create: user, update: user });
  }
  for (const lp of data.lessonProgress) {
    await db.lessonProgress.upsert({ where: { id: lp.id }, create: lp, update: lp });
  }
  for (const mp of data.moduleProgress) {
    await db.moduleProgress.upsert({ where: { id: mp.id }, create: mp, update: mp });
  }
  console.log('Import complete');
}
importData();
"
```

---

## Step 5: Verify Migration

```bash
# Run Prisma Studio to visually inspect the database
npx prisma studio

# Or use psql
psql $DATABASE_URL -c "SELECT count(*) FROM User;"
psql $DATABASE_URL -c "SELECT count(*) FROM LessonProgress;"
psql $DATABASE_URL -c "SELECT count(*) FROM ModuleProgress;"
```

---

## Step 6: Update Rate Limiting for Multi-Instance

The in-memory rate limiter (`src/lib/rate-limit.ts`) doesn't share state across instances.
For production PostgreSQL deployments with multiple instances, replace with a shared store:

### Option A: Upstash Redis (Recommended for Serverless)

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
// src/lib/rate-limit.ts — production version
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export const RATE_LIMITS = {
  signup: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 m') }),
  mentorStream: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, '1 m') }),
  general: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, '1 m') }),
};
```

### Option B: PostgreSQL-backed (Simpler, No Redis Needed)

Use a PostgreSQL table with timestamp-based sliding window.
This works well for moderate traffic and avoids adding Redis as a dependency.

---

## Step 7: Production Checklist

- [ ] `DATABASE_URL` points to PostgreSQL (not `file:`)
- [ ] `NEXTAUTH_SECRET` is a cryptographically random value (≥32 chars)
- [ ] `NEXTAUTH_URL` uses `https://`
- [ ] `AUTH_TRUST_PROXY=true` set behind reverse proxy
- [ ] Database backups configured (daily `pg_dump` cron or managed service)
- [ ] Rate limiting uses shared store if multi-instance
- [ ] Connection pooling configured (PgBouncer or Supabase Pooler)
- [ ] SSL mode enabled in connection string (`?sslmode=require`)

---

## Connection Pooling

For serverless environments (Vercel, AWS Lambda), use connection pooling to avoid exhausting PostgreSQL connection limits:

```bash
# With PgBouncer
DATABASE_URL=postgresql://adcraft:password@pgbouncer:6432/adcraft?pgbouncer=true

# With Supabase (uses Supavisor pooler by default)
DATABASE_URL=postgresql://adcraft:password@db.supabase.co:6543/postgres?pgbouncer=true
```

---

## Rollback Plan

If PostgreSQL migration causes issues:

1. Revert `DATABASE_URL` back to `file:./db/custom.db`
2. Redeploy — the app works with SQLite without code changes
3. Investigate the PostgreSQL issue in isolation

The Prisma schema is database-agnostic — no code changes are needed to switch between SQLite and PostgreSQL.

---

*Last updated: 2026-06-04*
