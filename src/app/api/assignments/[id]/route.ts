import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/api";
import type { TicketStatus } from "@prisma/client";

const patchSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "WAITING_REVIEW", "RESOLVED"]).optional(),
  rootCause: z.string().optional(),
  resolutionSteps: z.string().optional(),
  finalTest: z.string().optional(),
});

async function getAssignmentForUser(id: string, userId: string, role: string) {
  const assignment = await prisma.ticketAssignment.findUnique({
    where: { id },
    include: {
      ticket: {
        include: {
          classroom: true,
          createdBy: { select: { id: true, name: true } },
        },
      },
      assignee: {
        select: { id: true, name: true, firstName: true, lastName: true, xp: true },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true } },
        },
      },
      evaluation: true,
    },
  });
  if (!assignment) return null;

  const isAssignee = assignment.assigneeId === userId;
  const isTeacher = assignment.ticket.createdById === userId || role === "TEACHER";
  if (!isAssignee && !isTeacher) return null;
  return { assignment, isAssignee, isTeacher };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireApiUser();
  if (error || !user) return error!;
  const { id } = await params;

  const result = await getAssignmentForUser(id, user.id, user.role);
  if (!result) return jsonError("Assignment non trovato", 404);

  const { assignment, isTeacher } = result;
  const payload = {
    ...assignment,
    ticket: {
      ...assignment.ticket,
      secretNotes: isTeacher ? assignment.ticket.secretNotes : undefined,
      clientHints: isTeacher
        ? assignment.ticket.clientHints
        : undefined,
    },
  };

  return NextResponse.json({ assignment: payload, canSeeSecrets: isTeacher });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireApiUser();
  if (error || !user) return error!;
  const { id } = await params;

  const result = await getAssignmentForUser(id, user.id, user.role);
  if (!result) return jsonError("Assignment non trovato", 404);
  const { assignment, isAssignee, isTeacher } = result;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Dati non validi");

  if (!isAssignee && !isTeacher) return jsonError("Permesso negato", 403);

  const data = parsed.data;
  const updates: {
    status?: TicketStatus;
    rootCause?: string;
    resolutionSteps?: string;
    finalTest?: string;
    startedAt?: Date;
    submittedAt?: Date;
    resolvedAt?: Date;
  } = {};

  if (data.rootCause !== undefined) updates.rootCause = data.rootCause;
  if (data.resolutionSteps !== undefined) updates.resolutionSteps = data.resolutionSteps;
  if (data.finalTest !== undefined) updates.finalTest = data.finalTest;

  if (data.status) {
    if (data.status === "WAITING_REVIEW" || data.status === "RESOLVED") {
      const rootCause = data.rootCause ?? assignment.rootCause;
      const resolutionSteps = data.resolutionSteps ?? assignment.resolutionSteps;
      const finalTest = data.finalTest ?? assignment.finalTest;
      if (!rootCause?.trim() || !resolutionSteps?.trim() || !finalTest?.trim()) {
        return jsonError(
          "Per chiudere il ticket compila Causa Root, Procedura e Esito Test Finale",
        );
      }
      updates.submittedAt = new Date();
      if (data.status === "RESOLVED") updates.resolvedAt = new Date();
    }
    if (data.status === "IN_PROGRESS" && !assignment.startedAt) {
      updates.startedAt = new Date();
    }
    updates.status = data.status;
  }

  const updated = await prisma.ticketAssignment.update({
    where: { id },
    data: updates,
    include: {
      ticket: true,
      evaluation: true,
      comments: true,
    },
  });

  return NextResponse.json({ assignment: updated });
}
