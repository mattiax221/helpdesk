"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

type Challenge = {
  network: string;
  cidr: number;
  hostsNeeded: number;
  ask: "hosts" | "network" | "broadcast" | "mask";
};

function ipToInt(ip: string): number {
  return ip.split(".").reduce((acc, o) => (acc << 8) + Number(o), 0) >>> 0;
}

function intToIp(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

function maskFromCidr(cidr: number): string {
  const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  return intToIp(mask);
}

function networkAddress(ip: string, cidr: number): string {
  const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  return intToIp((ipToInt(ip) & mask) >>> 0);
}

function broadcastAddress(ip: string, cidr: number): string {
  const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  const wild = ~mask >>> 0;
  return intToIp((ipToInt(ip) & mask) + wild);
}

function usableHosts(cidr: number): number {
  if (cidr >= 31) return cidr === 31 ? 2 : 1;
  return Math.max(0, 2 ** (32 - cidr) - 2);
}

const BASES = [
  { network: "192.168.10.0", cidr: 24 },
  { network: "10.0.0.0", cidr: 8 },
  { network: "172.16.0.0", cidr: 12 },
  { network: "192.168.1.0", cidr: 26 },
  { network: "10.20.30.0", cidr: 28 },
  { network: "172.20.5.0", cidr: 25 },
  { network: "192.168.50.64", cidr: 27 },
  { network: "10.8.0.0", cidr: 22 },
];

function makeChallenge(): Challenge {
  const base = BASES[Math.floor(Math.random() * BASES.length)];
  const asks: Challenge["ask"][] = ["hosts", "network", "broadcast", "mask"];
  const ask = asks[Math.floor(Math.random() * asks.length)];
  return {
    network: base.network,
    cidr: base.cidr,
    hostsNeeded: usableHosts(base.cidr),
    ask,
  };
}

function expectedAnswer(c: Challenge): string {
  switch (c.ask) {
    case "hosts":
      return String(usableHosts(c.cidr));
    case "network":
      return networkAddress(c.network, c.cidr);
    case "broadcast":
      return broadcastAddress(c.network, c.cidr);
    case "mask":
      return maskFromCidr(c.cidr);
  }
}

function promptFor(c: Challenge): string {
  switch (c.ask) {
    case "hosts":
      return `Quanti host utilizzabili in ${c.network}/${c.cidr}?`;
    case "network":
      return `Indirizzo di rete di ${c.network}/${c.cidr}?`;
    case "broadcast":
      return `Broadcast di ${c.network}/${c.cidr}?`;
    case "mask":
      return `Maschera decimale di /${c.cidr}?`;
  }
}

export function SubnetGame() {
  const [challenge, setChallenge] = useState<Challenge>(() => makeChallenge());
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [seconds, setSeconds] = useState(90);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [streak, setStreak] = useState(0);

  const hint = useMemo(() => {
    if (challenge.ask === "hosts") return "Formula: 2^(32-CIDR) − 2 (eccetto /31 e /32)";
    if (challenge.ask === "mask") return "Es. /24 → 255.255.255.0";
    return "Allinea i bit di rete e host";
  }, [challenge.ask]);

  useEffect(() => {
    if (!running || done) return;
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          setDone(true);
          toast.error("Tempo scaduto");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, done]);

  function start() {
    setChallenge(makeChallenge());
    setAnswer("");
    setScore(0);
    setRound(1);
    setSeconds(90);
    setRunning(true);
    setDone(false);
    setStreak(0);
  }

  async function finish(finalScore: number) {
    setDone(true);
    setRunning(false);
    const res = await fetch("/api/games/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameKey: "subnet",
        score: finalScore,
        meta: { rounds: round, streak, secondsLeft: seconds },
      }),
    });
    const data = await res.json().catch(() => ({}));
    toast.success(`Subnet Lab completato! +${data.xpEarned ?? 0} XP`);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!running || done) return;
    const expected = expectedAnswer(challenge).trim().toLowerCase();
    const given = answer.trim().toLowerCase();
    if (given === expected) {
      const nextScore = score + 20 + streak * 2;
      const nextRound = round + 1;
      setScore(nextScore);
      setStreak((s) => s + 1);
      toast.success("Corretto!");
      if (nextRound > 8) {
        await finish(nextScore + seconds);
        return;
      }
      setRound(nextRound);
      setChallenge(makeChallenge());
      setAnswer("");
    } else {
      setStreak(0);
      toast.error(`Errato. Atteso: ${expectedAnswer(challenge)}`);
      setAnswer("");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">Tempo {seconds}s</Badge>
        <Badge variant="outline">Round {Math.min(round, 8)}/8</Badge>
        <Badge>Score {score}</Badge>
        {streak > 1 && <Badge variant="outline">Streak ×{streak}</Badge>}
        <Button type="button" size="sm" className="ml-auto bg-teal-700 hover:bg-teal-800" onClick={start}>
          {running ? "Ricomincia" : "Avvia"}
        </Button>
      </div>

      {!running && !done && (
        <p className="text-sm text-muted-foreground">
          Calcola host, rete, broadcast e maschera CIDR. 8 round a tempo.
        </p>
      )}

      {(running || done) && (
        <form onSubmit={submit} className="space-y-3 rounded-md border p-4">
          <p className="font-mono text-sm font-medium">{promptFor(challenge)}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
          <div className="space-y-2">
            <Label htmlFor="subnet-answer">Risposta</Label>
            <Input
              id="subnet-answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={challenge.ask === "hosts" ? "254" : "192.168.10.0"}
              disabled={!running || done}
              autoComplete="off"
            />
          </div>
          <Button type="submit" disabled={!running || done || !answer.trim()} className="bg-teal-700 hover:bg-teal-800">
            Conferma
          </Button>
        </form>
      )}

      {done && (
        <p className="text-sm text-muted-foreground">
          Partita terminata. Punteggio finale: <strong>{score}</strong>
        </p>
      )}
    </div>
  );
}
