import { requireRole } from "@/lib/session";
import { AdminConsole } from "@/components/admin/admin-console";

export default async function AdminPage() {
  const session = await requireRole("ADMIN");
  return <AdminConsole selfId={session.user.id} userName={session.user.name || "Admin"} />;
}
