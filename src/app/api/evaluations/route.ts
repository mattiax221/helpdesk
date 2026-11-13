import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/api";

const schema = z.object({
  assignmentId: z.string().min(1),
  grade: z.number().int().min(1).max(10),
  xpAwarded: z.number().int().min(0).max(500).default(50),
  feedback: z.string().min(3),
});

export async function POST(req: Request) {
  const { user, error } = await requireApiUser("TEACHER");
  if (error || !user) return error!;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Dati valutazione non validi");

  const assignment = await prisma.ticketAssignment.findUnique({
    where: { id: parsed.data.assignmentId },
    include: { ticket: true, evaluation: true, assignee: true },
  });
  if (!assignment || assignment.ticket.createdById !== user.id) {
    return jsonError("Assignment non trovato", 404);
  }
  if (
    assignment.status !== "WAITING_REVIEW" &&
    assignment.status !== "RESOLVED"
  ) {
    return jsonError("Lo studente deve prima inviare il ticket in verifica");
  }

  const evaluation = await prisma.evaluation.upsert({
    where: { assignmentId: assignment.id },
    update: {
      grade: parsed.data.grade,
      xpAwarded: parsed.data.xpAwarded,
      feedback: parsed.data.feedback,
      teacherId: user.id,
    },
    create: {
      assignmentId: assignment.id,
      teacherId: user.id,
      grade: parsed.data.grade,
      xpAwarded: parsed.data.xpAwarded,
      feedback: parsed.data.feedback,
    },
  });

  const previousXp = assignment.evaluation?.xpAwarded ?? 0;
  const delta = parsed.data.xpAwarded - previousXp;

  await prisma.$transaction([
    prisma.ticketAssignment.update({
      where: { id: assignment.id },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
      },
    }),
    prisma.user.update({
      where: { id: assignment.assigneeId },
      data: { xp: { increment: delta } },
    }),
  ]);

  return NextResponse.json({ evaluation });
}
