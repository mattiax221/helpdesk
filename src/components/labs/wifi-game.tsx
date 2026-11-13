"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STANDARDS = ["WEP", "WPA", "WPA2", "WPA3"];
const QUIZ = [
  {
    q: "Quale standard evita meglio gli attacchi di cracking sulle reti scolastiche moderne?",
    options: ["WEP", "WPA-TKIP", "WPA2-AES / WPA3", "Open senza password"],
    answer: "WPA2-AES / WPA3",
  },
  {
    q: "Per gli studenti guest, la pratica migliore è:",
    options: [
      "Stessa password del Wi‑Fi docenti",
      "VLAN guest + captive portal / WPA3 personali",
      "Nascondere solo l'SSID",
      "Disabilitare il firewall",
    ],
    answer: "VLAN guest + captive portal / WPA3 personali",
  },
  {
    q: "WPS PIN sul router di laboratorio è:",
    options: [
      "Consigliato sempre",
      "Sicuro se la password è lunga",
      "Da disabilitare (attacchi di brute force)",
      "Obbligatorio per 802.1X",
    ],
    answer: "Da disabilitare (attacchi di brute force)",
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

export function WifiGame({
  onComplete,
}: {
  onComplete?: (score: number, meta?: Record<string, unknown>) => Promise<void> | void;
}) {
  const [order, setOrder] = useState(() => shuffle(STANDARDS));
  const [quizIndex, setQuizIndex] = useState(0);
  const [phase, setPhase] = useState<"sort" | "quiz" | "done">("sort");
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(70);
  const [running, setRunning] = useState(false);
  const [mistakes, setMistakes] = useState(0);

  useEffect(() => {
    if (!running || phase === "done") return;
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          setPhase("done");
          toast.error("Tempo scaduto");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, phase]);

  function start() {
    setOrder(shuffle(STANDARDS));
    setQuizIndex(0);
    setPhase("sort");
    setScore(0);
    setSeconds(70);
    setRunning(true);
    setMistakes(0);
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  }

  function confirmSort() {
    const ok = order.every((v, i) => v === STANDARDS[i]);
    if (ok) {
      setScore((s) => s + 40);
      toast.success("Ordine sicurezza corretto (dal più debole al più forte)");
      setPhase("quiz");
    } else {
      setMistakes((m) => m + 1);
      toast.error("Ordine errato: dal meno sicuro al più sicuro");
    }
  }

  async function answerQuiz(option: string) {
    const q = QUIZ[quizIndex];
    if (option === q.answer) {
      setScore((s) => s + 20);
      toast.success("Risposta corretta");
    } else {
      setMistakes((m) => m + 1);
      toast.error(`Atteso: ${q.answer}`);
    }
    if (quizIndex + 1 >= QUIZ.length) {
      const finalScore = Math.max(20, score + (option === q.answer ? 20 : 0) + Math.floor(seconds / 2) - mistakes * 4);
      setPhase("done");
      setRunning(false);
      await onComplete?.(finalScore, { mistakes, secondsLeft: seconds });
      toast.success(`Wi‑Fi Lab completato · ${finalScore} pts`);
    } else {
      setQuizIndex((i) => i + 1);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{seconds}s</Badge>
        <Badge variant="outline">Score {score}</Badge>
        <Badge variant="outline">Errori {mistakes}</Badge>
        <Button type="button" size="sm" className="ml-auto bg-teal-700 hover:bg-teal-800" onClick={start}>
          {running ? "Ricomincia" : "Avvia compito"}
        </Button>
      </div>

      {phase === "sort" && running && (
        <div className="space-y-3 rounded-md border p-4">
          <p className="text-sm font-medium">
            Ordina gli standard dal <strong>meno sicuro</strong> al <strong>più sicuro</strong>.
          </p>
          <div className="space-y-2">
            {order.map((item, i) => (
              <div key={item} className="flex items-center gap-2 rounded-md border px-3 py-2">
                <span className="w-6 text-xs text-muted-foreground">{i + 1}</span>
                <span className="flex-1 font-mono text-sm">{item}</span>
                <Button type="button" size="sm" variant="outline" onClick={() => move(i, -1)}>
                  ↑
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => move(i, 1)}>
                  ↓
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" className="bg-teal-700 hover:bg-teal-800" onClick={confirmSort}>
            Conferma ordine
          </Button>
        </div>
      )}

      {phase === "quiz" && running && (
        <div className="space-y-3 rounded-md border p-4">
          <p className="text-xs uppercase text-muted-foreground">
            Domanda {quizIndex + 1}/{QUIZ.length}
          </p>
          <p className="text-sm font-medium">{QUIZ[quizIndex].q}</p>
          <div className="space-y-2">
            {QUIZ[quizIndex].options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => answerQuiz(opt)}
                className={cn(
                  "w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-muted",
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "done" && (
        <p className="text-sm text-muted-foreground">Compito terminato. Puoi rilanciare per migliorare il best score.</p>
      )}
    </div>
  );
}
