"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Lightbulb,
  Map,
  Rocket,
  CheckCircle2,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type RoadmapRow = {
  id: string;
  title: string;
  description: string;
  status: "IDEA" | "PLANNED" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  category: string;
};

const COLUMNS: Array<{
  status: RoadmapRow["status"];
  title: string;
  hint: string;
  icon: typeof Lightbulb;
  accent: string;
}> = [
  {
    status: "IDEA",
    title: "Idee",
    hint: "Da valutare",
    icon: Lightbulb,
    accent: "from-sky-500/15 to-transparent",
  },
  {
    status: "PLANNED",
    title: "In piano",
    hint: "Prossimi step",
    icon: Map,
    accent: "from-teal-500/15 to-transparent",
  },
  {
    status: "IN_PROGRESS",
    title: "In corso",
    hint: "Ci stiamo lavorando",
    icon: Rocket,
    accent: "from-amber-500/15 to-transparent",
  },
  {
    status: "DONE",
    title: "Fatto",
    hint: "Spedito",
    icon: CheckCircle2,
    accent: "from-emerald-500/15 to-transparent",
  },
];

const PRIORITY_LABEL: Record<RoadmapRow["priority"], string> = {
  LOW: "Bassa",
  MEDIUM: "Media",
  HIGH: "Alta",
};

const NEXT_STATUS: Record<RoadmapRow["status"], RoadmapRow["status"] | null> = {
  IDEA: "PLANNED",
  PLANNED: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: null,
};

export function RoadmapBoard({
  initialItems,
  canEdit,
}: {
  initialItems: RoadmapRow[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Didattica");
  const [priority, setPriority] = useState<RoadmapRow["priority"]>("MEDIUM");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<string>("ALL");

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category));
    return ["ALL", ...[...set].sort()];
  }, [items]);

  const visible = items.filter((i) => filter === "ALL" || i.category === filter);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    const res = await fetch("/api/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, category, priority, status: "IDEA" }),
    });
    setBusy(false);
    if (!res.ok) {
      toast.error("Impossibile aggiungere");
      return;
    }
    const data = await res.json();
    setItems((prev) => [data.item, ...prev]);
    setTitle("");
    setDescription("");
    toast.success("Idea aggiunta alla roadmap");
    router.refresh();
  }

  async function move(item: RoadmapRow) {
    const next = NEXT_STATUS[item.status];
    if (!next) return;
    const res = await fetch(`/api/roadmap/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) {
      toast.error("Aggiornamento non riuscito");
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: next } : i)));
    toast.success(`Spostato in ${COLUMNS.find((c) => c.status === next)?.title}`);
    router.refresh();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/roadmap/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Eliminazione non riuscita");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Rimosso");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <Button
            key={c}
            type="button"
            size="sm"
            variant={filter === c ? "default" : "outline"}
            className={cn(filter === c && "bg-teal-700 hover:bg-teal-800")}
            onClick={() => setFilter(c)}
          >
            {c === "ALL" ? "Tutte" : c}
          </Button>
        ))}
      </div>

      {canEdit && (
        <form
          onSubmit={addItem}
          className="rounded-2xl border border-teal-900/10 bg-gradient-to-br from-teal-50/80 via-background to-slate-50 p-4 shadow-sm dark:from-teal-950/30 dark:to-slate-950"
        >
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="size-4 text-teal-700" />
            Nuova funzione / idea
          </div>
          <div className="grid gap-3 md:grid-cols-[1.4fr_0.8fr_0.6fr]">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Es. Modalità esame a tempo"
              required
            />
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Categoria"
            />
            <select
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={priority}
              onChange={(e) => setPriority(e.target.value as RoadmapRow["priority"])}
            >
              <option value="HIGH">Priorità alta</option>
              <option value="MEDIUM">Priorità media</option>
              <option value="LOW">Priorità bassa</option>
            </select>
          </div>
          <Textarea
            className="mt-3"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve nota su perché serve e come dovrebbe funzionare"
          />
          <Button
            type="submit"
            disabled={busy}
            className="mt-3 bg-teal-700 hover:bg-teal-800"
          >
            <Plus className="mr-1 size-4" />
            Aggiungi alla roadmap
          </Button>
        </form>
      )}

      <div className="grid gap-4 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const Icon = col.icon;
          const colItems = visible.filter((i) => i.status === col.status);
          return (
            <section
              key={col.status}
              className="flex min-h-[320px] flex-col overflow-hidden rounded-2xl border bg-background/80"
            >
              <div className={cn("border-b bg-gradient-to-r p-3", col.accent)}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4" />
                    <h2 className="text-sm font-semibold">{col.title}</h2>
                  </div>
                  <Badge variant="secondary">{colItems.length}</Badge>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{col.hint}</p>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-2">
                {colItems.length === 0 && (
                  <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                    Vuoto per ora
                  </p>
                )}
                {colItems.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border bg-card p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="mb-2 flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">
                        {item.category}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px]",
                          item.priority === "HIGH" && "bg-rose-100 text-rose-800 dark:bg-rose-950",
                          item.priority === "MEDIUM" && "bg-amber-100 text-amber-900 dark:bg-amber-950",
                        )}
                      >
                        {PRIORITY_LABEL[item.priority]}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-semibold leading-snug">{item.title}</h3>
                    {item.description && (
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                    {canEdit && (
                      <div className="mt-3 flex gap-1">
                        {NEXT_STATUS[item.status] && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => move(item)}
                          >
                            Avanza →
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="ml-auto h-7 text-xs text-rose-700"
                          onClick={() => remove(item.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
