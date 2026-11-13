"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SlaTimer } from "@/components/ticket/sla-timer";
import {
  CATEGORY_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { TicketCategory, TicketPriority, TicketStatus } from "@prisma/client";

type Comment = {
  id: string;
  authorType: string;
  body: string;
  createdAt: string | Date;
  author?: { name: string | null } | null;
};

type Detail = {
  id: string;
  status: TicketStatus;
  rootCause: string | null;
  resolutionSteps: string | null;
  finalTest: string | null;
  startedAt: string | Date | null;
  evaluation?: { grade: number; feedback: string; xpAwarded: number } | null;
  comments: Comment[];
  ticket: {
    title: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
    slaMinutes: number;
    fakeLogs: string;
  };
};

export function TicketDetail({ assignment }: { assignment: Detail }) {
  const router = useRouter();
  const [status, setStatus] = useState(assignment.status);
  const [rootCause, setRootCause] = useState(assignment.rootCause || "");
  const [resolutionSteps, setResolutionSteps] = useState(assignment.resolutionSteps || "");
  const [finalTest, setFinalTest] = useState(assignment.finalTest || "");
  const [comments, setComments] = useState(assignment.comments);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const [lastReplySource, setLastReplySource] = useState<"ai" | "scripted" | null>(null);

  const logs = useMemo(() => {
    try {
      return JSON.parse(assignment.ticket.fakeLogs || "[]") as {
        name: string;
        content: string;
      }[];
    } catch {
      return [];
    }
  }, [assignment.ticket.fakeLogs]);

  async function save(patch: Record<string, unknown>, successMsg?: string) {
    setSaving(true);
    const res = await fetch(`/api/assignments/${assignment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Salvataggio non riuscito");
      return false;
    }
    if (successMsg) toast.success(successMsg);
    router.refresh();
    return true;
  }

  async function startWork() {
    const ok = await save({ status: "IN_PROGRESS" }, "Ticket in lavorazione");
    if (ok) setStatus("IN_PROGRESS");
  }

  async function submitForReview() {
    const ok = await save(
      {
        status: "WAITING_REVIEW",
        rootCause,
        resolutionSteps,
        finalTest,
      },
      "Inviato in verifica al docente",
    );
    if (ok) setStatus("WAITING_REVIEW");
  }

  async function sendComment(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || chatBusy) return;
    setChatBusy(true);
    const res = await fetch(`/api/assignments/${assignment.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: message }),
    });
    setChatBusy(false);
    if (!res.ok) {
      toast.error("Messaggio non inviato");
      return;
    }
    const data = await res.json();
    setComments((prev) => [...prev, ...data.comments]);
    setMessage("");
    if (data.replySource === "ai" || data.replySource === "scripted") {
      setLastReplySource(data.replySource);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
      <section className="space-y-4">
        <div className="rounded-lg border bg-background/80 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{assignment.ticket.title}</h1>
            <Badge variant="secondary">{STATUS_LABELS[status]}</Badge>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {assignment.ticket.description}
          </p>
        </div>

        <div className="rounded-lg border bg-background/80 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Log / terminale allegati
          </h2>
          <div className="space-y-3">
            {logs.length === 0 && (
              <p className="text-sm text-muted-foreground">Nessun allegato tecnico.</p>
            )}
            {logs.map((log) => (
              <div key={log.name} className="overflow-hidden rounded-md border">
                <div className="border-b bg-slate-100 px-3 py-1.5 font-mono text-xs dark:bg-slate-900">
                  {log.name}
                </div>
                <pre className="overflow-x-auto bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-emerald-300">
                  {log.content}
                </pre>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-background/80 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Chat troubleshooting col cliente
            </h2>
            {lastReplySource && (
              <Badge variant="outline" className="text-[10px]">
                {lastReplySource === "ai" ? "Cliente AI" : "Cliente script"}
              </Badge>
            )}
          </div>
          <p className="mb-2 text-xs text-muted-foreground">
            Con API key (OpenAI/Gemini) il cliente risponde in modo più naturale; senza chiave usa indizi
            guidati. La soluzione segreta non viene mai rivelata.
          </p>
          <ScrollArea className="mb-3 h-56 rounded-md border p-3">
            <div className="space-y-3">
              {comments.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Fai domande mirate: il cliente può rivelare indizi utili.
                </p>
              )}
              {comments.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    "max-w-[90%] rounded-md px-3 py-2 text-sm",
                    c.authorType === "STUDENT"
                      ? "ml-auto bg-teal-700 text-white"
                      : "bg-muted",
                  )}
                >
                  <p className="mb-1 text-[10px] uppercase opacity-70">
                    {c.authorType === "CLIENT" ? "Cliente" : c.author?.name || c.authorType}
                  </p>
                  {c.body}
                </div>
              ))}
              {chatBusy && (
                <p className="text-xs text-muted-foreground animate-pulse">Il cliente sta rispondendo…</p>
              )}
            </div>
          </ScrollArea>
          <form className="flex gap-2" onSubmit={sendComment}>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Es. Da quando succede? Avete cambiato qualcosa in rete?"
              rows={2}
              disabled={chatBusy}
            />
            <Button
              type="submit"
              className="self-end bg-teal-700 hover:bg-teal-800"
              disabled={chatBusy}
            >
              Invia
            </Button>
          </form>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-lg border bg-background/80 p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <span
              className={cn(
                "rounded px-2 py-1 text-xs font-medium",
                PRIORITY_COLORS[assignment.ticket.priority],
              )}
            >
              {PRIORITY_LABELS[assignment.ticket.priority]}
            </span>
            <Badge variant="outline">{CATEGORY_LABELS[assignment.ticket.category]}</Badge>
          </div>
          <SlaTimer
            slaMinutes={assignment.ticket.slaMinutes}
            startedAt={assignment.startedAt || (status === "TODO" ? null : new Date())}
          />
          {status === "TODO" && (
            <Button className="w-full bg-teal-700 hover:bg-teal-800" onClick={startWork} disabled={saving}>
              Prendi in carico
            </Button>
          )}
        </div>

        <div className="rounded-lg border bg-background/80 p-4 space-y-3">
          <h2 className="text-sm font-semibold">Chiusura ticket (obbligatoria)</h2>
          <div className="space-y-2">
            <Label>Causa Root Identificata</Label>
            <Textarea value={rootCause} onChange={(e) => setRootCause(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Procedura di Risoluzione Applicata</Label>
            <Textarea
              value={resolutionSteps}
              onChange={(e) => setResolutionSteps(e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Esito Test Finale</Label>
            <Textarea value={finalTest} onChange={(e) => setFinalTest(e.target.value)} rows={3} />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={saving}
              onClick={() =>
                save({ rootCause, resolutionSteps, finalTest }, "Bozza salvata")
              }
            >
              Salva bozza
            </Button>
            <Button
              className="flex-1 bg-amber-600 hover:bg-amber-700"
              disabled={saving || status === "WAITING_REVIEW" || status === "RESOLVED"}
              onClick={submitForReview}
            >
              Invia in verifica
            </Button>
          </div>
        </div>

        {assignment.evaluation && (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm dark:bg-emerald-950/30">
            <p className="font-semibold">
              Valutazione: {assignment.evaluation.grade}/10 · +{assignment.evaluation.xpAwarded} XP
            </p>
            <p className="mt-2 text-muted-foreground">{assignment.evaluation.feedback}</p>
          </div>
        )}
      </aside>
    </div>
  );
}
