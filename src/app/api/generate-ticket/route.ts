import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser, jsonError } from "@/lib/api";
import { generateTicketContent } from "@/lib/ai";

const schema = z.object({
  category: z
    .enum([
      "HARDWARE",
      "RETI_DNS",
      "SISTEMI_OPERATIVI",
      "SOFTWARE_OFFICE",
      "SICUREZZA",
    ])
    .optional(),
  difficulty: z.enum(["BASE", "INTERMEDIO", "AVANZATO"]).optional(),
  theme: z.string().optional(),
  scenarioId: z.number().int().min(0).optional(),
});

export async function POST(req: Request) {
  const { user, error } = await requireApiUser("TEACHER");
  if (error || !user) return error!;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body ?? {});
  if (!parsed.success) return jsonError("Parametri non validi");

  if (typeof parsed.data.scenarioId === "number") {
    const { TICKET_SCENARIOS } = await import("@/lib/ticket-scenarios");
    const ticket = TICKET_SCENARIOS[parsed.data.scenarioId];
    if (!ticket) return jsonError("Scenario non trovato", 404);
    return NextResponse.json({
      ticket: {
        ...ticket,
        fakeLogs: ticket.fakeLogs.map((l) => ({ ...l })),
        clientHints: [...ticket.clientHints],
      },
      source: "catalog",
      bankSize: TICKET_SCENARIOS.length,
    });
  }

  const result = await generateTicketContent(parsed.data);
  return NextResponse.json(result);
}
