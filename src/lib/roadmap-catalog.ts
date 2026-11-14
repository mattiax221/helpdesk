import type { RoadmapPriority, RoadmapStatus } from "@prisma/client";

export type RoadmapSeed = {
  title: string;
  description: string;
  category: string;
  priority: RoadmapPriority;
  status: RoadmapStatus;
  sortOrder: number;
};

/** Fonte unica della roadmap di prodotto. Le card con lo stesso titolo vengono aggiornate. */
export const ROADMAP_CATALOG: RoadmapSeed[] = [
  // —— Fatto
  {
    title: "Login classe e docente",
    description: "Studente con codice + nome/cognome. Docente con email. Sessione che resta dopo il riavvio.",
    category: "Piattaforma",
    priority: "HIGH",
    status: "DONE",
    sortOrder: 10,
  },
  {
    title: "Board unica",
    description: "Ticket e attività pratiche nella stessa coda Kanban, con SLA, priorità e trascinamento.",
    category: "Studente",
    priority: "HIGH",
    status: "DONE",
    sortOrder: 20,
  },
  {
    title: "Ticket, chat e chiusura",
    description: "Descrizione cliente, log, chat, causa root, procedura e test finale.",
    category: "Studente",
    priority: "HIGH",
    status: "DONE",
    sortOrder: 30,
  },
  {
    title: "Valutazione e XP",
    description: "Il docente mette voto, feedback e XP. Lo studente li vede sul ticket.",
    category: "Valutazione",
    priority: "HIGH",
    status: "DONE",
    sortOrder: 40,
  },
  {
    title: "Catene di incidenti collegati",
    description: "DNS→AD, DHCP→stampante, phishing→lockout. Voto basso: nasce il ticket successivo.",
    category: "Didattica",
    priority: "HIGH",
    status: "DONE",
    sortOrder: 50,
  },
  {
    title: "Compiti Lab assegnabili",
    description: "RJ45, porte, OSI, subnet, Wi‑Fi, CLI e terminal. Assegnati in classe e visibili sulla board.",
    category: "Mini-game",
    priority: "HIGH",
    status: "DONE",
    sortOrder: 60,
  },
  {
    title: "Desktop Windows / Linux",
    description: "Prima slice: DNS, proxy e resolv.conf. Lo studente sistema dal PC simulato e scrive il report.",
    category: "Mini-game",
    priority: "HIGH",
    status: "DONE",
    sortOrder: 70,
  },
  {
    title: "Classi, gruppi e elenco studenti",
    description: "Codice classe, gruppi e incolla elenco Nome Cognome. Manca ancora il file CSV e Classroom.",
    category: "Docente",
    priority: "HIGH",
    status: "DONE",
    sortOrder: 80,
  },
  {
    title: "Catalogo ticket e generatore",
    description: "Scenari pronti e generazione (mock o AI se c’è la chiave).",
    category: "Docente",
    priority: "MEDIUM",
    status: "DONE",
    sortOrder: 90,
  },
  {
    title: "Avvisi scadenze in-app",
    description: "Campanella per attività e SLA scaduti. Controllo all’apertura e una volta al giorno.",
    category: "Docente",
    priority: "HIGH",
    status: "DONE",
    sortOrder: 100,
  },
  {
    title: "Deploy su Vercel + Postgres",
    description: "App online su Vercel con database Supabase.",
    category: "Piattaforma",
    priority: "HIGH",
    status: "DONE",
    sortOrder: 110,
  },

  // —— In corso
  {
    title: "Altri casi sul desktop simulato",
    description:
      "Solo software: servizio fermo, file hosts, coda di stampa, aggiornamento bloccato. Stesso PC, nuovi ticket.",
    category: "Mini-game",
    priority: "HIGH",
    status: "IN_PROGRESS",
    sortOrder: 10,
  },
  {
    title: "Report desktop visibile al docente",
    description: "Il docente legge cosa ha scritto lo studente e il voto automatico, e può aggiungere un commento.",
    category: "Valutazione",
    priority: "HIGH",
    status: "IN_PROGRESS",
    sortOrder: 20,
  },

  // —— In piano
  {
    title: "Import roster CSV / Google Classroom",
    description: "File CSV e corso Classroom. L’elenco incollato a mano c’è già.",
    category: "Docente",
    priority: "HIGH",
    status: "PLANNED",
    sortOrder: 10,
  },
  {
    title: "Lab topologia di rete (VirtLab)",
    description: "Mappa switch/router/firewall collegata al repo VirtLab, come attività sulla board.",
    category: "Mini-game",
    priority: "HIGH",
    status: "PLANNED",
    sortOrder: 20,
  },
  {
    title: "Export voti CSV",
    description: "Scarica voti, XP e consegne della classe per il registro.",
    category: "Docente",
    priority: "MEDIUM",
    status: "PLANNED",
    sortOrder: 30,
  },
  {
    title: "Badge competenze",
    description: "Reti, sistemi, sicurezza e hardware sbloccati con soglie di XP e voti.",
    category: "Gamification",
    priority: "MEDIUM",
    status: "PLANNED",
    sortOrder: 40,
  },
  {
    title: "Email scadenze nel dominio scuola",
    description: "Avviso email già predisposto e spento, finché non c’è una casella interna al dominio.",
    category: "Docente",
    priority: "LOW",
    status: "PLANNED",
    sortOrder: 50,
  },

  // —— Idee fattibili
  {
    title: "Casi desktop creati dal docente",
    description: "Il docente scrive sintomi, comandi attesi e parole del report. Lo studente li risolve sul PC simulato.",
    category: "Didattica",
    priority: "HIGH",
    status: "IDEA",
    sortOrder: 10,
  },
  {
    title: "Peer review tra studenti",
    description: "Uno studente commenta la diagnosi di un altro con una rubrica. Poi conferma il docente.",
    category: "Valutazione",
    priority: "MEDIUM",
    status: "IDEA",
    sortOrder: 20,
  },
  {
    title: "Runbook builder",
    description: "Lo studente salva la procedura a step. Il docente può marcarla come procedura buona.",
    category: "Didattica",
    priority: "MEDIUM",
    status: "IDEA",
    sortOrder: 30,
  },
  {
    title: "Replay timeline ticket",
    description: "Cronologia unica: apertura, chat, cambi colonna, chiusura.",
    category: "Docente",
    priority: "MEDIUM",
    status: "IDEA",
    sortOrder: 40,
  },
  {
    title: "Rubrica di correzione editabile",
    description: "Il docente sceglie i criteri (causa, verifica, lessico) invece del voto secco.",
    category: "Valutazione",
    priority: "MEDIUM",
    status: "IDEA",
    sortOrder: 50,
  },
  {
    title: "Scheda intervento stampabile",
    description: "PDF o stampa con problema, passi e voto, da allegare al registro.",
    category: "Docente",
    priority: "LOW",
    status: "IDEA",
    sortOrder: 60,
  },
  {
    title: "Allegati immagine sul ticket",
    description: "Screenshot caricati dal docente, non solo log di testo finti.",
    category: "Docente",
    priority: "MEDIUM",
    status: "IDEA",
    sortOrder: 70,
  },
  {
    title: "Linux: servizi e journal",
    description: "systemctl e journalctl simulati per un servizio che non parte.",
    category: "Mini-game",
    priority: "MEDIUM",
    status: "IDEA",
    sortOrder: 80,
  },
  {
    title: "Modalità esame a tempo",
    description: "Timer, niente chat AI, scheda finale. Non prioritaria.",
    category: "Valutazione",
    priority: "LOW",
    status: "IDEA",
    sortOrder: 90,
  },
];
