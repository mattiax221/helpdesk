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

In Supabase scegli **Connect → ORM → Prisma**: ti mostra già `.env.local` con:

```bash
DATABASE_URL="postgresql://…"   # transaction pooler (app)
DIRECT_URL="postgresql://…"     # session/direct (migrazioni)
```

Copia **entrambe** su Vercel.  
Non usare `NEXT_PUBLIC_SUPABASE_*` per il database.

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
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth Classroom (opzionale) |
| `CRON_SECRET` | secret per cron giornaliero `/api/cron/overdue` (Hobby: solo 1×/giorno) |
| `TEACHER_EMAIL_ALLOWLIST` | email docenti Google |
| `ENABLE_EMAIL_NOTIFICATIONS` | `1` solo quando vorrete le email (default: off, solo in-app) |
| `SCHOOL_EMAIL_DOMAIN` | es. `casadicarita.it` (serve solo con email attive) |

### Avvisi scadenze (ora solo in-app)

1. Docente assegna compito Lab **con scadenza**
2. Cron ogni giorno alle 06:00 UTC (o **Notifiche → Controlla ora**) crea gli avvisi
3. Campanella / pagina **Notifiche**

Email istituzionale (Gmail Workspace dominio scuola): codice pronto, spento finché non mettete `ENABLE_EMAIL_NOTIFICATIONS=1`.

## 4. Primo deploy

1. Deploy su Vercel
2. Apri `/login`
3. Se hai seedato: `docente@helpdesklab.it` / `demo1234`
4. Roadmap: `/roadmap`
5. Togli `SEED_ON_DEPLOY`

## 5. Login che “torna indietro” su `/login`

Se dopo **Entra come tecnico** o **Accedi** (docente) resti / torni su `/login`:

1. Su Vercel → **Settings → Environment Variables** verifica:
   - `AUTH_SECRET` presente (stesso valore su Production)
   - `AUTH_URL` = esattamente l’URL del deploy, es. `https://helpdesk-xxx.vercel.app` (https, senza slash finale)
   - `AUTH_TRUST_HOST` = `true`
2. **Redeploy** dopo aver salvato le variabili
3. Se non hai mai seedato: metti `SEED_ON_DEPLOY=1`, ridistribuisci una volta, poi **rimuovi** `SEED_ON_DEPLOY`
4. Demo: tecnico `IT-9482` + **Marco Rossi** · docente `docente@helpdesklab.it` / `demo1234`

## 6. Problemi tipici Supabase + Prisma

- **Prepared statements / PgBouncer**: aggiungi `pgbouncer=true` sulla URL pooler Transaction
- **`db push` fallisce sul pooler**: usa temporaneamente la URL **direct** (`5432`) in locale:
  ```bash
  DATABASE_URL="postgresql://…@db.XXXX.supabase.co:5432/postgres?sslmode=require" npx prisma db push
  ```
- **Password con caratteri speciali**: URL-encode (`@` → `%40`, ecc.)

## 7. CLI (opzionale)

```bash
npx vercel login
npx vercel link
npx vercel env add DATABASE_URL
npx vercel --prod
```

## Locale

In locale resta SQLite (`file:./dev.db`).  
Supabase serve per **produzione / Vercel**, non è obbligatorio in sviluppo.
