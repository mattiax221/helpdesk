import type {
  Difficulty,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@prisma/client";

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  HARDWARE: "Hardware",
  RETI_DNS: "Reti & DNS",
  SISTEMI_OPERATIVI: "Sistemi Operativi",
  SOFTWARE_OFFICE: "Software & Office",
  SICUREZZA: "Sicurezza",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  BASSA: "Bassa",
  MEDIA: "Media",
  ALTA: "Alta",
  CRITICA: "Critica / Bloccante",
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  TODO: "Da Fare",
  IN_PROGRESS: "In Lavorazione",
  WAITING_REVIEW: "In Attesa di Verifica",
  RESOLVED: "Risolti",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  BASE: "Base",
  INTERMEDIO: "Intermedio",
  AVANZATO: "Avanzato",
};

export const STATUS_ORDER: TicketStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "WAITING_REVIEW",
  "RESOLVED",
];

export const PRIORITY_COLORS: Record<TicketPriority, string> = {
  BASSA: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  MEDIA: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  ALTA: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  CRITICA: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300",
};
