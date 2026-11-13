import Link from "next/link";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";

export default async function ReviewPage() {
  const session = await requireRole("TEACHER");
  const assignments = await prisma.ticketAssignment.findMany({
    where: {
      ticket: { createdById: session.user.id },
      status: { in: ["WAITING_REVIEW", "RESOLVED"] },
    },
    include: {
      ticket: { select: { title: true } },
      assignee: { select: { name: true } },
      evaluation: true,
    },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <AppShell role="TEACHER" userName={session.user.name || "Docente"}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Revisioni e valutazioni</h1>
        <p className="text-sm text-muted-foreground">
          Controlla diagnosi, procedure e assegna voto + XP.
        </p>
      </div>
      <div className="space-y-3">
        {assignments.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Nessun ticket in verifica al momento.
            </CardContent>
          </Card>
        )}
        {assignments.map((a) => (
          <Card key={a.id}>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <div>
                <CardTitle className="text-base">{a.ticket.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{a.assignee.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{STATUS_LABELS[a.status]}</Badge>
                {a.evaluation && <Badge>Voto {a.evaluation.grade}</Badge>}
                <Link
                  href={`/teacher/assignments/${a.id}`}
                  className={cn(buttonVariants({ size: "sm" }))}
                >
                  Valuta
                </Link>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
