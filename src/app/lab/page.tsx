import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { ensureMarcoDesktopTask } from "@/lib/ensure-marco-desktop";
import { homeForRole } from "@/lib/roles";

/** La coda è unica: la board. Questo indirizzo resta solo come scorciatoia. */
export default async function LabIndexPage() {
  const session = await requireSession();
  await ensureMarcoDesktopTask();
  redirect(homeForRole(session.user.role));
}
