"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PAIRS = [
  { item: "HTTP / HTTPS", layer: "7 Applicazione" },
  { item: "TCP / UDP", layer: "4 Trasporto" },
  { item: "IP / ICMP", layer: "3 Rete" },
  { item: "Ethernet / MAC", layer: "2 Data Link" },
  { item: "Cavo RJ45 / fibra", layer: "1 Fisico" },
  { item: "TLS / SSL", layer: "6 Presentazione" },
  { item: "Router", layer: "3 Rete" },
  { item: "Switch L2", layer: "2 Data Link" },
  { item: "DNS / SMTP", layer: "7 Applicazione" },
  { item: "NetBIOS session", layer: "5 Sessione" },
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function OsiGame({
  onComplete,
}: {
  onComplete?: (score: number, meta?: Record<string, unknown>) => Promise<void> | void;
}) {
  const round = useMemo(() => shuffle(PAIRS).slice(0, 8), []);
  const [items] = useState(() => shuffle(round.map((p) => p.item)));
  const [layers] = useState(() => shuffle([...new Set(round.map((p) => p.layer))]));
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<Record<string, string>>({});
  const [mistakes, setMistakes] = useState(0);
  const [seconds, setSeconds] = useState(80);
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
    setSeconds(80);
    setRunning(true);
    setDone(false);
  }

  async function pickLayer(layer: string) {
    if (!running || done || !selected) return;
    const expected = round.find((p) => p.item === selected)?.layer;
    if (expected === layer) {
      const next = { ...matched, [selected]: layer };
      setMatched(next);
      setSelected(null);
      if (Object.keys(next).length === round.length) {
        setDone(true);
        setRunning(false);
        const score = Math.max(20, seconds * 2 - mistakes * 6);
        await onComplete?.(score, { mistakes, secondsLeft: seconds });
        toast.success(`OSI completato · ${score} pts`);
      }
    } else {
      setMistakes((m) => m + 1);
      setSelected(null);
      toast.error("Livello errato");
    }
  }

  const used = new Set(Object.keys(matched));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{seconds}s</Badge>
        <Badge variant="outline">Errori {mistakes}</Badge>
        <Badge>
          {Object.keys(matched).length}/{round.length}
        </Badge>
        <Button type="button" size="sm" className="ml-auto bg-teal-700 hover:bg-teal-800" onClick={start}>
          {running ? "Ricomincia" : "Avvia compito"}
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Elemento</p>
          {items.map((item) => (
            <button
              key={item}
              type="button"
              disabled={!running || done || used.has(item)}
              onClick={() => setSelected(item)}
              className={cn(
                "w-full rounded-md border px-3 py-2 text-left text-sm",
                selected === item && "border-teal-600 bg-teal-50 dark:bg-teal-950/40",
                used.has(item) && "opacity-40",
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Livello OSI</p>
          {layers.map((layer) => (
            <button
              key={layer}
              type="button"
              disabled={!running || done || !selected}
              onClick={() => pickLayer(layer)}
              className="w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
            >
              {layer}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
