# AdCraft Deployment Guide (Vercel)

## Quick Deploy

### 1. Create PostgreSQL Database
- [Supabase](https://supabase.com) (free tier) or [Neon](https://neon.tech) (serverless)
- Copy the connection string

### 2. Deploy to Vercel
```bash
cd project
npx vercel
```
- Link to your GitHub repo when prompted
- Set environment variables in Vercel Dashboard

### 3. Set Environment Variables (in Vercel Dashboard)
```
DATABASE_URL=postgresql://user:pass@host:5432/adcraft?schema=public
NEXTAUTH_SECRET=<random-32-char-string>
NEXTAUTH_URL=https://your-app.vercel.app
```

### 4. Initialize Database
```bash
npx prisma db push --schema=prisma/schema.prisma
```

### 5. Seed Quiz Data
Quiz questions are lazily seeded from `fixtures/quiz-questions.json` on first access --- no manual step needed.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | Random 32+ char string for JWT signing |
| `NEXTAUTH_URL` | ✅ | Your deployed app URL (e.g., `https://adcraft.vercel.app`) |

---

## AI Mentor (Puter.js)

The AI Mentor runs **entirely client-side** via Puter.js CDN:

- **No API key required** --- Puter handles auth via the user's browser
- **Free tier** --- Users authenticate with their free Puter account
- **Streaming** --- Token-by-token responses with full streaming UI
- **Fallback** --- If Puter CDN is unavailable, falls back to server-side API

The Puter.js script is loaded in `src/app/layout.tsx`:
```html
<script src="https://js.puter.com/v2/"></script>
```

No additional environment variables needed for AI features.

---

## CI/CD (GitHub Actions)

The `.github/workflows/ci.yml` runs:
1. **On every PR**: Install, generate Prisma client, run 117 unit tests
2. **On push to main**: Tests -> auto-deploy to Vercel production

### Required GitHub Secrets
```
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-org-id>
VERCEL_PROJECT_ID=<your-project-id>
```

---

## Manual Deploy
```bash
# Preview
vercel

# Production
vercel --prod
```

---

## Rollback
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback
```

---

*Last updated: 2026-06-23 --- Added Puter.js AI Mentor (client-side, no API key)*
