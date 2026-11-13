"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORY_LABELS, DIFFICULTY_LABELS, PRIORITY_LABELS } from "@/lib/labels";

type ClassroomOption = {
  id: string;
  name: string;
  code: string;
  students: { id: string; name: string | null }[];
  groups: { id: string; name: string; memberIds: string[] }[];
};

const categories = Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[];
const priorities = Object.keys(PRIORITY_LABELS) as (keyof typeof PRIORITY_LABELS)[];
const difficulties = Object.keys(DIFFICULTY_LABELS) as (keyof typeof DIFFICULTY_LABELS)[];

export function TicketForm({
  classrooms,
  defaultClassroomId,
}: {
  classrooms: ClassroomOption[];
  defaultClassroomId?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [classroomId, setClassroomId] = useState(defaultClassroomId || classrooms[0]?.id || "");
  const [assignTo, setAssignTo] = useState<"all" | "selected" | "group">("all");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [groupId, setGroupId] = useState("");
  const [catalog, setCatalog] = useState<
    { id: number; title: string; category: string; difficulty: string; priority: string }[]
  >([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "RETI_DNS",
    priority: "MEDIA",
    difficulty: "INTERMEDIO",
    slaMinutes: 60,
    secretNotes: "",
    fakeLogs: "ipconfig.txt\n(incolla log qui)",
    clientHints: "Indizio 1\nIndizio 2\nIndizio 3",
    theme: "",
  });

  useEffect(() => {
    fetch("/api/scenarios")
      .then((r) => r.json())
      .then((d) => setCatalog(d.scenarios || []))
      .catch(() => undefined);
  }, []);

  function applyTicket(t: {
    title: string;
    description: string;
    category: string;
    priority: string;
    difficulty: string;
    slaMinutes: number;
    secretNotes: string;
    fakeLogs: { name: string; content: string }[];
    clientHints: string[];
  }) {
    setForm((prev) => ({
      ...prev,
      title: t.title,
      description: t.description,
      category: t.category,
      priority: t.priority,
      difficulty: t.difficulty,
      slaMinutes: t.slaMinutes,
      secretNotes: t.secretNotes,
      fakeLogs: (t.fakeLogs || [])
        .map((l) => `### ${l.name}\n${l.content}`)
        .join("\n\n"),
      clientHints: (t.clientHints || []).join("\n"),
    }));
  }

  const students = useMemo(
    () => classrooms.find((c) => c.id === classroomId)?.students || [],
    [classrooms, classroomId],
  );
  const groups = useMemo(
    () => classrooms.find((c) => c.id === classroomId)?.groups || [],
    [classrooms, classroomId],
  );

  useEffect(() => {
    setGroupId(groups[0]?.id || "");
    setSelectedStudents([]);
  }, [classroomId, groups]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function generateAi() {
    setAiLoading(true);
    const res = await fetch("/api/generate-ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: form.category,
        difficulty: form.difficulty,
        theme: form.theme || undefined,
      }),
    });
    setAiLoading(false);
    if (!res.ok) {
      toast.error("Generazione AI non riuscita");
      return;
    }
    const data = await res.json();
    applyTicket(data.ticket);
    toast.success(
      data.source === "mock"
        ? `Scenario dal catalogo locale (${data.bankSize} disponibili)`
        : data.source === "catalog"
          ? "Scenario caricato dal catalogo"
          : "Ticket generato con AI",
    );
  }

  async function loadScenario(id: number) {
    setAiLoading(true);
    const res = await fetch("/api/generate-ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioId: id }),
    });
    setAiLoading(false);
    if (!res.ok) {
      toast.error("Scenario non caricabile");
      return;
    }
    const data = await res.json();
    applyTicket(data.ticket);
    toast.success("Scenario pronto da assegnare");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!classroomId) {
      toast.error("Seleziona una classe");
      return;
    }
    setLoading(true);

    const logs = form.fakeLogs
      .split(/###\s+/)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => {
        const [nameLine, ...rest] = chunk.split("\n");
        return {
          name: nameLine.trim() || "log.txt",
          content: rest.join("\n").trim() || chunk,
        };
      });

    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classroomId,
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
        difficulty: form.difficulty,
        slaMinutes: Number(form.slaMinutes),
        secretNotes: form.secretNotes,
        fakeLogs: logs.length
          ? logs
          : [{ name: "note.txt", content: form.fakeLogs }],
        attachmentsMeta: [
          ...(logs.length
            ? logs
            : [{ name: "note.txt", content: form.fakeLogs }]
          ).map((l) => ({ name: l.name, type: "text/plain" })),
          { name: "screenshot-cliente.png", type: "image/png" },
        ],
        clientHints: form.clientHints.split("\n").map((s) => s.trim()).filter(Boolean),
        assignTo,
        studentIds: selectedStudents,
        groupId: assignTo === "group" ? groupId : undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Creazione ticket fallita");
      return;
    }
    toast.success(
      assignTo === "group" ? "Ticket assegnato al gruppo" : "Ticket assegnato agli studenti",
    );
    router.push(`/teacher/classrooms/${classroomId}`);
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Assegnazione</CardTitle>
          <CardDescription>Scegli classe e destinatari del ticket.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Classe</Label>
            <Select value={classroomId} onValueChange={(v) => setClassroomId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona classe" />
              </SelectTrigger>
              <SelectContent>
                {classrooms.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Destinatari</Label>
            <Select
              value={assignTo}
              onValueChange={(v) =>
                setAssignTo((v as "all" | "selected" | "group") || "all")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutta la classe</SelectItem>
                <SelectItem value="selected">Studenti selezionati</SelectItem>
                <SelectItem value="group">Gruppo di lavoro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {assignTo === "group" && (
            <div className="md:col-span-2 space-y-2">
              <Label>Gruppo</Label>
              {groups.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nessun gruppo in questa classe. Creane uno dalla pagina classe.
                </p>
              ) : (
                <Select value={groupId} onValueChange={(v) => setGroupId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona gruppo" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name} ({g.memberIds.length} membri)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
          {assignTo === "selected" && (
            <div className="md:col-span-2 space-y-2">
              <Label>Studenti</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {students.map((s) => {
                  const checked = selectedStudents.includes(s.id);
                  return (
                    <label key={s.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedStudents((prev) =>
                            checked ? prev.filter((id) => id !== s.id) : [...prev, s.id],
                          )
                        }
                      />
                      {s.name}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="manual">
        <TabsList>
          <TabsTrigger value="manual">Manuale</TabsTrigger>
          <TabsTrigger value="ai">Generatore AI</TabsTrigger>
          <TabsTrigger value="catalog">Catalogo scenari</TabsTrigger>
        </TabsList>
        <TabsContent value="ai" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-4 text-amber-600" />
                Genera scenario realistico
              </CardTitle>
              <CardDescription>
                Catalogo locale ricco di default; con OpenAI/Gemini genera varianti uniche sul tema.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => update("category", v || form.category)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Difficoltà</Label>
                <Select
                  value={form.difficulty}
                  onValueChange={(v) => update("difficulty", v || form.difficulty)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map((d) => (
                      <SelectItem key={d} value={d}>
                        {DIFFICULTY_LABELS[d]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tema (opzionale)</Label>
                <Input
                  value={form.theme}
                  onChange={(e) => update("theme", e.target.value)}
                  placeholder="es. open day / ransomware / VPN"
                />
              </div>
              <Button
                type="button"
                className="md:col-span-3 bg-amber-600 hover:bg-amber-700"
                onClick={generateAi}
                disabled={aiLoading}
              >
                {aiLoading ? "Generazione..." : "Genera ticket casuale / AI"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="catalog" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Library className="size-4 text-teal-700" />
                Banca scenari ({catalog.length})
              </CardTitle>
              <CardDescription>
                Scegli uno scenario pronto: sintomi vaghi, log e soluzione nascosta già compilati.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid max-h-[360px] gap-2 overflow-y-auto sm:grid-cols-2">
              {catalog.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={aiLoading}
                  onClick={() => loadScenario(s.id)}
                  className="rounded-md border px-3 py-2 text-left text-sm transition hover:border-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30"
                >
                  <p className="font-medium leading-snug">{s.title}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {s.category} · {s.difficulty} · {s.priority}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="manual" />
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Dettaglio ticket</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label>Titolo</Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Descrizione cliente (spesso vaga)</Label>
            <Textarea
              rows={5}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => update("category", v || form.category)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priorità</Label>
              <Select value={form.priority} onValueChange={(v) => update("priority", v || form.priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Difficoltà</Label>
              <Select
                value={form.difficulty}
                onValueChange={(v) => update("difficulty", v || form.difficulty)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map((d) => (
                    <SelectItem key={d} value={d}>
                      {DIFFICULTY_LABELS[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>SLA (minuti)</Label>
              <Input
                type="number"
                min={10}
                value={form.slaMinutes}
                onChange={(e) => update("slaMinutes", Number(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Log / allegati fittizi</Label>
            <Textarea
              rows={6}
              className="font-mono text-xs"
              value={form.fakeLogs}
              onChange={(e) => update("fakeLogs", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Note segrete docente (causa + soluzione attesa)</Label>
            <Textarea
              rows={4}
              value={form.secretNotes}
              onChange={(e) => update("secretNotes", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Indizi cliente (uno per riga)</Label>
            <Textarea
              rows={3}
              value={form.clientHints}
              onChange={(e) => update("clientHints", e.target.value)}
            />
          </div>
          <Button className="bg-teal-700 hover:bg-teal-800" disabled={loading}>
            {loading ? "Salvataggio..." : "Crea e assegna ticket"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
