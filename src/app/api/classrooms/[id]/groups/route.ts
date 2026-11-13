import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/api";

const createSchema = z.object({
  name: z.string().min(2).max(80),
  studentIds: z.array(z.string()).min(1),
});

async function assertOwner(classroomId: string, userId: string) {
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    include: {
      memberships: { include: { user: { select: { id: true, role: true } } } },
    },
  });
  if (!classroom || classroom.ownerId !== userId) return null;
  return classroom;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireApiUser();
  if (error || !user) return error!;
  const { id } = await params;

  const classroom = await prisma.classroom.findUnique({
    where: { id },
    include: { memberships: true },
  });
  if (!classroom) return jsonError("Classe non trovata", 404);

  const allowed =
    classroom.ownerId === user.id ||
    classroom.memberships.some((m) => m.userId === user.id);
  if (!allowed) return jsonError("Permesso negato", 403);

  const groups = await prisma.studentGroup.findMany({
    where: { classroomId: id },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, firstName: true, lastName: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ groups });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireApiUser("TEACHER");
  if (error || !user) return error!;
  const { id } = await params;

  const classroom = await assertOwner(id, user.id);
  if (!classroom) return jsonError("Classe non trovata", 404);

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError("Dati gruppo non validi");

  const studentIds = [...new Set(parsed.data.studentIds)];
  const validIds = new Set(
    classroom.memberships.filter((m) => m.user.role === "STUDENT").map((m) => m.userId),
  );
  if (studentIds.some((sid) => !validIds.has(sid))) {
    return jsonError("Uno o più studenti non appartengono alla classe");
  }

  try {
    const group = await prisma.studentGroup.create({
      data: {
        classroomId: id,
        name: parsed.data.name.trim(),
        members: {
          create: studentIds.map((userId) => ({ userId })),
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, firstName: true, lastName: true } },
          },
        },
      },
    });
    return NextResponse.json({ group }, { status: 201 });
  } catch {
    return jsonError("Nome gruppo già esistente in questa classe");
  }
}
