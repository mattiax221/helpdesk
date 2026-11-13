import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/api";

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
          include: {
            classroom: { select: { id: true, name: true, code: true } },
          },
        },
        evaluation: true,
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ assignments });
  }

  const assignments = await prisma.ticketAssignment.findMany({
    where: {
      ticket: {
        createdById: user.id,
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
