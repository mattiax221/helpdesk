# Versioning HelpDesk Lab

Usciamo con **Semantic Versioning** adattato al percorso scuola:

```
0.x.y  →  BETA (sviluppo / prova in classe)
1.0.0  →  prima versione UFFICIALE
1.x.y  →  ufficiale stabile (+ fix / funzioni compatibili)
2.0.0  →  breaking change importanti
```

## Fasce

| Fascia | Versioni | Significato |
| --- | --- | --- |
| **Beta** | `0.1.0` … `0.9.x` | Funziona ma può cambiare; si testa in laboratorio |
| **Ufficiale** | `1.0.0`+ | Pronto per uso didattico “di produzione” in istituto |

`package.json` → campo `"version"` è la fonte di verità.  
Ad ogni rilascio: aggiornare `CHANGELOG.md` + tag git `vX.Y.Z` (opzionale ma consigliato).

## Piano beta (indicativo)

| Versione | Focus | Criterio di uscita |
| --- | --- | --- |
| **0.1.0** | Base usabile: auth, ticket, Lab, catene, notifiche in-app, deploy | Checklist test A–F OK |
| **0.1.1** ← *ora* | Desktop simulato Windows/Linux (solo software) + fix form ticket | Un caso risolto e report corretto |
| **0.2.0** | Import roster (CSV e/o Classroom) | Classe reale caricata in un click |
| **0.3.0** | Lab topologia collegato a **VirtLab** | Almeno un esercizio rete end-to-end |
| **0.4.0** | Peer review + badge competenze | Flusso studente→studente→docente |
| **0.5.0** | Runbook builder + replay timeline | Materiale riusabile / storia ticket |
| **0.6–0.9** | Lucidatura UX, email Workspace (se IT ok), hardening | Feedback docenti |
| **1.0.0** | Freeze feature “core scuola” | Checklist ufficiale + 1 ciclo classe reale senza blocchi |

Le card live restano su `/roadmap`: lì si sposta lo stato; qui si fissa il numero di versione.

## Come bumpare

1. Completare i criteri della riga di versione
2. Aggiornare `"version"` in `package.json`
3. Aggiungere sezione in `CHANGELOG.md`
4. Commit tipo: `Release v0.2.0 — import roster`
5. Push su `main` (e tag `v0.2.0` se usate i tag)

### Patch vs minor (in beta)

- **0.1.1** — fix bug senza nuove funzioni
- **0.2.0** — nuova funzione / pezzo di roadmap

Da **1.0** in poi: MAJOR solo se rompete dati o flussi docenti già in uso.

## Cosa conta come “1.0 ufficiale”

- Login affidabile su Vercel
- Ticket + valutazione + almeno Lab e una catena stabili
- Roster classe gestibile (CSV o Classroom)
- Documentazione test aggiornata
- Nessun `SEED_ON_DEPLOY` in produzione
- Backup/Postgres ok

Funzioni “nice” (email, VirtLab avanzato, peer review) possono arrivare in **1.1+** se il core è solido.
