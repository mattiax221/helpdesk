import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/api";

const patchSchema = z.object({
  status: z.enum(["ASSIGNED", "IN_PROGRESS"]),
});

const noteSchema = z.object({
  teacherNote: z.string().max(2000),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireApiUser();
  if (error || !user) return error!;
  const { id } = await params;

  const submission = await prisma.labTaskSubmission.findUnique({
    where: { id },
    include: { task: { include: { classroom: true } } },
  });
  if (!submission) return jsonError("Attività non trovata", 404);

  const isStudent = submission.userId === user.id;
  const isTeacher = submission.task.classroom.ownerId === user.id;
  if (!isStudent && !isTeacher) return jsonError("Permesso negato", 403);

  const body = await req.json().catch(() => null);
  if (body && typeof body === "object" && "teacherNote" in body) {
    if (!isTeacher) return jsonError("Solo il docente può commentare", 403);
    const note = noteSchema.safeParse(body);
    if (!note.success) return jsonError("Commento troppo lungo");
    const updated = await prisma.labTaskSubmission.update({
      where: { id },
      data: { teacherNote: note.data.teacherNote.trim() },
    });
    return NextResponse.json({ submission: updated });
  }

  if (submission.status === "COMPLETED") {
    return jsonError("Attività già chiusa");
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Stato non valido");

  const updated = await prisma.labTaskSubmission.update({
    where: { id },
    data: { status: parsed.data.status },
  });
  return NextResponse.json({ submission: updated });
}
