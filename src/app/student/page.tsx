import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { KanbanBoard } from "@/components/kanban/board";
import { Card, CardContent } from "@/components/ui/card";

export default async function StudentBoardPage() {
  const session = await requireRole("STUDENT");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const assignments = await prisma.ticketAssignment.findMany({
    where: { assigneeId: session.user.id },
    include: {
      ticket: true,
      evaluation: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const items = assignments.map((a) => ({
    id: a.id,
    status: a.status,
    title: a.ticket.title,
    category: a.ticket.category,
    priority: a.ticket.priority,
    slaMinutes: a.ticket.slaMinutes,
    grade: a.evaluation?.grade ?? null,
  }));

  return (
    <AppShell role="STUDENT" userName={session.user.name || "Studente"} xp={user?.xp ?? 0}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Help Desk Board</h1>
        <p className="text-sm text-muted-foreground">
          Trascina i ticket tra le colonne. Apri il dettaglio per diagnosi, log e chat col cliente.
        </p>
      </div>
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nessun ticket assegnato. Chiedi al docente il Codice Classe o attendi nuove assegnazioni.
          </CardContent>
        </Card>
      ) : (
        <KanbanBoard initialItems={items} />
      )}
    </AppShell>
  );
}
