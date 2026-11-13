import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { TicketDetail } from "@/components/ticket/ticket-detail";

export default async function StudentTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("STUDENT");
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const assignment = await prisma.ticketAssignment.findUnique({
    where: { id },
    include: {
      ticket: {
        include: {
          parent: true,
          children: true,
        },
      },
      evaluation: true,
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });

  if (!assignment || assignment.assigneeId !== session.user.id) notFound();

  const chainKey = assignment.ticket.chainKey;
  let chainNodes: {
    ticketId: string;
    title: string;
    chainStep: number;
    assignmentId?: string | null;
    current?: boolean;
  }[] = [];

  if (chainKey) {
    const rootId = assignment.ticket.parentTicketId || assignment.ticketId;
    const chainTickets = await prisma.ticket.findMany({
      where: {
        chainKey,
        OR: [{ id: rootId }, { parentTicketId: rootId }],
      },
      include: {
        assignments: {
          where: { assigneeId: session.user.id },
          select: { id: true },
        },
      },
      orderBy: { chainStep: "asc" },
    });

    chainNodes = chainTickets.map((t) => ({
      ticketId: t.id,
      title: t.title,
      chainStep: t.chainStep,
      assignmentId: t.assignments[0]?.id ?? null,
      current: t.id === assignment.ticketId,
    }));
  }

  const safeAssignment = {
    id: assignment.id,
    status: assignment.status,
    rootCause: assignment.rootCause,
    resolutionSteps: assignment.resolutionSteps,
    finalTest: assignment.finalTest,
    startedAt: assignment.startedAt,
    evaluation: assignment.evaluation
      ? {
          grade: assignment.evaluation.grade,
          feedback: assignment.evaluation.feedback,
          xpAwarded: assignment.evaluation.xpAwarded,
        }
      : null,
    comments: assignment.comments,
    ticket: {
      title: assignment.ticket.title,
      description: assignment.ticket.description,
      category: assignment.ticket.category,
      priority: assignment.ticket.priority,
      slaMinutes: assignment.ticket.slaMinutes,
      fakeLogs: assignment.ticket.fakeLogs,
      attachmentsMeta: assignment.ticket.attachmentsMeta,
      chainKey: assignment.ticket.chainKey,
      chainStep: assignment.ticket.chainStep,
    },
    chainNodes,
  };

  return (
    <AppShell role="STUDENT" userName={session.user.name || "Studente"} xp={user?.xp ?? 0}>
      <TicketDetail assignment={safeAssignment} />
    </AppShell>
  );
}
