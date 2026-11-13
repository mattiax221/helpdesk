"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PAIRS = [
  { problem: "Vedere IP/mask/gateway su Windows", cmd: "ipconfig /all" },
  { problem: "Svuotare cache DNS Windows", cmd: "ipconfig /flushdns" },
  { problem: "Test connettività host", cmd: "ping" },
  { problem: "Traccia percorso fino a destinazione", cmd: "tracert / traceroute" },
  { problem: "Risolvere nome → IP", cmd: "nslookup / dig" },
  { problem: "Mostrare tabelle ARP", cmd: "arp -a" },
  { problem: "Porte in ascolto Linux", cmd: "ss -tulpn" },
  { problem: "Permessi file Linux", cmd: "chmod / chown" },
  { problem: "Processi che usano CPU", cmd: "top / Task Manager" },
  { problem: "Aggiornare pacchetti Debian/Ubuntu", cmd: "apt update && apt upgrade" },
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function CliGame({
  onComplete,
}: {
  onComplete?: (score: number, meta?: Record<string, unknown>) => Promise<void> | void;
}) {
  const round = useMemo(() => shuffle(PAIRS).slice(0, 7), []);
  const [problems] = useState(() => shuffle(round.map((p) => p.problem)));
  const [cmds] = useState(() => shuffle(round.map((p) => p.cmd)));
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<Record<string, string>>({});
  const [mistakes, setMistakes] = useState(0);
  const [seconds, setSeconds] = useState(75);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!running || done) return;
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          toast.error("Tempo scaduto");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, done]);

  function start() {
    setMatched({});
    setSelected(null);
    setMistakes(0);
    setSeconds(75);
    setRunning(true);
    setDone(false);
  }

  async function pickCmd(cmd: string) {
    if (!running || done || !selected) return;
    const expected = round.find((p) => p.problem === selected)?.cmd;
    if (expected === cmd) {
      const next = { ...matched, [selected]: cmd };
      setMatched(next);
      setSelected(null);
      if (Object.keys(next).length === round.length) {
        setDone(true);
        setRunning(false);
        const score = Math.max(25, seconds * 2 - mistakes * 5);
        await onComplete?.(score, { mistakes, secondsLeft: seconds });
        toast.success(`CLI Strike completato · ${score} pts`);
      }
    } else {
      setMistakes((m) => m + 1);
      setSelected(null);
      toast.error("Comando non adatto");
    }
  }

  const usedProblems = new Set(Object.keys(matched));
  const usedCmds = new Set(Object.values(matched));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{seconds}s</Badge>
        <Badge variant="outline">Errori {mistakes}</Badge>
        <Button type="button" size="sm" className="ml-auto bg-teal-700 hover:bg-teal-800" onClick={start}>
          {running ? "Ricomincia" : "Avvia compito"}
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Problema</p>
          {problems.map((p) => (
            <button
              key={p}
              type="button"
              disabled={!running || done || usedProblems.has(p)}
              onClick={() => setSelected(p)}
              className={cn(
                "w-full rounded-md border px-3 py-2 text-left text-sm",
                selected === p && "border-teal-600 bg-teal-50 dark:bg-teal-950/40",
                usedProblems.has(p) && "opacity-40",
              )}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Comando</p>
          {cmds.map((c) => (
            <button
              key={c}
              type="button"
              disabled={!running || done || usedCmds.has(c) || !selected}
              onClick={() => pickCmd(c)}
              className={cn(
                "w-full rounded-md border px-3 py-2 text-left font-mono text-xs",
                usedCmds.has(c) && "opacity-40",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
