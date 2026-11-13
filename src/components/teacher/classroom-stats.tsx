import { Award, CheckCircle2, Clock3, Star, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClassroomStatsSummary } from "@/lib/classroom-stats";

export function ClassroomStatsPanel({
  stats,
  title = "Statistiche classe",
}: {
  stats: ClassroomStatsSummary;
  title?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={<Trophy className="size-4" />}
          label="XP medi"
          value={`${stats.avgXp}`}
          hint={`${stats.studentCount} studenti`}
        />
        <StatTile
          icon={<CheckCircle2 className="size-4" />}
          label="Ticket chiusi"
          value={`${stats.closedTickets}`}
          hint={`${stats.openTickets} aperti`}
        />
        <StatTile
          icon={<Clock3 className="size-4" />}
          label="In verifica"
          value={`${stats.waitingReview}`}
          hint="da correggere"
        />
        <StatTile
          icon={<Star className="size-4" />}
          label="Voto medio"
          value={stats.avgGrade === null ? "—" : `${stats.avgGrade}/10`}
          hint={`${stats.gradedCount} valutazioni`}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="size-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {stats.students.length === 0 && (
            <p className="text-sm text-muted-foreground">Nessuno studente da mostrare.</p>
          )}
          {stats.students.map((s, idx) => (
            <div
              key={s.userId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 text-xs text-muted-foreground">{idx + 1}.</span>
                <span className="font-medium">{s.name}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary">{s.xp} XP</Badge>
                <Badge variant="outline">Chiusi {s.closedTickets}</Badge>
                {s.waitingReview > 0 && (
                  <Badge variant="outline" className="border-amber-400 text-amber-800">
                    Verifica {s.waitingReview}
                  </Badge>
                )}
                {s.avgGrade !== null ? (
                  <Badge>Media {s.avgGrade}/10</Badge>
                ) : (
                  <Badge variant="outline">Senza voto</Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 pt-4">
        <span className="mt-0.5 rounded-md bg-teal-700/10 p-2 text-teal-800 dark:text-teal-200">
          {icon}
        </span>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}
