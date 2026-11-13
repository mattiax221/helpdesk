import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/api";

const patchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  studentIds: z.array(z.string()).min(1).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; groupId: string }> },
) {
  const { user, error } = await requireApiUser("TEACHER");
  if (error || !user) return error!;
  const { id, groupId } = await params;

  const classroom = await prisma.classroom.findUnique({
    where: { id },
    include: {
      memberships: { include: { user: { select: { id: true, role: true } } } },
    },
  });
  if (!classroom || classroom.ownerId !== user.id) {
    return jsonError("Classe non trovata", 404);
  }

  const group = await prisma.studentGroup.findFirst({
    where: { id: groupId, classroomId: id },
  });
  if (!group) return jsonError("Gruppo non trovato", 404);

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Dati non validi");

  if (parsed.data.studentIds) {
    const validIds = new Set(
      classroom.memberships.filter((m) => m.user.role === "STUDENT").map((m) => m.userId),
    );
    const studentIds = [...new Set(parsed.data.studentIds)];
    if (studentIds.some((sid) => !validIds.has(sid))) {
      return jsonError("Uno o più studenti non appartengono alla classe");
    }
    await prisma.$transaction([
      prisma.studentGroupMember.deleteMany({ where: { groupId } }),
      prisma.studentGroupMember.createMany({
        data: studentIds.map((userId) => ({ groupId, userId })),
      }),
      ...(parsed.data.name
        ? [
            prisma.studentGroup.update({
              where: { id: groupId },
              data: { name: parsed.data.name.trim() },
            }),
          ]
        : []),
    ]);
  } else if (parsed.data.name) {
    await prisma.studentGroup.update({
      where: { id: groupId },
      data: { name: parsed.data.name.trim() },
    });
  }

  const updated = await prisma.studentGroup.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  return NextResponse.json({ group: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; groupId: string }> },
) {
  const { user, error } = await requireApiUser("TEACHER");
  if (error || !user) return error!;
  const { id, groupId } = await params;

  const classroom = await prisma.classroom.findUnique({ where: { id } });
  if (!classroom || classroom.ownerId !== user.id) {
    return jsonError("Classe non trovata", 404);
  }

  const group = await prisma.studentGroup.findFirst({
    where: { id: groupId, classroomId: id },
  });
  if (!group) return jsonError("Gruppo non trovato", 404);

  await prisma.studentGroup.delete({ where: { id: groupId } });
  return NextResponse.json({ ok: true });
}
