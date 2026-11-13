import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/api";
import { redactTicketForViewer } from "@/lib/ticket-privacy";

const patchSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  googleCourseId: z.string().nullable().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireApiUser();
  if (error || !user) return error!;
  const { id } = await params;

  const classroom = await prisma.classroom.findUnique({
    where: { id },
    include: {
      memberships: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              xp: true,
            },
          },
        },
      },
      tickets: {
        include: {
          _count: { select: { assignments: true } },
          assignments: {
            include: {
              assignee: { select: { id: true, name: true } },
              evaluation: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!classroom) return jsonError("Classe non trovata", 404);

  const isOwner = classroom.ownerId === user.id;
  const isMember = classroom.memberships.some((m) => m.userId === user.id);
  if (!isOwner && !isMember) return jsonError("Permesso negato", 403);

  const tickets = classroom.tickets.map((ticket) =>
    redactTicketForViewer(ticket, isOwner),
  );

  return NextResponse.json({
    classroom: {
      ...classroom,
      tickets,
    },
  });
}

export async function PATCH(
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
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Dati non validi");

  const updated = await prisma.classroom.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ classroom: updated });
}
