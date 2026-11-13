"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Challenge = {
  id: string;
  prompt: string;
  scenario: string;
  options: { id: string; label: string; correct: boolean; explain: string }[];
};

const CHALLENGES: Challenge[] = [
  {
    id: "subnet",
    prompt: "Qual è l'errore di configurazione?",
    scenario:
      "Host: 192.168.10.50/24\nGateway: 192.168.1.1\nDNS: 8.8.8.8\nSintomo: non naviga, ping al gateway fallisce.",
    options: [
      {
        id: "a",
        label: "Gateway fuori subnet (dovrebbe essere 192.168.10.x)",
        correct: true,
        explain: "Con /24 l'host è in 192.168.10.0/24, il gateway 192.168.1.1 non è raggiungibile in L2/L3 locale.",
      },
      {
        id: "b",
        label: "DNS 8.8.8.8 non è valido",
        correct: false,
        explain: "8.8.8.8 è valido; il problema è la reachability del gateway.",
      },
      {
        id: "c",
        label: "Serve per forza IPv6",
        correct: false,
        explain: "Non è richiesto IPv6 per questo scenario.",
      },
    ],
  },
  {
    id: "cmd-dns",
    prompt: "Quale comando usi per interrogare un record DNS?",
    scenario: "Windows client · sospetto problema di risoluzione nomi.",
    options: [
      { id: "a", label: "ipconfig", correct: false, explain: "Mostra la config IP, non interroga DNS." },
      { id: "b", label: "nslookup", correct: true, explain: "nslookup interroga i record DNS." },
      { id: "c", label: "chmod", correct: false, explain: "chmod è Unix per i permessi file." },
    ],
  },
  {
    id: "cmd-path",
    prompt: "Quale comando mostra il percorso dei router fino a destinazione?",
    scenario: "Timeout intermittenti verso un server remoto.",
    options: [
      { id: "a", label: "tracert", correct: true, explain: "tracert/traceroute mostra gli hop." },
      { id: "b", label: "ping", correct: false, explain: "ping testa reachability, non l'intero percorso." },
      { id: "c", label: "ipconfig /all", correct: false, explain: "Mostra solo configurazione locale." },
    ],
  },
  {
    id: "mask",
    prompt: "Host e server possono comunicare?",
    scenario: "PC 10.0.0.20 mask 255.255.255.0\nServer 10.0.1.20 mask 255.255.255.0\nGateway assente.",
    options: [
      {
        id: "a",
        label: "No, sono su subnet diverse senza routing",
        correct: true,
        explain: "10.0.0.0/24 e 10.0.1.0/24 richiedono un gateway/router.",
      },
      {
        id: "b",
        label: "Sì, stesso Class A quindi ok",
        correct: false,
        explain: "La classe non basta: conta la subnet mask configurata.",
      },
      {
        id: "c",
        label: "Sì, basta un ping",
        correct: false,
        explain: "Senza routing il ping fallirà.",
      },
    ],
  },
];

export function TerminalGame() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const challenge = CHALLENGES[index];
  const progress = useMemo(() => `${index + 1}/${CHALLENGES.length}`, [index]);

  async function answer(optionId: string) {
    if (selected) return;
    setSelected(optionId);
    const opt = challenge.options.find((o) => o.id === optionId)!;
    if (opt.correct) {
      setScore((s) => s + 25);
      toast.success(opt.explain);
    } else {
      toast.error(opt.explain);
    }
  }

  async function next() {
    if (index >= CHALLENGES.length - 1) {
      setDone(true);
      const res = await fetch("/api/games/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameKey: "terminal",
          score,
          meta: { answered: CHALLENGES.length },
        }),
      });
      const data = await res.json().catch(() => ({}));
      toast.success(`Sfida completata · ${score} punti · +${data.xpEarned ?? 0} XP`);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  }

  function reset() {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setDone(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">Sfida {progress}</Badge>
        <Badge variant="outline">Score {score}</Badge>
      </div>

      <div className="overflow-hidden rounded-xl border bg-slate-950 text-slate-100">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-xs text-slate-400">
          <span className="size-2 rounded-full bg-rose-500" />
          <span className="size-2 rounded-full bg-amber-400" />
          <span className="size-2 rounded-full bg-emerald-500" />
          <span className="ml-2">helpdesk@lab:~</span>
        </div>
        <pre className="whitespace-pre-wrap p-4 font-mono text-xs leading-relaxed text-emerald-300">
          {challenge.scenario}
        </pre>
        <div className="border-t border-white/10 p-4">
          <p className="mb-3 text-sm font-medium text-white">{challenge.prompt}</p>
          <div className="space-y-2">
            {challenge.options.map((opt) => {
              const isSelected = selected === opt.id;
              const show = Boolean(selected);
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={Boolean(selected) || done}
                  onClick={() => answer(opt.id)}
                  className={cn(
                    "w-full rounded-md border border-white/10 px-3 py-2 text-left text-sm transition hover:bg-white/5",
                    show && opt.correct && "border-emerald-400/50 bg-emerald-500/10",
                    show && isSelected && !opt.correct && "border-rose-400/50 bg-rose-500/10",
                  )}
                >
                  <span className="mr-2 font-mono text-xs text-slate-400">{opt.id.toUpperCase()})</span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {!done ? (
          <Button onClick={next} disabled={!selected} className="bg-teal-700 hover:bg-teal-800">
            {index >= CHALLENGES.length - 1 ? "Termina" : "Prossima sfida"}
          </Button>
        ) : (
          <Button onClick={reset} variant="outline">
            Rigioca
          </Button>
        )}
      </div>
    </div>
  );
}
