import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/api";
import { getIncidentChain } from "@/lib/incident-chains";

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
  chainKey: z.string().min(1).optional().nullable(),
  assignTo: z.enum(["all", "selected", "group"]).default("all"),
  studentIds: z.array(z.string()).optional(),
  groupId: z.string().optional(),
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

  const validStudentIds = new Set(
    classroom.memberships.filter((m) => m.user.role === "STUDENT").map((m) => m.userId),
  );

  let assigneeIds: string[] = [];
  if (data.assignTo === "all") {
    assigneeIds = [...validStudentIds];
  } else if (data.assignTo === "group") {
    if (!data.groupId) return jsonError("Seleziona un gruppo");
    const group = await prisma.studentGroup.findFirst({
      where: { id: data.groupId, classroomId: classroom.id },
      include: { members: true },
    });
    if (!group) return jsonError("Gruppo non trovato", 404);
    assigneeIds = group.members.map((m) => m.userId);
  } else {
    assigneeIds = [...new Set(data.studentIds || [])];
    if (assigneeIds.some((id) => !validStudentIds.has(id))) {
      return jsonError("Uno o più studenti non appartengono alla classe");
    }
  }

  if (!assigneeIds.length) {
    return jsonError("Nessuno studente da assegnare");
  }

  const chainKey = data.chainKey || null;
  if (chainKey && !getIncidentChain(chainKey)) {
    return jsonError("Catena incidente non valida");
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
      chainKey,
      chainStep: 0,
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
