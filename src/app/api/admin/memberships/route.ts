import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, requireApiUser } from "@/lib/api";

const bodySchema = z.object({
  userId: z.string().min(1),
  classroomId: z.string().min(1),
});

export async function POST(req: Request) {
  const { error } = await requireApiUser("ADMIN");
  if (error) return error;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Dati non validi");

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user) return jsonError("Utente non trovato", 404);
  if (user.role !== "STUDENT") return jsonError("Solo gli studenti vanno nel roster");

  await prisma.classroomMembership.upsert({
    where: {
      classroomId_userId: {
        classroomId: parsed.data.classroomId,
        userId: parsed.data.userId,
      },
    },
    create: parsed.data,
    update: {},
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { error } = await requireApiUser("ADMIN");
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const parsed = bodySchema.safeParse({
    userId: searchParams.get("userId"),
    classroomId: searchParams.get("classroomId"),
  });
  if (!parsed.success) return jsonError("Dati non validi");

  await prisma.classroomMembership.deleteMany({ where: parsed.data });
  return NextResponse.json({ ok: true });
}
