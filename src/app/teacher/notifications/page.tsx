import { requireRole } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { NotificationsPanel } from "@/components/teacher/notifications-panel";
import { schoolDomainLabel } from "@/lib/school-email";

export default async function TeacherNotificationsPage() {
  const session = await requireRole("TEACHER");

  return (
    <AppShell role="TEACHER" userName={session.user.name || "Docente"}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Notifiche scadenze</h1>
        <p className="text-sm text-muted-foreground">
          Avvisi quando gli alunni non finiscono i compiti Lab o superano lo SLA. Le email escono
          dal tuo Google Workspace ({schoolDomainLabel()}), non da servizi esterni bloccati dalla
          scuola.
        </p>
      </div>
      <NotificationsPanel />
    </AppShell>
  );
}
