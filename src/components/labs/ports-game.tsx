"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PAIRS = [
  { port: "22", service: "SSH" },
  { port: "23", service: "Telnet" },
  { port: "25", service: "SMTP" },
  { port: "53", service: "DNS" },
  { port: "80", service: "HTTP" },
  { port: "110", service: "POP3" },
  { port: "143", service: "IMAP" },
  { port: "443", service: "HTTPS" },
  { port: "445", service: "SMB" },
  { port: "3389", service: "RDP" },
  { port: "3306", service: "MySQL" },
  { port: "5432", service: "PostgreSQL" },
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function PortsGame({
  onComplete,
}: {
  onComplete?: (score: number, meta?: Record<string, unknown>) => Promise<void> | void;
} = {}) {
  const round = useMemo(() => shuffle(PAIRS).slice(0, 8), []);
  const [ports] = useState(() => shuffle(round.map((p) => p.port)));
  const [services] = useState(() => shuffle(round.map((p) => p.service)));
  const [selectedPort, setSelectedPort] = useState<string | null>(null);
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
          toast.error("Tempo scaduto!");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, done]);

  function start() {
    setMatched({});
    setSelectedPort(null);
    setMistakes(0);
    setSeconds(75);
    setRunning(true);
    setDone(false);
  }

  async function pickService(service: string) {
    if (!running || done || !selectedPort) return;
    const expected = round.find((p) => p.port === selectedPort)?.service;
    if (expected === service) {
      const next = { ...matched, [selectedPort]: service };
      setMatched(next);
      setSelectedPort(null);
      if (Object.keys(next).length === round.length) {
        setDone(true);
        setRunning(false);
        const score = Math.max(20, seconds * 3 - mistakes * 5);
        if (onComplete) {
          await onComplete(score, { mistakes, secondsLeft: seconds });
        } else {
          toast.success(`Firewall mastery! ${score} pts`);
        }
      } else {
        toast.success("Match!");
      }
    } else {
      setMistakes((m) => m + 1);
      setSelectedPort(null);
      toast.error("Porta/servizio errati");
    }
  }

  const usedServices = new Set(Object.values(matched));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={start} className="bg-teal-700 hover:bg-teal-800">
          {running ? "Reset round" : "Avvia Port Strike"}
        </Button>
        <Badge variant={seconds < 15 ? "destructive" : "secondary"}>⏱ {seconds}s</Badge>
        <Badge variant="outline">
          Match {Object.keys(matched).length}/{round.length}
        </Badge>
        <Badge variant="outline">Errori {mistakes}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-slate-950 p-4">
          <p className="mb-3 text-xs uppercase tracking-wide text-slate-400">Porte TCP/UDP</p>
          <div className="grid grid-cols-2 gap-2">
            {ports.map((port) => {
              const locked = Boolean(matched[port]);
              return (
                <button
                  key={port}
                  type="button"
                  disabled={!running || locked || done}
                  onClick={() => setSelectedPort(port)}
                  className={cn(
                    "rounded-md border border-white/10 px-3 py-3 font-mono text-lg text-cyan-300 transition",
                    selectedPort === port && "ring-2 ring-amber-400",
                    locked && "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
                  )}
                >
                  :{port}
                  {locked && (
                    <span className="mt-1 block text-[10px] text-emerald-200/80">{matched[port]}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-slate-900 to-slate-950 p-4">
          <p className="mb-3 text-xs uppercase tracking-wide text-slate-400">Servizi</p>
          <div className="grid grid-cols-2 gap-2">
            {services.map((service) => {
              const used = usedServices.has(service);
              return (
                <button
                  key={service}
                  type="button"
                  disabled={!running || used || done || !selectedPort}
                  onClick={() => pickService(service)}
                  className={cn(
                    "rounded-md border border-white/10 px-3 py-3 text-sm font-medium text-amber-100 transition hover:bg-white/5",
                    used && "opacity-40",
                  )}
                >
                  {service}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Seleziona una porta, poi il servizio corretto. Allenamento tipico per firewall e troubleshooting L4.
      </p>
    </div>
  );
}
