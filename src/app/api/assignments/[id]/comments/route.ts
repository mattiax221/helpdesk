import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/api";
import { clientReplyForHint } from "@/lib/ai";

const schema = z.object({
  body: z.string().min(1).max(2000),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireApiUser();
  if (error || !user) return error!;
  const { id } = await params;

  const assignment = await prisma.ticketAssignment.findUnique({
    where: { id },
    include: { ticket: true },
  });
  if (!assignment) return jsonError("Assignment non trovato", 404);

  const isAssignee = assignment.assigneeId === user.id;
  const isTeacher = assignment.ticket.createdById === user.id;
  if (!isAssignee && !isTeacher) return jsonError("Permesso negato", 403);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Messaggio non valido");

  const studentComment = await prisma.ticketComment.create({
    data: {
      assignmentId: id,
      authorId: user.id,
      authorType: isTeacher ? "TEACHER" : "STUDENT",
      body: parsed.data.body,
    },
  });

  let clientComment = null;
  if (isAssignee) {
    let hints: string[] = [];
    try {
      hints = JSON.parse(assignment.ticket.clientHints || "[]") as string[];
    } catch {
      hints = [];
    }
    const reply = clientReplyForHint(hints, assignment.hintIndex, parsed.data.body);
    clientComment = await prisma.ticketComment.create({
      data: {
        assignmentId: id,
        authorType: "CLIENT",
        body: reply,
      },
    });
    await prisma.ticketAssignment.update({
      where: { id },
      data: { hintIndex: Math.min(assignment.hintIndex + 1, hints.length) },
    });
  }

  return NextResponse.json({ comments: [studentComment, clientComment].filter(Boolean) });
}
