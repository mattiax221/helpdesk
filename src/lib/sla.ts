export type SlaState = "ok" | "warning" | "overdue" | "done";

export function getSlaDeadline(
  slaMinutes: number,
  startedAt?: string | Date | null,
  createdAt?: string | Date | null,
): Date {
  const start = startedAt
    ? new Date(startedAt)
    : createdAt
      ? new Date(createdAt)
      : new Date();
  return new Date(start.getTime() + slaMinutes * 60_000);
}

export function getSlaState(
  status: string,
  slaMinutes: number,
  startedAt?: string | Date | null,
  createdAt?: string | Date | null,
  now = Date.now(),
): { state: SlaState; remainingMs: number; deadline: Date } {
  const deadline = getSlaDeadline(slaMinutes, startedAt, createdAt);
  const remainingMs = deadline.getTime() - now;

  if (status === "RESOLVED" || status === "WAITING_REVIEW") {
    return { state: "done", remainingMs, deadline };
  }
  if (remainingMs < 0) {
    return { state: "overdue", remainingMs, deadline };
  }
  // Warning when less than 25% of SLA left or under 15 minutes
  const warnThreshold = Math.max(15 * 60_000, slaMinutes * 60_000 * 0.25);
  if (remainingMs <= warnThreshold) {
    return { state: "warning", remainingMs, deadline };
  }
  return { state: "ok", remainingMs, deadline };
}

export function formatSlaRemaining(remainingMs: number): string {
  const overdue = remainingMs < 0;
  const abs = Math.abs(remainingMs);
  const mm = Math.floor(abs / 60000);
  const ss = Math.floor((abs % 60000) / 1000);
  if (mm >= 60) {
    const h = Math.floor(mm / 60);
    const m = mm % 60;
    return `${overdue ? "+" : ""}${h}h ${m}m`;
  }
  return `${overdue ? "+" : ""}${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}
