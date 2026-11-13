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
      "Host: 192.168.10.50/24\nGateway: 192.168.1.1\nDNS: 8.8.8.8\nSintomo: non naviga, ping gateway fallisce.",
    options: [
      {
        id: "a",
        label: "Gateway fuori subnet (serve 192.168.10.x)",
        correct: true,
        explain: "Con /24 l'host è in 192.168.10.0/24: 192.168.1.1 non è locale.",
      },
      { id: "b", label: "DNS 8.8.8.8 non è valido", correct: false, explain: "DNS ok; manca reachability gateway." },
      { id: "c", label: "Serve per forza IPv6", correct: false, explain: "IPv6 non è richiesto qui." },
    ],
  },
  {
    id: "cmd-dns",
    prompt: "Quale comando interrogare un record DNS?",
    scenario: "Windows · sospetto problema risoluzione nomi.",
    options: [
      { id: "a", label: "ipconfig", correct: false, explain: "Mostra config IP, non interroga DNS." },
      { id: "b", label: "nslookup", correct: true, explain: "nslookup interroga i DNS." },
      { id: "c", label: "chmod", correct: false, explain: "chmod è Unix per i permessi." },
    ],
  },
  {
    id: "cmd-path",
    prompt: "Quale comando mostra gli hop fino a destinazione?",
    scenario: "Timeout intermittenti verso un server remoto.",
    options: [
      { id: "a", label: "tracert", correct: true, explain: "tracert/traceroute mostra gli hop." },
      { id: "b", label: "ping", correct: false, explain: "ping testa solo reachability." },
      { id: "c", label: "ipconfig /all", correct: false, explain: "Solo configurazione locale." },
    ],
  },
  {
    id: "mask",
    prompt: "Host e server possono comunicare?",
    scenario: "PC 10.0.0.20/24\nServer 10.0.1.20/24\nNessun gateway.",
    options: [
      {
        id: "a",
        label: "No, subnet diverse senza routing",
        correct: true,
        explain: "10.0.0.0/24 e 10.0.1.0/24 richiedono un router.",
      },
      { id: "b", label: "Sì, stesso Class A", correct: false, explain: "Conta la mask, non la classe storica." },
      { id: "c", label: "Sì, basta un ping", correct: false, explain: "Senza routing il ping fallisce." },
    ],
  },
  {
    id: "apipa",
    prompt: "Cosa indica 169.254.x.x?",
    scenario: "ipconfig → Autoconfiguration IPv4 169.254.12.8\nGateway assente",
    options: [
      {
        id: "a",
        label: "APIPA: DHCP non ha risposto",
        correct: true,
        explain: "169.254/16 è link-local Windows quando il DHCP fallisce.",
      },
      { id: "b", label: "IP pubblico CGNAT", correct: false, explain: "Non è uno spazio pubblico tipico client." },
      { id: "c", label: "Indirizzo loopback", correct: false, explain: "Loopback è 127.0.0.1." },
    ],
  },
  {
    id: "chmod",
    prompt: "Quale comando rende eseguibile uno script Linux?",
    scenario: "file: backup.sh · permission denied quando lo lanci",
    options: [
      { id: "a", label: "chmod +x backup.sh", correct: true, explain: "Aggiunge permesso execute." },
      { id: "b", label: "ping backup.sh", correct: false, explain: "ping non cambia permessi." },
      { id: "c", label: "ipconfig /renew", correct: false, explain: "Comando Windows rete." },
    ],
  },
  {
    id: "dns-vs-ip",
    prompt: "Naviga per IP ma non per nome. Primo check?",
    scenario: "ping 8.8.8.8 OK\nping google.com FAIL",
    options: [
      { id: "a", label: "Problema DNS / resolver", correct: true, explain: "Connettività L3 ok, risoluzione nomi no." },
      { id: "b", label: "Cavo ethernet rotto", correct: false, explain: "Il ping IP funzionerebbe comunque?" },
      { id: "c", label: "Alimentatore sottodimensionato", correct: false, explain: "Non spiega questo pattern." },
    ],
  },
  {
    id: "cidr",
    prompt: "Quanti host utili in /28?",
    scenario: "VLAN lab docenti · mask proposta 255.255.255.240",
    options: [
      { id: "a", label: "14", correct: true, explain: "2^(32-28)-2 = 14 host utili." },
      { id: "b", label: "16", correct: false, explain: "16 indirizzi totali, meno rete/broadcast." },
      { id: "c", label: "30", correct: false, explain: "30 è tipico di /27." },
    ],
  },
  {
    id: "default-route",
    prompt: "Quale manca se ping LAN ok ma Internet no?",
    scenario: "ping 192.168.1.10 OK\nping 1.1.1.1 FAIL\nroute print: no 0.0.0.0",
    options: [
      { id: "a", label: "Default gateway / rotta di default", correct: true, explain: "Senza 0.0.0.0 non esci dalla LAN." },
      { id: "b", label: "Driver stampante", correct: false, explain: "Irrilevante." },
      { id: "c", label: "Licenza Office", correct: false, explain: "Irrilevante." },
    ],
  },
  {
    id: "duplex",
    prompt: "Sintomo tipico di mismatch duplex?",
    scenario: "Link up, ping con perdita altissima, collisioni elevate sullo switch",
    options: [
      {
        id: "a",
        label: "Half/Full duplex mismatch",
        correct: true,
        explain: "Classico: throughput misero e errori CRC/collision.",
      },
      { id: "b", label: "DNS cache piena", correct: false, explain: "Non causa collisioni L2." },
      { id: "c", label: "Certificato TLS scaduto", correct: false, explain: "È un problema applicativo HTTPS." },
    ],
  },
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function TerminalGame({
  onComplete,
}: {
  onComplete?: (score: number, meta?: Record<string, unknown>) => Promise<void> | void;
} = {}) {
  const [deck] = useState(() => shuffle(CHALLENGES).slice(0, 8));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const challenge = deck[index];
  const progress = useMemo(() => `${index + 1}/${deck.length}`, [index, deck.length]);

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
    if (index >= deck.length - 1) {
      setDone(true);
      if (onComplete) {
        await onComplete(score, { answered: deck.length });
      } else {
        toast.success(`Sfida completata · ${score} punti`);
      }
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

      <div className="overflow-hidden rounded-xl border bg-slate-950 text-slate-100 shadow-inner">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-xs text-slate-400">
          <span className="size-2 rounded-full bg-rose-500" />
          <span className="size-2 rounded-full bg-amber-400" />
          <span className="size-2 rounded-full bg-emerald-500" />
          <span className="ml-2 font-mono">helpdesk@lab:~$</span>
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
          <Button type="button" onClick={next} disabled={!selected} className="bg-teal-700 hover:bg-teal-800">
            {index >= deck.length - 1 ? "Termina" : "Prossima sfida"}
          </Button>
        ) : (
          <Button type="button" onClick={reset} variant="outline">
            Rigioca
          </Button>
        )}
      </div>
    </div>
  );
}
