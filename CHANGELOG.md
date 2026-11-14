# Changelog

Formato basato su [Keep a Changelog](https://keepachangelog.com/it/1.1.0/).
Versioning: vedi [docs/VERSIONING.md](./docs/VERSIONING.md).

## [0.1.0] — 2026-11-14

Prima slice **beta** utilizzabile in laboratorio.

### Aggiunto
- Auth: Codice Classe + nome, email docente/studente, Google OAuth predisposto
- Classi, roster, gruppi, dashboard docente
- Ticketing Kanban, chat cliente, chiusura con diagnosi, valutazione + XP
- Catene di incidenti (DNS→AD, DHCP→stampante, Phishing→lockout)
- Compiti Lab (7 mini-game) assegnabili con scadenza e classifica
- Notifiche scadenze in-app (cron giornaliero Hobby + Controlla ora)
- Roadmap pubblica `/roadmap`
- Deploy Vercel + Supabase Postgres
- Documentazione `docs/` (stato, checklist test, versioning)

### Note
- Email avvisi: codice presente ma disattivato (`ENABLE_EMAIL_NOTIFICATIONS`)
- Cron Vercel: max 1×/giorno sul piano Hobby
