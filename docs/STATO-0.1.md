# Stato del progetto — v0.1.0

Simulatore educativo di ticketing Help Desk (stile Jira/ITSM) per scuole superiori — indirizzo tecnico / operatore informatico.

**Stack:** Next.js 15 · TypeScript · Tailwind · shadcn/ui · Prisma · Auth.js v5 · SQLite (locale) / Postgres Supabase (Vercel).

---

## Ruoli

| Ruolo | Accesso |
| --- | --- |
| **Docente** | Email (+ password) o Google OAuth (opzionale) |
| **Studente / tecnico L1–L2** | Codice Classe + Nome/Cognome (roster) oppure email |

### Credenziali demo (seed)

| Ruolo | Come entrare |
| --- | --- |
| Docente | `docente@helpdesklab.it` / `demo1234` |
| Studente | Codice **`IT-9482`** + **Marco Rossi** |
| Studente (email) | `marco.rossi@studenti.it` / `demo1234` |

---

## Moduli presenti

### 1. Auth e classi
- Login Codice Classe / email / Google predisposto
- Classi con codice univoco, roster studenti, gruppi
- Collegamento Google Classroom (struttura OAuth; import roster completo ancora da rifinire)

### 2. Ticketing
- Creazione ticket: manuale, catalogo scenari, generatore AI (mock / OpenAI / Gemini)
- Assegnazione: tutta la classe / selezione / gruppo
- Board Kanban studente (drag & drop, filtri priorità/SLA)
- Dettaglio ticket: descrizione, log/allegati, chat cliente (AI o script), chiusura con causa root + procedura + test
- Review docente + voto 1–10 + XP + feedback

### 3. Catene di incidenti
- Scenari collegati: DNS→AD, DHCP→stampante, Phishing→lockout
- Se il voto è ≤ soglia (default 5), nasce il ticket successivo allo stesso studente
- Banner catena su dettaglio + badge sulla Kanban

### 4. Attività pratiche (sulla stessa board)
Non c’è una sezione a parte. Il docente assegna dalla classe; lo studente le vede come card sulla **board**, insieme ai ticket. Aprendo la card si lavora (mini-game o desktop) e, a consegna valida, la card va in chiusi.

Giochi:

| Key | Titolo |
| --- | --- |
| `rj45` | Crimpatura RJ45 |
| `terminal` | Ping & IP Challenge |
| `ports` | Port Strike |
| `subnet` | Subnet / CIDR Builder |
| `osi` | OSI Layer Match |
| `cli` | CLI Command Strike |
| `wifi` | Sicurezza Wi‑Fi |
| `ossim` | Desktop Windows / Linux (troubleshooting software + report) |

Classifica Lab per classe.

Il desktop simulato (v0.1.1) ha tre casi: DNS Windows, proxy Windows, `resolv.conf` Linux. Non è un sistema operativo completo: è la prima slice.

### 5. Notifiche scadenze (in-app)
- Campanella docente + pagina `/teacher/notifications`
- Avvisi Lab scaduti e ticket oltre SLA
- Cron Vercel **1×/giorno** (Hobby); controllo immediato aprendo Notifiche / «Controlla ora»
- Email istituzionale: codice pronto ma **spento** (`ENABLE_EMAIL_NOTIFICATIONS`)

### 6. Roadmap pubblica
- Board Idee → Piano → In corso → Fatto su `/roadmap`

---

## Pagine principali

| Path | Chi |
| --- | --- |
| `/login` | Tutti |
| `/teacher` | Docente — dashboard classi |
| `/teacher/tickets/new` | Nuovo ticket / catene |
| `/teacher/review` | Coda revisioni |
| `/teacher/notifications` | Avvisi scadenze |
| `/teacher/classrooms/[id]` | Classe, Lab, studenti |
| `/teacher/assignments/[id]` | Valutazione |
| `/student` | Kanban |
| `/student/tickets/[id]` | Lavoro sul ticket |
| `/lab` · `/lab/[taskId]` | Compiti Lab |
| `/roadmap` | Roadmap |

---

## Cosa **non** è ancora in 0.1

- Import roster CSV / Google Classroom completo
- Lab topologia collegato a VirtLab
- Peer review, badge competenze, runbook builder
- Modalità esame (messa da parte)
- Email scadenze su dominio scuola (filtrata; da riattivare dopo)
- Cron più frequente (serve piano Vercel Pro)

---

## Ambiente

| Locale | Produzione |
| --- | --- |
| SQLite `file:./dev.db` | Supabase Postgres |
| `npm run dev` → `127.0.0.1:3456` | Vercel + `AUTH_URL` / `AUTH_SECRET` |

Vedi [DEPLOY.md](../DEPLOY.md) e [CHECKLIST-TEST.md](./CHECKLIST-TEST.md).
