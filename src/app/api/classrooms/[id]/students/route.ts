import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/api";

const singleSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
});

const bulkSchema = z.object({
  lines: z.string().min(3),
});

async function addStudent(
  classroomId: string,
  firstName: string,
  lastName: string,
) {
  const existing = await prisma.user.findFirst({
    where: {
      firstName: { equals: firstName },
      lastName: { equals: lastName },
      memberships: { some: { classroomId } },
    },
  });
  if (existing) return { user: existing, alreadyMember: true as const };

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      role: "STUDENT",
      memberships: { create: { classroomId } },
    },
  });
  return { user, alreadyMember: false as const };
}

/** Teacher adds students to the class roster (required before class-code login). */
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

  if (body?.lines) {
    const parsed = bulkSchema.safeParse(body);
    if (!parsed.success) return jsonError("Elenco non valido");
    const rows = parsed.data.lines
      .split("\n")
      .map((l: string) => l.trim())
      .filter(Boolean)
      .map((line: string) => {
        const parts = line.split(/[,\s]+/).filter(Boolean);
        if (parts.length < 2) return null;
        return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
      })
      .filter(Boolean) as { firstName: string; lastName: string }[];

    const results = [];
    for (const row of rows) {
      results.push(await addStudent(classroom.id, row.firstName, row.lastName));
    }
    return NextResponse.json({
      added: results.filter((r) => !r.alreadyMember).length,
      skipped: results.filter((r) => r.alreadyMember).length,
      results,
    });
  }

  const parsed = singleSchema.safeParse(body);
  if (!parsed.success) return jsonError("Nome/cognome non validi");
  const result = await addStudent(
    classroom.id,
    parsed.data.firstName.trim(),
    parsed.data.lastName.trim(),
  );
  return NextResponse.json(result, { status: result.alreadyMember ? 200 : 201 });
}
