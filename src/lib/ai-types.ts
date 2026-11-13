import type { Difficulty, TicketCategory, TicketPriority } from "@prisma/client";

export type GeneratedTicket = {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  difficulty: Difficulty;
  slaMinutes: number;
  fakeLogs: { name: string; content: string }[];
  secretNotes: string;
  clientHints: string[];
};
