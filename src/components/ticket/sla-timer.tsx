"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function SlaTimer({
  slaMinutes,
  startedAt,
}: {
  slaMinutes: number;
  startedAt?: string | Date | null;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const start = startedAt ? new Date(startedAt).getTime() : now;
  const deadline = start + slaMinutes * 60_000;
  const remaining = deadline - now;
  const overdue = remaining < 0;
  const abs = Math.abs(remaining);
  const mm = Math.floor(abs / 60000);
  const ss = Math.floor((abs % 60000) / 1000);

  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2 font-mono text-sm",
        overdue
          ? "border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
          : "border-teal-200 bg-teal-50 text-teal-900 dark:bg-teal-950/30 dark:text-teal-100",
      )}
    >
      SLA {overdue ? "scaduto" : "rimanente"}: {overdue ? "+" : "-"}
      {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
    </div>
  );
}
