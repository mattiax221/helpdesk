# Deploy HelpDesk Lab su Vercel + Supabase

SQLite **non** funziona su Vercel. Usiamo **Supabase Postgres**.

## 1. Database Supabase

1. Vai su [supabase.com](https://supabase.com) → **New project**
2. Scegli regione (es. `eu-central-1` / Frankfurt se sei in Italia)
3. Salva la password del DB
4. **Project Settings → Database → Connection string**
5. Usa la modalità **URI** e preferisci il pooler:
   - **Transaction** (porta `6543`) → ideale per Vercel serverless  
   - oppure **Session** se Transaction dà problemi con Prisma
6. Copia qualcosa tipo:
   ```
   postgresql://postgres.XXXX:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
7. Aggiungi se manca: `?sslmode=require`  
   Per Prisma + pooler Transaction spesso serve anche:
   ```
   ?sslmode=require&pgbouncer=true
   ```
8. (Consigliato) tieni anche la connection **direct** (porta `5432`) per `db push`/migrazioni da locale se il pooler fallisce.

Esempio env completo:

```bash
# App / Vercel (pooler)
DATABASE_URL="postgresql://postgres.PROJECT:PASSWORD@aws-0-….pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"

# Opzionale: diretta per CLI
# DIRECT_URL="postgresql://postgres.PROJECT:PASSWORD@db.XXXX.supabase.co:5432/postgres?sslmode=require"
```

> Non usare le API keys `anon` / `service_role` di Supabase come database: qui serve solo la **connection string Postgres**.

## 2. Progetto Vercel

1. Importa questo repo su [Vercel](https://vercel.com/new)
2. Framework: Next.js
3. Build: già in `vercel.json` → `node scripts/vercel-build.mjs`  
   (se `DATABASE_URL` è Postgres, switcha Prisma a `postgresql`, fa `db push`, poi `next build`)

## 3. Environment variables su Vercel

| Nome | Valore |
| --- | --- |
| `DATABASE_URL` | URI Postgres Supabase (**pooler** + `sslmode=require`) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://TUO-PROGETTO.vercel.app` |
| `AUTH_TRUST_HOST` | `true` |

Opzionali:

| Nome | Note |
| --- | --- |
| `SEED_ON_DEPLOY` | `1` solo al **primo** deploy per dati demo, poi **rimuovila** |
| `GEMINI_API_KEY` / `AI_PROVIDER` | AI ticket/chat |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth |
| `TEACHER_EMAIL_ALLOWLIST` | email docenti Google |

## 4. Primo deploy

1. Deploy su Vercel
2. Apri `/login`
3. Se hai seedato: `docente@helpdesklab.it` / `demo1234`
4. Roadmap: `/roadmap`
5. Togli `SEED_ON_DEPLOY`

## 5. Problemi tipici Supabase + Prisma

- **Prepared statements / PgBouncer**: aggiungi `pgbouncer=true` sulla URL pooler Transaction
- **`db push` fallisce sul pooler**: usa temporaneamente la URL **direct** (`5432`) in locale:
  ```bash
  DATABASE_URL="postgresql://…@db.XXXX.supabase.co:5432/postgres?sslmode=require" npx prisma db push
  ```
- **Password con caratteri speciali**: URL-encode (`@` → `%40`, ecc.)

## 6. CLI (opzionale)

```bash
npx vercel login
npx vercel link
npx vercel env add DATABASE_URL
npx vercel --prod
```

## Locale

In locale resta SQLite (`file:./dev.db`).  
Supabase serve per **produzione / Vercel**, non è obbligatorio in sviluppo.
