"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Rj45Game } from "@/components/labs/rj45-game";
import { TerminalGame } from "@/components/labs/terminal-game";
import { PortsGame } from "@/components/labs/ports-game";
import { SubnetGame } from "@/components/labs/subnet-game";
import { OsiGame } from "@/components/labs/osi-game";
import { CliGame } from "@/components/labs/cli-game";
import { WifiGame } from "@/components/labs/wifi-game";
import { OsDesktop } from "@/components/labs/os-desktop";
import { LabBench } from "@/components/labs/lab-bench";
import { reportLabScore } from "@/lib/lab-score";
import type { LabGameKey } from "@/lib/lab-catalog";

export function LabGamePlayer({
  gameKey,
  taskId,
  minScore,
}: {
  gameKey: LabGameKey | string;
  taskId: string;
  minScore: number;
}) {
  const router = useRouter();

  async function onComplete(score: number, meta?: Record<string, unknown>) {
    try {
      const data = await reportLabScore({
        gameKey,
        score,
        taskId,
        meta,
      });
      if (data.completed) {
        toast.success(`Compito consegnato! Best ${data.bestScore} · +${data.xpEarned} XP`);
      } else if (score < minScore) {
        toast.message(
          `Punteggio ${score}. Serve almeno ${minScore} per consegnare. Riprova! (+${data.xpEarned} XP)`,
        );
      } else {
        toast.success(`+${data.xpEarned} XP · best ${data.bestScore}`);
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore salvataggio");
    }
  }

  switch (gameKey) {
    case "rj45":
      return <Rj45Game onComplete={onComplete} />;
    case "terminal":
      return <TerminalGame onComplete={onComplete} />;
    case "ports":
      return <PortsGame onComplete={onComplete} />;
    case "subnet":
      return <SubnetGame onComplete={onComplete} />;
    case "osi":
      return <OsiGame onComplete={onComplete} />;
    case "cli":
      return <CliGame onComplete={onComplete} />;
    case "wifi":
      return <WifiGame onComplete={onComplete} />;
    case "ossim":
      return <OsDesktop onComplete={onComplete} />;
    case "bench":
      return <LabBench onComplete={onComplete} />;
    default:
      return <p className="text-sm text-muted-foreground">Gioco non trovato.</p>;
  }
}
