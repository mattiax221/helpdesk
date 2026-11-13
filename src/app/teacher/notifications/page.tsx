import { requireRole } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { NotificationsPanel } from "@/components/teacher/notifications-panel";

export default async function TeacherNotificationsPage() {
  const session = await requireRole("TEACHER");

  return (
    <AppShell role="TEACHER" userName={session.user.name || "Docente"}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Notifiche scadenze</h1>
        <p className="text-sm text-muted-foreground">
          Qui vedi chi non ha finito i compiti Lab in tempo o ha superato lo SLA. Gli avvisi restano
          nell’app; l’email istituzionale si potrà aggiungere dopo.
        </p>
      </div>
      <NotificationsPanel />
    </AppShell>
  );
}
