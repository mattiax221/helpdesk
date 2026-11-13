import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/api";

const schema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
});

/** Teacher adds a student to the class roster (required before class-code login). */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireApiUser("TEACHER");
  if (error || !user) return error!;
  const { id } = await params;

  const classroom = await prisma.classroom.findUnique({ where: { id } });
  if (!classroom || classroom.ownerId !== user.id) {
    return jsonError("Classe non trovata", 404);
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Nome/cognome non validi");

  const firstName = parsed.data.firstName.trim();
  const lastName = parsed.data.lastName.trim();
  const displayName = `${firstName} ${lastName}`;

  const existing = await prisma.user.findFirst({
    where: {
      firstName: { equals: firstName },
      lastName: { equals: lastName },
      memberships: { some: { classroomId: classroom.id } },
    },
  });
  if (existing) {
    return NextResponse.json({ user: existing, alreadyMember: true });
  }

  const student = await prisma.user.create({
    data: {
      firstName,
      lastName,
      name: displayName,
      role: "STUDENT",
      memberships: { create: { classroomId: classroom.id } },
    },
  });

  return NextResponse.json({ user: student }, { status: 201 });
}
