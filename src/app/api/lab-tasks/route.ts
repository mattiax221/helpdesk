import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/api";
import { getLabGame, LAB_GAME_KEYS } from "@/lib/lab-catalog";
import { hasRole } from "@/lib/roles";

const createSchema = z.object({
  classroomId: z.string().min(1),
  gameKey: z.enum(LAB_GAME_KEYS),
  title: z.string().min(3).optional(),
  instructions: z.string().optional(),
  minScore: z.number().int().min(10).max(100).optional(),
  // ISO o datetime-local ("2026-11-13T22:00")
  dueAt: z.string().min(1).optional().nullable(),
  assignTo: z.enum(["all", "selected", "group"]).default("all"),
  studentIds: z.array(z.string()).optional(),
  groupId: z.string().optional(),
});

export async function GET() {
  const { user, error } = await requireApiUser();
  if (error || !user) return error!;

  if (hasRole(user.role, "TEACHER")) {
    const tasks = await prisma.labTask.findMany({
      where: { createdById: user.id },
      include: {
        classroom: { select: { id: true, name: true, code: true } },
        submissions: {
          include: { user: { select: { id: true, name: true } } },
        },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ tasks });
  }

  const memberships = await prisma.classroomMembership.findMany({
    where: { userId: user.id },
    select: { classroomId: true },
  });
  const classroomIds = memberships.map((m) => m.classroomId);
  const tasks = await prisma.labTask.findMany({
    where: { classroomId: { in: classroomIds } },
    include: {
      classroom: { select: { id: true, name: true, code: true } },
      submissions: { where: { userId: user.id } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const { user, error } = await requireApiUser("TEACHER");
  if (error || !user) return error!;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || "Dati non validi");

  const data = parsed.data;
  const game = getLabGame(data.gameKey);
  if (!game) return jsonError("Gioco non valido");

  const classroom = await prisma.classroom.findUnique({
    where: { id: data.classroomId },
    include: {
      memberships: { include: { user: true } },
    },
  });
  if (!classroom || classroom.ownerId !== user.id) {
    return jsonError("Classe non trovata", 404);
  }

  const students = classroom.memberships.filter((m) => m.user.role === "STUDENT");
  let assigneeIds: string[] = [];
  if (data.assignTo === "all") {
    assigneeIds = students.map((s) => s.userId);
  } else if (data.assignTo === "group") {
    if (!data.groupId) return jsonError("Seleziona un gruppo");
    const group = await prisma.studentGroup.findFirst({
      where: { id: data.groupId, classroomId: classroom.id },
      include: { members: true },
    });
    if (!group) return jsonError("Gruppo non trovato", 404);
    assigneeIds = group.members.map((m) => m.userId);
  } else {
    const valid = new Set(students.map((s) => s.userId));
    assigneeIds = [...new Set(data.studentIds || [])].filter((id) => valid.has(id));
  }

  if (!assigneeIds.length) return jsonError("Nessuno studente da assegnare");

  const task = await prisma.labTask.create({
    data: {
      classroomId: classroom.id,
      createdById: user.id,
      gameKey: data.gameKey,
      title: data.title || game.title,
      instructions: data.instructions || game.description,
      minScore: data.minScore ?? game.defaultMinScore,
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
      submissions: {
        create: assigneeIds.map((userId) => ({ userId, status: "ASSIGNED" })),
      },
    },
    include: {
      submissions: true,
      classroom: { select: { name: true, code: true } },
    },
  });

  return NextResponse.json({ task });
}
