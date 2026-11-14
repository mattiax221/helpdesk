"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { DesktopAttempt } from "@/lib/desktop-report";

export type ReviewRow = {
  id: string;
  name: string;
  status: string;
  bestScore: number;
  attempts: number;
  teacherNote: string;
  attempt: DesktopAttempt | null;
};

const STATUS: Record<string, string> = {
  ASSIGNED: "Da fare",
  IN_PROGRESS: "In corso",
  COMPLETED: "Consegnato",
};

export function LabDesktopReviews({ rows }: { rows: ReviewRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Nessuno studente assegnato.</p>;
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <ReviewCard key={row.id} row={row} />
      ))}
    </div>
  );
}

function ReviewCard({ row }: { row: ReviewRow }) {
  const router = useRouter();
  const [note, setNote] = useState(row.teacherNote);
  const [saving, setSaving] = useState(false);
  const attempt = row.attempt;

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/lab-submissions/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherNote: note }),
    });
    setSaving(false);
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      toast.error(data.error || "Commento non salvato");
      return;
    }
    toast.success("Commento salvato. Lo studente lo vede sul compito.");
    router.refresh();
  }

  return (
    <article className="space-y-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">{row.name}</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{STATUS[row.status] || row.status}</Badge>
          <Badge variant="outline">Best {row.bestScore}</Badge>
          <Badge variant="outline">{row.attempts} tentativi</Badge>
        </div>
      </div>

      {!attempt ? (
        <p className="text-sm text-muted-foreground">
          Nessun report ancora. Compare qui quando lo studente consegna il desktop.
        </p>
      ) : (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            {attempt.scenarioTitle} · ultimo invio{" "}
            {new Date(attempt.at).toLocaleString("it-IT", {
              dateStyle: "short",
              timeStyle: "short",
            })}{" "}
            · {attempt.score} punti
          </p>
          <div className="rounded-md bg-muted/50 p-3 whitespace-pre-wrap">{attempt.report}</div>
          {attempt.actions.length > 0 ? (
            <ul className="space-y-1">
              {attempt.actions.map((action) => (
                <li key={action.label}>
                  {action.ok ? "Fatto" : "Manca"} — {action.label}
                </li>
              ))}
            </ul>
          ) : null}
          {attempt.keywordsHit.length > 0 || attempt.keywordsMiss.length > 0 ? (
            <p className="text-muted-foreground">
              Parole nel report: {attempt.keywordsHit.join(", ") || "nessuna"}
              {attempt.keywordsMiss.length ? ` · assenti: ${attempt.keywordsMiss.join(", ")}` : ""}
            </p>
          ) : null}
          {attempt.notes.length > 0 ? (
            <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
              {attempt.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      <div className="space-y-2">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Commento per lo studente (facoltativo)"
          rows={3}
        />
        <Button type="button" className="bg-teal-700 hover:bg-teal-800" disabled={saving} onClick={save}>
          Salva commento
        </Button>
      </div>
    </article>
  );
}
