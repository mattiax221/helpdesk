import { prisma } from "@/lib/prisma";
import { getIncidentChain, getNextChainStep } from "@/lib/incident-chains";

export type SpawnChainResult =
  | { spawned: false; reason: string }
  | {
      spawned: true;
      childTicketId: string;
      childAssignmentId: string;
      title: string;
      nodeLabel: string;
    };

/**
 * Se il voto è sotto soglia e esiste un passo successivo nella catena,
 * crea un nuovo ticket assegnato allo stesso studente (una sola volta).
 */
export async function maybeSpawnChainTicket(opts: {
  parentTicketId: string;
  assigneeId: string;
  teacherId: string;
  grade: number;
  force?: boolean;
}): Promise<SpawnChainResult> {
  const parent = await prisma.ticket.findUnique({
    where: { id: opts.parentTicketId },
    include: {
      children: {
        where: { chainStep: { gt: 0 } },
        include: { assignments: { where: { assigneeId: opts.assigneeId } } },
      },
    },
  });
  if (!parent?.chainKey) {
    return { spawned: false, reason: "Ticket senza catena" };
  }

  const chain = getIncidentChain(parent.chainKey);
  if (!chain) return { spawned: false, reason: "Catena sconosciuta" };

  const next = getNextChainStep(parent.chainKey, parent.chainStep);
  if (!next) return { spawned: false, reason: "Fine catena" };

  if (!opts.force && opts.grade > chain.spawnOnMaxGrade) {
    return {
      spawned: false,
      reason: `Voto ${opts.grade} sopra soglia ${chain.spawnOnMaxGrade}`,
    };
  }

  const already = parent.children.some((c) =>
    c.assignments.some((a) => a.assigneeId === opts.assigneeId),
  );
  if (already) {
    return { spawned: false, reason: "Incidente correlato già generato per questo studente" };
  }

  const child = await prisma.ticket.create({
    data: {
      classroomId: parent.classroomId,
      createdById: opts.teacherId,
      title: next.title,
      description: next.description,
      category: next.category,
      priority: next.priority,
      difficulty: next.difficulty,
      slaMinutes: next.slaMinutes,
      fakeLogs: JSON.stringify(next.fakeLogs),
      attachmentsMeta: "[]",
      secretNotes: next.secretNotes,
      clientHints: JSON.stringify(next.clientHints),
      chainKey: parent.chainKey,
      chainStep: parent.chainStep + 1,
      parentTicketId: parent.id,
      assignments: {
        create: [{ assigneeId: opts.assigneeId }],
      },
    },
    include: { assignments: true },
  });

  const childAssignment = child.assignments[0];

  await prisma.ticketComment.create({
    data: {
      assignmentId: childAssignment.id,
      authorType: "SYSTEM",
      body: `Incidente correlato alla catena «${chain.name}» (passo ${parent.chainStep + 2}/${chain.steps.length}). Origine: «${parent.title}». Un intervento incompleto a monte ha generato questo nuovo sintomo.`,
    },
  });

  // Nota sul ticket padre (tutti gli assignment dello stesso studente)
  const parentAssignment = await prisma.ticketAssignment.findFirst({
    where: { ticketId: parent.id, assigneeId: opts.assigneeId },
  });
  if (parentAssignment) {
    await prisma.ticketComment.create({
      data: {
        assignmentId: parentAssignment.id,
        authorType: "SYSTEM",
        body: `⚠️ Nuovo incidente in catena: «${child.title}» (${next.nodeLabel}). Il fix non ha tenuto: il problema si è spostato a valle.`,
      },
    });
  }

  return {
    spawned: true,
    childTicketId: child.id,
    childAssignmentId: childAssignment.id,
    title: child.title,
    nodeLabel: next.nodeLabel,
  };
}
