"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LAB_GAMES, type LabGameKey } from "@/lib/lab-catalog";

export function AssignLabTaskForm({
  classroomId,
  students,
  groups,
}: {
  classroomId: string;
  students: { id: string; name: string | null }[];
  groups: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [gameKey, setGameKey] = useState<LabGameKey>("rj45");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [minScore, setMinScore] = useState(LAB_GAMES[0].defaultMinScore);
  const [dueAt, setDueAt] = useState("");
  const [assignTo, setAssignTo] = useState<"all" | "selected" | "group">("all");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [groupId, setGroupId] = useState(groups[0]?.id || "");
  const [loading, setLoading] = useState(false);

  function pickGame(key: LabGameKey) {
    const game = LAB_GAMES.find((g) => g.key === key)!;
    setGameKey(key);
    setMinScore(game.defaultMinScore);
    if (!title) setTitle(game.title);
    if (!instructions) setInstructions(game.description);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/lab-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classroomId,
        gameKey,
        title: title || undefined,
        instructions: instructions || undefined,
        minScore,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        assignTo,
        studentIds: selectedStudents,
        groupId: assignTo === "group" ? groupId : undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Assegnazione fallita");
      return;
    }
    toast.success("Compito Lab assegnato");
    setTitle("");
    setInstructions("");
    setDueAt("");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Assegna compito Lab</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label>Mini-game</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {LAB_GAMES.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => pickGame(g.key)}
                  className={`rounded-md border px-3 py-2 text-left text-sm ${
                    gameKey === g.key
                      ? "border-teal-600 bg-teal-50 dark:bg-teal-950/40"
                      : "hover:bg-muted"
                  }`}
                >
                  <span className="font-medium">{g.title}</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {g.skill} · ~{g.estimatedMinutes} min
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lab-title">Titolo compito</Label>
            <Input
              id="lab-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={LAB_GAMES.find((g) => g.key === gameKey)?.title}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lab-instructions">Consegna / istruzioni</Label>
            <Textarea
              id="lab-instructions"
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Cosa devono fare gli studenti e quando consegnare"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lab-min">Punteggio minimo per consegnare</Label>
              <Input
                id="lab-min"
                type="number"
                min={10}
                max={100}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value) || 50)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lab-due">Scadenza</Label>
              <Input
                id="lab-due"
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Se uno studente non completa in tempo, ricevi un avviso (in-app + email Workspace).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "Tutta la classe"],
                ["selected", "Studenti selezionati"],
                ["group", "Gruppo"],
              ] as const
            ).map(([key, label]) => (
              <Button
                key={key}
                type="button"
                size="sm"
                variant={assignTo === key ? "default" : "outline"}
                className={assignTo === key ? "bg-teal-700 hover:bg-teal-800" : ""}
                onClick={() => setAssignTo(key)}
              >
                {label}
              </Button>
            ))}
          </div>

          {assignTo === "selected" && (
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
              {students.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(s.id)}
                    onChange={(e) =>
                      setSelectedStudents((prev) =>
                        e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id),
                      )
                    }
                  />
                  {s.name}
                </label>
              ))}
            </div>
          )}

          {assignTo === "group" && (
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}

          <Button type="submit" disabled={loading} className="bg-teal-700 hover:bg-teal-800">
            {loading ? "Assegnazione…" : "Assegna compito"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
