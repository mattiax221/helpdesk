"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Standard = "T568A" | "T568B";

const COLORS: { id: string; label: string; color: string; stripe?: string }[] = [
  { id: "GW", label: "Bianco/Verde", color: "#d9f99d", stripe: "#16a34a" },
  { id: "G", label: "Verde", color: "#16a34a" },
  { id: "OW", label: "Bianco/Arancio", color: "#ffedd5", stripe: "#ea580c" },
  { id: "O", label: "Arancio", color: "#ea580c" },
  { id: "BW", label: "Bianco/Blu", color: "#dbeafe", stripe: "#2563eb" },
  { id: "B", label: "Blu", color: "#2563eb" },
  { id: "BrW", label: "Bianco/Marrone", color: "#f5f5f4", stripe: "#a16207" },
  { id: "Br", label: "Marrone", color: "#a16207" },
];

const STANDARDS: Record<Standard, string[]> = {
  T568A: ["GW", "G", "OW", "B", "BW", "O", "BrW", "Br"],
  T568B: ["OW", "O", "GW", "B", "BW", "G", "BrW", "Br"],
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function Rj45Game() {
  const [standard, setStandard] = useState<Standard>("T568B");
  const [order, setOrder] = useState<string[]>(() => shuffle(COLORS.map((c) => c.id)));
  const [selected, setSelected] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(60);
  const [running, setRunning] = useState(false);
  const [won, setWon] = useState(false);

  const target = STANDARDS[standard];

  useEffect(() => {
    if (!running || won || seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [running, seconds, won]);

  useEffect(() => {
    if (seconds === 0 && running) {
      setRunning(false);
      toast.error("Tempo scaduto! Riprova la crimpatura.");
    }
  }, [seconds, running]);

  const correctCount = useMemo(
    () => order.filter((id, idx) => id === target[idx]).length,
    [order, target],
  );

  function start(std: Standard) {
    setStandard(std);
    setOrder(shuffle(COLORS.map((c) => c.id)));
    setSelected(null);
    setSeconds(60);
    setRunning(true);
    setWon(false);
  }

  function swap(index: number) {
    if (!running || won) return;
    if (selected === null) {
      setSelected(index);
      return;
    }
    if (selected === index) {
      setSelected(null);
      return;
    }
    const next = [...order];
    [next[selected], next[index]] = [next[index], next[selected]];
    setOrder(next);
    setSelected(null);
  }

  async function check() {
    if (order.every((id, idx) => id === target[idx])) {
      setWon(true);
      setRunning(false);
      const score = Math.max(10, seconds * 2);
      const res = await fetch("/api/games/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameKey: "rj45",
          score,
          meta: { standard, secondsLeft: seconds },
        }),
      });
      const data = await res.json().catch(() => ({}));
      toast.success(`Crimpatura corretta! +${data.xpEarned ?? 0} XP`);
    } else {
      toast.error(`Ancora ${8 - correctCount} fili fuori posto`);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={standard === "T568A" && running ? "default" : "outline"} onClick={() => start("T568A")}>
          Avvia T568A
        </Button>
        <Button size="sm" variant={standard === "T568B" && running ? "default" : "outline"} onClick={() => start("T568B")}>
          Avvia T568B
        </Button>
        <Badge variant={seconds < 15 ? "destructive" : "secondary"}>⏱ {seconds}s</Badge>
        <Badge variant="outline">
          Corretti {correctCount}/8 · {standard}
        </Badge>
      </div>

      <div className="rounded-xl border bg-slate-950 p-4 text-white">
        <p className="mb-3 text-xs uppercase tracking-wide text-slate-400">
          Connettore RJ45 — clicca due fili per scambiarli
        </p>
        <div className="grid grid-cols-8 gap-2">
          {order.map((id, index) => {
            const wire = COLORS.find((c) => c.id === id)!;
            return (
              <button
                key={`${id}-${index}`}
                type="button"
                onClick={() => swap(index)}
                className={cn(
                  "flex h-36 flex-col items-center justify-end rounded-md border border-white/10 p-1 transition",
                  selected === index && "ring-2 ring-amber-400",
                  order[index] === target[index] && running && "ring-1 ring-emerald-400/60",
                )}
                style={{
                  background: wire.stripe
                    ? `repeating-linear-gradient(135deg, ${wire.color}, ${wire.color} 6px, ${wire.stripe} 6px, ${wire.stripe} 12px)`
                    : wire.color,
                }}
              >
                <span className="mb-1 rounded bg-black/50 px-1 text-[10px]">{index + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={check} disabled={!running || won} className="bg-teal-700 hover:bg-teal-800">
          Verifica crimpatura
        </Button>
        {won && <Badge className="self-center">Completato</Badge>}
      </div>
    </div>
  );
}
