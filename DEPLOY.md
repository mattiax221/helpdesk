# Deploy HelpDesk Lab su Vercel

SQLite **non** funziona in modo affidabile su Vercel (filesystem effimero). Serve **PostgreSQL** (Neon, Supabase o Vercel Postgres).

## 1. Database (Neon consigliato)

1. Crea un progetto su [Neon](https://neon.tech) (piano free ok).
2. Copia la connection string **pooled** (`…-pooler…` se disponibile).
3. Formato tipico:
   `postgresql://USER:PASSWORD@HOST/DB?sslmode=require`

## 2. Progetto Vercel

1. Importa questo repo su [Vercel](https://vercel.com/new).
2. Framework: Next.js (rilevato automaticamente).
3. Build command già in `vercel.json`: `node scripts/vercel-build.mjs`  
   (passa Prisma a `postgresql` se `DATABASE_URL` è Postgres, fa `db push`, poi `next build`).

## 3. Environment variables

Imposta almeno:

| Nome | Valore |
| --- | --- |
| `DATABASE_URL` | URL Postgres (pooled) |
| `AUTH_SECRET` | stringa lunga random (`openssl rand -base64 32`) |
| `AUTH_URL` | `https://TUO-PROGETTO.vercel.app` |
| `AUTH_TRUST_HOST` | `true` |

Opzionali:

| Nome | Note |
| --- | --- |
| `SEED_ON_DEPLOY` | `1` solo al **primo** deploy per caricare demo (docente/studenti/ticket/roadmap). Poi toglila. |
| `GEMINI_API_KEY` / `AI_PROVIDER` | chat ticket e generazione AI |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth |
| `TEACHER_EMAIL_ALLOWLIST` | email docenti Google |

## 4. Dopo il primo deploy

1. Apri `https://TUO-PROGETTO.vercel.app/login`.
2. Se hai seedato: docente `docente@helpdesklab.it` / `demo1234`.
3. Roadmap pubblica: `/roadmap` (il docente può aggiungere card).
4. Rimuovi `SEED_ON_DEPLOY` dalle env Vercel.

## 5. CLI locale (opzionale)

```bash
npx vercel login
npx vercel link
npx vercel env pull
npx vercel --prod
```

## Note

- In locale resta SQLite (`file:./dev.db`).
- Su Vercel lo script di build cambia temporaneamente il provider Prisma in `postgresql`.
- Per Google OAuth aggiorna anche gli URI di redirect nella console Google con il dominio Vercel.
