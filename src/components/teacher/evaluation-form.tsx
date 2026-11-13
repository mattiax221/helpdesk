"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function EvaluationForm({
  assignmentId,
  initial,
}: {
  assignmentId: string;
  initial?: { grade: number; xpAwarded: number; feedback: string } | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [grade, setGrade] = useState(initial?.grade ?? 7);
  const [xpAwarded, setXpAwarded] = useState(initial?.xpAwarded ?? 80);
  const [feedback, setFeedback] = useState(initial?.feedback ?? "");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId, grade, xpAwarded, feedback }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Valutazione non salvata");
      return;
    }
    toast.success("Valutazione salvata");
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
      <Button className="bg-teal-700 hover:bg-teal-800" disabled={loading}>
        Salva valutazione
      </Button>
    </form>
  );
}
