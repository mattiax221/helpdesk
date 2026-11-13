import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/api";

const createSchema = z.object({
  classroomId: z.string().min(1),
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.enum([
    "HARDWARE",
    "RETI_DNS",
    "SISTEMI_OPERATIVI",
    "SOFTWARE_OFFICE",
    "SICUREZZA",
  ]),
  priority: z.enum(["BASSA", "MEDIA", "ALTA", "CRITICA"]),
  difficulty: z.enum(["BASE", "INTERMEDIO", "AVANZATO"]).default("INTERMEDIO"),
  slaMinutes: z.number().int().positive().default(60),
  fakeLogs: z
    .array(z.object({ name: z.string(), content: z.string() }))
    .default([]),
  attachmentsMeta: z
    .array(z.object({ name: z.string(), type: z.string().optional() }))
    .default([]),
  secretNotes: z.string().min(5),
  clientHints: z.array(z.string()).default([]),
  assignTo: z.enum(["all", "selected"]).default("all"),
  studentIds: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const { user, error } = await requireApiUser("TEACHER");
  if (error || !user) return error!;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Dati ticket non validi");
  }

  const data = parsed.data;
  const classroom = await prisma.classroom.findUnique({
    where: { id: data.classroomId },
    include: {
      memberships: {
        include: { user: true },
      },
    },
  });
  if (!classroom || classroom.ownerId !== user.id) {
    return jsonError("Classe non trovata", 404);
  }

  let assigneeIds: string[] = [];
  if (data.assignTo === "all") {
    assigneeIds = classroom.memberships
      .filter((m) => m.user.role === "STUDENT")
      .map((m) => m.userId);
  } else {
    assigneeIds = data.studentIds || [];
  }

  if (!assigneeIds.length) {
    return jsonError("Nessuno studente da assegnare");
  }

  const ticket = await prisma.ticket.create({
    data: {
      classroomId: data.classroomId,
      createdById: user.id,
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      difficulty: data.difficulty,
      slaMinutes: data.slaMinutes,
      fakeLogs: JSON.stringify(data.fakeLogs),
      attachmentsMeta: JSON.stringify(data.attachmentsMeta),
      secretNotes: data.secretNotes,
      clientHints: JSON.stringify(data.clientHints),
      assignments: {
        create: assigneeIds.map((assigneeId) => ({ assigneeId })),
      },
    },
    include: {
      assignments: true,
    },
  });

  return NextResponse.json({ ticket }, { status: 201 });
}
