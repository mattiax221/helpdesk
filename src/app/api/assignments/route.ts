import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/api";
import { redactAssignmentTree } from "@/lib/ticket-privacy";

export async function GET(req: Request) {
  const { user, error } = await requireApiUser();
  if (error || !user) return error!;

  const { searchParams } = new URL(req.url);
  const classroomId = searchParams.get("classroomId");

  if (user.role === "STUDENT") {
    const assignments = await prisma.ticketAssignment.findMany({
      where: {
        assigneeId: user.id,
        ...(classroomId ? { ticket: { classroomId } } : {}),
      },
      include: {
        ticket: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            priority: true,
            difficulty: true,
            slaMinutes: true,
            fakeLogs: true,
            attachmentsMeta: true,
            classroomId: true,
            createdAt: true,
            updatedAt: true,
            classroom: { select: { id: true, name: true, code: true } },
          },
        },
        evaluation: true,
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({
      assignments: assignments.map((a) => redactAssignmentTree(a, false)),
    });
  }

  const assignments = await prisma.ticketAssignment.findMany({
    where: {
      ticket: {
        OR: [{ createdById: user.id }, { classroom: { ownerId: user.id } }],
        ...(classroomId ? { classroomId } : {}),
      },
    },
    include: {
      ticket: true,
      assignee: {
        select: { id: true, name: true, firstName: true, lastName: true, email: true },
      },
      evaluation: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ assignments });
}
