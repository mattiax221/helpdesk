import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api";
import { scanAndNotifyOverdue } from "@/lib/overdue-notices";

/** Docente: riesegue subito il controllo scadenze (oltre al cron giornaliero). */
export async function POST() {
  const { user, error } = await requireApiUser("TEACHER");
  if (error || !user) return error!;

  const result = await scanAndNotifyOverdue();
  return NextResponse.json({ ok: true, ...result });
}
