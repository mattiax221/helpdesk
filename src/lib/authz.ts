import { prisma } from "@/lib/prisma";

/** Teacher access only if they own the classroom or created the ticket. */
export async function canManageAssignment(userId: string, assignmentId: string) {
  const assignment = await prisma.ticketAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      ticket: {
        include: { classroom: true },
      },
    },
  });
  if (!assignment) return null;

  const isAssignee = assignment.assigneeId === userId;
  const isOwnerTeacher =
    assignment.ticket.createdById === userId ||
    assignment.ticket.classroom.ownerId === userId;

  if (!isAssignee && !isOwnerTeacher) return null;
  return { assignment, isAssignee, isOwnerTeacher };
}

export function teacherEmailAllowlist(): Set<string> {
  const raw = process.env.TEACHER_EMAIL_ALLOWLIST || "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}
