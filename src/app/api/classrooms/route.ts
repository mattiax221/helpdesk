import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/api";
import { generateClassroomCode } from "@/lib/classroom-code";

const createSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
});

export async function GET() {
  const { user, error } = await requireApiUser();
  if (error || !user) return error!;

  if (user.role === "TEACHER") {
    const classrooms = await prisma.classroom.findMany({
      where: { ownerId: user.id },
      include: {
        _count: { select: { memberships: true, tickets: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ classrooms });
  }

  const memberships = await prisma.classroomMembership.findMany({
    where: { userId: user.id },
    include: {
      classroom: {
        include: {
          _count: { select: { memberships: true, tickets: true } },
        },
      },
    },
  });
  return NextResponse.json({
    classrooms: memberships.map((m) => m.classroom),
  });
}

export async function POST(req: Request) {
  const { user, error } = await requireApiUser("TEACHER");
  if (error || !user) return error!;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError("Dati classe non validi");

  let code = generateClassroomCode();
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.classroom.findUnique({ where: { code } });
    if (!exists) break;
    code = generateClassroomCode();
  }

  const classroom = await prisma.classroom.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      code,
      ownerId: user.id,
      memberships: { create: { userId: user.id } },
    },
  });

  return NextResponse.json({ classroom }, { status: 201 });
}
