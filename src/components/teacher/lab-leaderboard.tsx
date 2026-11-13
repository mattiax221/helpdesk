import { Gamepad2, Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type LabLeaderRow = {
  userId: string;
  name: string;
  labXp: number;
  bestScore: number;
  plays: number;
};

const GAME_LABELS: Record<string, string> = {
  rj45: "RJ45",
  terminal: "Terminal",
  ports: "Ports",
  subnet: "Subnet",
};

export function LabLeaderboard({
  rows,
  byGame,
}: {
  rows: LabLeaderRow[];
  byGame?: { gameKey: string; top: { name: string; score: number }[] }[];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gamepad2 className="size-4" />
          Classifica Lab
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nessun punteggio mini-game ancora. Gli studenti guadagnano XP in /lab.
          </p>
        ) : (
          <div className="space-y-2">
            {rows.map((r, idx) => (
              <div
                key={r.userId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  {idx < 3 ? (
                    <Medal
                      className={
                        idx === 0
                          ? "size-4 text-amber-500"
                          : idx === 1
                            ? "size-4 text-slate-400"
                            : "size-4 text-amber-800"
                      }
                    />
                  ) : (
                    <span className="w-4 text-xs text-muted-foreground">{idx + 1}</span>
                  )}
                  <span className="font-medium">{r.name}</span>
                </div>
                <div className="flex gap-1.5">
                  <Badge variant="secondary">{r.labXp} XP lab</Badge>
                  <Badge variant="outline">Best {r.bestScore}</Badge>
                  <Badge variant="outline">{r.plays} partite</Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {byGame && byGame.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {byGame.map((g) => (
              <div key={g.gameKey} className="rounded-md border p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {GAME_LABELS[g.gameKey] || g.gameKey}
                </p>
                {g.top.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nessun score</p>
                )}
                {g.top.map((t, i) => (
                  <div key={`${g.gameKey}-${t.name}-${i}`} className="flex justify-between text-xs">
                    <span>{t.name}</span>
                    <span className="font-mono">{t.score}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
