"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Student = { id: string; name: string | null };
type Group = {
  id: string;
  name: string;
  members: { user: Student }[];
};

export function GroupsPanel({
  classroomId,
  students,
  initialGroups,
}: {
  classroomId: string;
  students: Student[];
  initialGroups: Group[];
}) {
  const router = useRouter();
  const [groups, setGroups] = useState(initialGroups);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedLabel = useMemo(
    () =>
      selected
        .map((id) => students.find((s) => s.id === id)?.name || id)
        .join(", "),
    [selected, students],
  );

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length < 1) {
      toast.error("Seleziona almeno uno studente");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/classrooms/${classroomId}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, studentIds: selected }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Creazione gruppo fallita");
      return;
    }
    const data = await res.json();
    setGroups((prev) => [...prev, data.group].sort((a, b) => a.name.localeCompare(b.name)));
    setName("");
    setSelected([]);
    toast.success(`Gruppo "${data.group.name}" creato`);
    router.refresh();
  }

  async function removeGroup(groupId: string) {
    setLoading(true);
    const res = await fetch(`/api/classrooms/${classroomId}/groups/${groupId}`, {
      method: "DELETE",
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Eliminazione non riuscita");
      return;
    }
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    toast.success("Gruppo eliminato");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Gruppi di lavoro</CardTitle>
        <CardDescription>
          Crea team (es. Helpdesk A / Reti B) e assegna i ticket al gruppo intero.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-3" onSubmit={createGroup}>
          <div className="space-y-1">
            <Label htmlFor="groupName">Nome gruppo</Label>
            <Input
              id="groupName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. Team Alfa"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Membri</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {students.map((s) => {
                const checked = selected.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelected((prev) =>
                          checked ? prev.filter((id) => id !== s.id) : [...prev, s.id],
                        )
                      }
                    />
                    {s.name}
                  </label>
                );
              })}
            </div>
            {selected.length > 0 && (
              <p className="text-xs text-muted-foreground">Selezionati: {selectedLabel}</p>
            )}
          </div>
          <Button type="submit" className="bg-teal-700 hover:bg-teal-800" disabled={loading}>
            Crea gruppo
          </Button>
        </form>

        <div className="space-y-2">
          {groups.length === 0 && (
            <p className="text-sm text-muted-foreground">Nessun gruppo ancora.</p>
          )}
          {groups.map((g) => (
            <div key={g.id} className="rounded-md border p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-medium">{g.name}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={loading}
                  onClick={() => removeGroup(g.id)}
                >
                  Elimina
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {g.members.map((m) => (
                  <Badge key={m.user.id} variant="secondary">
                    {m.user.name}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
