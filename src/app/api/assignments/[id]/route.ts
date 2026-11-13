import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/api";
import { canManageAssignment } from "@/lib/authz";
import { redactAssignmentTree } from "@/lib/ticket-privacy";
import type { TicketStatus } from "@prisma/client";

const patchSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "WAITING_REVIEW", "RESOLVED"]).optional(),
  rootCause: z.string().optional(),
  resolutionSteps: z.string().optional(),
  finalTest: z.string().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireApiUser();
  if (error || !user) return error!;
  const { id } = await params;

  const result = await canManageAssignment(user.id, id);
  if (!result) return jsonError("Assignment non trovato", 404);

  const { isOwnerTeacher } = result;

  const full = await prisma.ticketAssignment.findUnique({
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
        include: { author: { select: { id: true, name: true } } },
      },
      evaluation: true,
    },
  });
  if (!full) return jsonError("Assignment non trovato", 404);

  const payload = {
    ...full,
    ticket: {
      ...full.ticket,
      secretNotes: isOwnerTeacher ? full.ticket.secretNotes : undefined,
      clientHints: isOwnerTeacher ? full.ticket.clientHints : undefined,
    },
  };

  return NextResponse.json({ assignment: payload, canSeeSecrets: isOwnerTeacher });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireApiUser();
  if (error || !user) return error!;
  const { id } = await params;

  const result = await canManageAssignment(user.id, id);
  if (!result) return jsonError("Assignment non trovato", 404);
  const { assignment, isAssignee, isOwnerTeacher } = result;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Dati non validi");

  // Students may update their own work; owners may only adjust status for review flow.
  if (!isAssignee && !isOwnerTeacher) return jsonError("Permesso negato", 403);
  if (isOwnerTeacher && !isAssignee) {
    if (
      parsed.data.rootCause !== undefined ||
      parsed.data.resolutionSteps !== undefined ||
      parsed.data.finalTest !== undefined
    ) {
      return jsonError("Il docente non può modificare la diagnosi dello studente", 403);
    }
  }

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

  if (isAssignee) {
    if (data.rootCause !== undefined) updates.rootCause = data.rootCause;
    if (data.resolutionSteps !== undefined) updates.resolutionSteps = data.resolutionSteps;
    if (data.finalTest !== undefined) updates.finalTest = data.finalTest;
  }

  if (data.status) {
    if (isAssignee && (data.status === "WAITING_REVIEW" || data.status === "RESOLVED")) {
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
    if (data.status === "IN_PROGRESS" && !assignment.startedAt && isAssignee) {
      updates.startedAt = new Date();
    }
    // Teachers who own the class can move status for review; assignees can move their own.
    if (isAssignee || isOwnerTeacher) {
      updates.status = data.status;
    }
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

  return NextResponse.json({
    assignment: redactAssignmentTree(updated, isOwnerTeacher),
  });
}
