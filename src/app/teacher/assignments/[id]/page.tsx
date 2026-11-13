import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EvaluationForm } from "@/components/teacher/evaluation-form";
import { IncidentChainBanner } from "@/components/ticket/incident-chain-banner";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/labels";
import { getIncidentChain, getNextChainStep } from "@/lib/incident-chains";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function TeacherAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("TEACHER");
  const { id } = await params;
  const assignment = await prisma.ticketAssignment.findUnique({
    where: { id },
    include: {
      ticket: true,
      assignee: true,
      evaluation: true,
      comments: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!assignment || assignment.ticket.createdById !== session.user.id) notFound();

  const chain = getIncidentChain(assignment.ticket.chainKey);
  const next = assignment.ticket.chainKey
    ? getNextChainStep(assignment.ticket.chainKey, assignment.ticket.chainStep)
    : null;

  let chainNodes: {
    ticketId: string;
    title: string;
    chainStep: number;
    assignmentId?: string | null;
  }[] = [];

  if (assignment.ticket.chainKey) {
    const rootId = assignment.ticket.parentTicketId || assignment.ticketId;
    const chainTickets = await prisma.ticket.findMany({
      where: {
        chainKey: assignment.ticket.chainKey,
        OR: [{ id: rootId }, { parentTicketId: rootId }],
      },
      include: {
        assignments: {
          where: { assigneeId: assignment.assigneeId },
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
    }));
  }

  return (
    <AppShell role="TEACHER" userName={session.user.name || "Docente"}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold">{assignment.ticket.title}</h1>
        <Badge>{STATUS_LABELS[assignment.status]}</Badge>
        <Badge variant="outline">{CATEGORY_LABELS[assignment.ticket.category]}</Badge>
        <Badge variant="outline">{PRIORITY_LABELS[assignment.ticket.priority]}</Badge>
        {chain && (
          <Badge variant="outline" className="border-teal-700/40">
            Catena · {chain.name}
          </Badge>
        )}
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Studente: {assignment.assignee.name}
      </p>

      {assignment.ticket.chainKey && (
        <IncidentChainBanner
          className="mb-6"
          chainKey={assignment.ticket.chainKey}
          chainStep={assignment.ticket.chainStep}
          nodes={chainNodes}
          hrefFor={(node) =>
            node.assignmentId ? `/teacher/assignments/${node.assignmentId}` : null
          }
        />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Descrizione cliente</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm">
            {assignment.ticket.description}
          </CardContent>
        </Card>
        <Card className="border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-base">Note segrete docente</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm">
            {assignment.ticket.secretNotes}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Diagnosi studente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium">Causa root</p>
              <p className="text-muted-foreground">{assignment.rootCause || "—"}</p>
            </div>
            <div>
              <p className="font-medium">Procedura</p>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {assignment.resolutionSteps || "—"}
              </p>
            </div>
            <div>
              <p className="font-medium">Esito test finale</p>
              <p className="text-muted-foreground">{assignment.finalTest || "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Valutazione</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <EvaluationForm
              assignmentId={assignment.id}
              initial={
                assignment.evaluation
                  ? {
                      grade: assignment.evaluation.grade,
                      xpAwarded: assignment.evaluation.xpAwarded,
                      feedback: assignment.evaluation.feedback,
                    }
                  : null
              }
              chain={
                chain
                  ? {
                      key: chain.key,
                      name: chain.name,
                      nextLabel: next?.nodeLabel ?? null,
                      spawnOnMaxGrade: chain.spawnOnMaxGrade,
                    }
                  : null
              }
            />
            {chainNodes.length > 1 && (
              <p className="text-xs text-muted-foreground">
                Catena attiva:{" "}
                {chainNodes.map((n, i) => (
                  <span key={n.ticketId}>
                    {i > 0 && " → "}
                    {n.assignmentId ? (
                      <Link
                        href={`/teacher/assignments/${n.assignmentId}`}
                        className={cn(buttonVariants({ variant: "link" }), "h-auto p-0 text-xs")}
                      >
                        {n.title}
                      </Link>
                    ) : (
                      n.title
                    )}
                  </span>
                ))}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
