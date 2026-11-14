# Changelog

Formato basato su [Keep a Changelog](https://keepachangelog.com/it/1.1.0/).
Versioning: vedi [docs/VERSIONING.md](./docs/VERSIONING.md).

## [0.1.4] — 2026-11-14

### Aggiunto
- Il docente, dal compito desktop, legge il report dello studente, le azioni sul PC simulato e il voto automatico, e può lasciare un commento visibile allo studente.

## [0.1.3] — 2026-11-14

### Aggiunto
- Pagina **Admin** (`/admin`): crea, modifica ed elimina utenti (ruolo, password, XP, roster) e classi (nome, codice, proprietario). Nessuna console SQL.
- L’account in `ADMIN_EMAILS` (default `docente@helpdesklab.it`) diventa admin al login.

### Cambiato
- Login studente: email valida obbligatoria. Viene solo salvata, senza invio di OTP. Se l’account ne ha già una, deve coincidere.

## [0.1.2] — 2026-11-14

### Cambiato
- Niente più pagina «Compiti Lab». Ticket e attività (mini-game, desktop) stanno sulla stessa board dello studente.

## [0.1.1] — 2026-11-14

### Aggiunto
- Lab **Desktop Windows / Linux** (`ossim`): tre casi solo software (DNS, proxy, resolv.conf). Lo studente interviene nel PC simulato, scrive il report e riceve correzione automatica (azioni + parole chiave).

### Corretto
- Select «Nuovo ticket» mostra nome classe e etichette in italiano
- Pulsanti «Crea e assegna ticket», «Crea classe» e «Salva valutazione» inviano davvero il form

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
