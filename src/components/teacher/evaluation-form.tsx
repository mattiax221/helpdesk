"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export function EvaluationForm({
  assignmentId,
  initial,
  chain,
}: {
  assignmentId: string;
  initial?: { grade: number; xpAwarded: number; feedback: string } | null;
  chain?: {
    key: string;
    name: string;
    nextLabel: string | null;
    spawnOnMaxGrade: number;
  } | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [grade, setGrade] = useState(initial?.grade ?? 7);
  const [xpAwarded, setXpAwarded] = useState(initial?.xpAwarded ?? 80);
  const [feedback, setFeedback] = useState(initial?.feedback ?? "");
  const [allowSpawn, setAllowSpawn] = useState(Boolean(chain?.nextLabel));
  const [forceSpawn, setForceSpawn] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const spawnChain = !chain?.nextLabel || !allowSpawn ? false : forceSpawn ? true : undefined;
    const res = await fetch("/api/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignmentId,
        grade,
        xpAwarded,
        feedback,
        spawnChain,
      }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error || "Valutazione non salvata");
      return;
    }
    if (data.chainSpawn?.spawned) {
      toast.success(
        `Valutazione salvata · Nuovo incidente: ${data.chainSpawn.title}`,
      );
    } else {
      toast.success("Valutazione salvata");
    }
    router.refresh();
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Voto (1-10)</Label>
          <Input
            type="number"
            min={1}
            max={10}
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>XP</Label>
          <Input
            type="number"
            min={0}
            max={500}
            value={xpAwarded}
            onChange={(e) => setXpAwarded(Number(e.target.value))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Feedback</Label>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Cosa ha fatto bene / cosa migliorare..."
          required
        />
      </div>

      {chain?.nextLabel && (
        <div className="space-y-2 rounded-lg border border-teal-800/15 bg-teal-50/50 p-3 dark:bg-teal-950/20">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Catena «{chain.name}»</p>
              <p className="text-xs text-muted-foreground">
                Fix debole → nuovo incidente: <strong>{chain.nextLabel}</strong>. Auto se voto ≤{" "}
                {chain.spawnOnMaxGrade}.
              </p>
            </div>
            <Switch checked={allowSpawn} onCheckedChange={setAllowSpawn} />
          </div>
          {allowSpawn && grade <= chain.spawnOnMaxGrade && (
            <p className="text-[11px] text-teal-800 dark:text-teal-200">
              Con questo voto nasce il ticket correlato allo stesso studente.
            </p>
          )}
          {allowSpawn && grade > chain.spawnOnMaxGrade && (
            <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <input
                type="checkbox"
                checked={forceSpawn}
                onChange={(e) => setForceSpawn(e.target.checked)}
              />
              Forza comunque l’incidente correlato
            </label>
          )}
        </div>
      )}

      <Button type="submit" className="bg-teal-700 hover:bg-teal-800" disabled={loading}>
        Salva valutazione
      </Button>
    </form>
  );
}
