# HelpDesk Lab

Simulatore educativo di ticketing aziendale (stile Jira Service Management) per scuole superiori — indirizzo **Tecnico / Operatore Informatico**.

Gli studenti lavorano come tecnici Help Desk L1/L2 su una board Kanban, dialogano con un “cliente” simulato e chiudono i ticket con causa root, procedura e test finale. I docenti creano classi, generano ticket (manuale o AI), assegnano scenari e valutano le diagnosi.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui + Lucide
- Prisma ORM + SQLite
- Auth.js (NextAuth v5) — login **Codice Classe + Nome/Cognome** oppure email, Google OAuth predisposto
- Generatore AI (`/api/generate-ticket`) con fallback mock
- Drag & drop Kanban con `@dnd-kit`

## Avvio rapido

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

Apri [http://127.0.0.1:3456](http://127.0.0.1:3456).

### Credenziali demo (seed)

| Ruolo | Accesso |
| --- | --- |
| Docente | `docente@helpdesklab.it` / `demo1234` |
| Studente | Codice Classe **`IT-9482`** + Nome/Cognome (es. **Marco Rossi**) |
| Studente (email) | `marco.rossi@studenti.it` / `demo1234` |

La classe seed è **3ª Operatore Informatico - Lab Reti** con 5 ticket già assegnati ai 3 studenti.

## Variabili d'ambiente

Vedi [`.env.example`](.env.example).

- `AUTH_SECRET` — obbligatorio in produzione
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — abilita login Google e predispone scope Classroom:
  - `https://www.googleapis.com/auth/classroom.courses.readonly`
  - `https://www.googleapis.com/auth/classroom.rosters.readonly`
- `AI_PROVIDER` — `mock` (default), `openai` o `gemini`
- `OPENAI_API_KEY` / `GEMINI_API_KEY` + `AI_MODEL`

Senza chiavi AI l’endpoint `/api/generate-ticket` usa un generatore locale di scenari realistici.

## Flussi principali

### Docente

1. Accede e crea una o più **Classi** (codice univoco tipo `IT-9482`).
2. Opzionale: pulsante **Collega Google Classroom** (OAuth predisposto).
3. Crea ticket **manuali** o con **Generatore AI**, con note segrete (soluzione attesa).
4. Assegna a tutta la classe o a singoli studenti.
5. In **Revisioni** valuta diagnosi (voto 1–10 + XP + feedback).

### Studente

1. Entra con Codice Classe + Nome/Cognome.
2. Usa la **Kanban board** (`Da Fare` → `In Lavorazione` → `In Attesa di Verifica` → `Risolti`).
3. Nel dettaglio ticket: descrizione cliente, log fittizi, chat indizi, campi di chiusura obbligatori.
4. Sezione **Lab & Mini-Games**: crimpatura RJ45 (T568A/B) e sfide terminale IP/comandi.

## Migrazione a PostgreSQL / Supabase

1. In `prisma/schema.prisma` cambia:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Imposta `DATABASE_URL` sulla connection string Postgres.
3. Esegui `npx prisma db push` (o `migrate dev`) e `npm run db:seed`.

Lo schema evita tipi SQLite-only: gli array/JSON sono salvati come stringhe serializzate per massima portabilità.

## Script npm

| Script | Descrizione |
| --- | --- |
| `npm run dev` | Dev server su porta **3456** |
| `npm run build` | Build produzione |
| `npm run db:push` | Applica schema Prisma |
| `npm run db:seed` | Popola dati demo |
| `npm run db:reset` | Reset DB + seed |

## Struttura utile

- `prisma/schema.prisma` — modello dati
- `prisma/seed.ts` — dati dimostrativi
- `src/lib/auth.ts` — Auth.js + Credentials + Google
- `src/app/api/generate-ticket` — generatore AI/mock
- `src/components/kanban` — board drag & drop
- `src/components/labs` — mini-game RJ45 e terminale

## Note didattiche

HelpDesk Lab è pensato per esercitazioni in laboratorio: i ticket del seed coprono conflitto IP, bootloop post-update, stampante di rete, phishing e surriscaldamento hardware.
