# Checklist di test — v0.1.0

Segna ogni riga dopo la prova. Ambiente consigliato: **deploy Vercel** (o locale con `npm run db:seed` + `npm run dev`).

## A. Accesso

- [ ] Login docente `docente@helpdesklab.it` / `demo1234` → arriva su `/teacher`
- [ ] Login studente Codice Classe `IT-9482` + **Marco Rossi** → arriva su `/student`
- [ ] Logout e rientro (cookie di sessione resta valido su HTTPS/Vercel)
- [ ] Nome/cognome con maiuscole diverse funzionano (es. `marco rossi`)

## B. Docente — classi e ticket

- [ ] Dashboard mostra classi, conteggi, link revisioni
- [ ] Apertura classe: studenti, gruppi, Lab, ticket
- [ ] **Nuovo ticket** manuale → assegnato a tutta la classe
- [ ] Ticket da **catalogo scenari**
- [ ] Ticket da **catena** (es. DNS → Domain Join) → compare badge/banner catena
- [ ] Ticket generato AI (anche in modalità `mock` senza API key)

## C. Studente — board e chiusura

- [ ] Kanban: colonne TODO / IN_PROGRESS / WAITING_REVIEW / RESOLVED
- [ ] Drag ticket in «In lavorazione»
- [ ] Apertura dettaglio: descrizione, log, chat cliente
- [ ] Compilare Causa root + Procedura + Test → **Invia in verifica**
- [ ] Ticket in catena mostra il banner a step

## D. Valutazione e catena

- [ ] Docente in **Revisioni** apre l’assignment
- [ ] Salva voto **≤ 5** su ticket in catena → nasce il ticket successivo
- [ ] Lo studente vede il nuovo ticket sulla board (badge «Catena · passo 2»)
- [ ] Voto alto senza «Forza» → nessun nuovo incidente

## E. Compiti Lab

- [ ] Docente assegna Lab con **scadenza** e punteggio minimo
- [ ] Studente apre `/lab`, svolge il mini-game, raggiunge il minimo, consegna
- [ ] Classifica Lab aggiornata in classe
- [ ] Compito scaduto incompleto → **Notifiche** / Controlla ora → avviso in-app

## F. Notifiche e roadmap

- [ ] Campanella docente con conteggio non letti
- [ ] «Controlla ora» e «Letti» funzionano
- [ ] `/roadmap` si apre; docente può spostare/aggiungere card (se abilitato)

## G. Smoke automatico (locale)

Con server avviato e DB seedato:

```bash
npm run smoke
```

- [ ] Smoke passa (login, board, campi chiusura)

## Esito

| Data | Ambiente (locale / Vercel URL) | Esito | Note |
| --- | --- | --- | --- |
| | | OK / KO | |

Quando la checklist A–F è verde su Vercel, si può considerare **0.1.0 testata** e passare alla **0.2** (vedi [VERSIONING.md](./VERSIONING.md)).
