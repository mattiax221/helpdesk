"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Headphones, LogOut, Shield } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type RoleName = "ADMIN" | "TEACHER" | "STUDENT";

type AdminUser = {
  id: string;
  email: string | null;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  role: RoleName;
  xp: number;
  memberships: { classroom: { id: string; name: string; code: string } }[];
  _count: { memberships: number; ownedClassrooms: number };
};

type AdminClass = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  owner: { id: string; name: string | null; email: string | null };
  _count: { memberships: number; tickets: number; labTasks: number };
};

const emptyDraft = {
  id: "",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  role: "STUDENT" as RoleName,
  xp: "0",
};

export function AdminConsole({ selfId, userName }: { selfId: string; userName: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [enrollClass, setEnrollClass] = useState("");

  const load = useCallback(async () => {
    setError("");
    const [u, c] = await Promise.all([fetch("/api/admin/users"), fetch("/api/admin/classrooms")]);
    if (!u.ok || !c.ok) {
      setError("Non riesco a leggere utenti o classi.");
      setLoading(false);
      return;
    }
    const uj = (await u.json()) as { users: AdminUser[] };
    const cj = (await c.json()) as { classrooms: AdminClass[] };
    setUsers(uj.users);
    setClasses(cj.classrooms);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function editUser(user: AdminUser) {
    setDraft({
      id: user.id,
      email: user.email || "",
      password: "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.role,
      xp: String(user.xp),
    });
    setEnrollClass(user.memberships[0]?.classroom.id || classes[0]?.id || "");
  }

  async function saveUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      email: draft.email.trim().toLowerCase(),
      password: draft.password,
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      role: draft.role,
      xp: Number(draft.xp) || 0,
    };
    const res = await fetch(draft.id ? `/api/admin/users/${draft.id}` : "/api/admin/users", {
      method: draft.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      toast.error(data.error || "Salvataggio non riuscito");
      return;
    }
    toast.success(draft.id ? "Utente aggiornato" : "Utente creato");
    setDraft(emptyDraft);
    await load();
  }

  async function removeUser(user: AdminUser) {
    if (!confirm(`Eliminare ${user.name || user.email}? I ticket e i punteggi collegati spariscono.`)) return;
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      toast.error(data.error || "Eliminazione non riuscita");
      return;
    }
    toast.success("Utente eliminato");
    if (draft.id === user.id) setDraft(emptyDraft);
    await load();
  }

  async function enroll() {
    if (!draft.id || !enrollClass) return;
    const res = await fetch("/api/admin/memberships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: draft.id, classroomId: enrollClass }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      toast.error(data.error || "Iscrizione non riuscita");
      return;
    }
    toast.success("Studente iscritto alla classe");
    await load();
  }

  async function unenroll(userId: string, classroomId: string) {
    const res = await fetch(
      `/api/admin/memberships?userId=${encodeURIComponent(userId)}&classroomId=${encodeURIComponent(classroomId)}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      toast.error("Rimozione dal roster non riuscita");
      return;
    }
    await load();
  }

  async function saveClass(cls: AdminClass, patch: { name?: string; code?: string; ownerId?: string }) {
    const res = await fetch(`/api/admin/classrooms/${cls.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      toast.error(data.error || "Classe non aggiornata");
      return;
    }
    toast.success("Classe aggiornata");
    await load();
  }

  async function removeClass(cls: AdminClass) {
    if (!confirm(`Eliminare la classe ${cls.name}? Ticket, gruppi e compiti di quella classe spariscono.`)) return;
    const res = await fetch(`/api/admin/classrooms/${cls.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Eliminazione classe non riuscita");
      return;
    }
    toast.success("Classe eliminata");
    await load();
  }

  const editing = users.find((u) => u.id === draft.id);
  const staff = users.filter((u) => u.role === "TEACHER" || u.role === "ADMIN");

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50 via-background to-slate-100 dark:from-slate-950 dark:via-background dark:to-slate-950">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-md bg-teal-700 text-white">
              <Headphones className="size-4" />
            </span>
            HelpDesk Lab
          </Link>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Shield className="size-3.5" /> Admin
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">{userName}</span>
            <Link href="/teacher" className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
              Dashboard docente
            </Link>
            <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/login" })} aria-label="Esci">
              <LogOut />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gestione laboratorio</h1>
          <p className="text-sm text-muted-foreground">
            Utenti, ruoli, password e classi. Le modifiche vanno sul database dell’app, senza una console SQL.
          </p>
        </div>

        {error ? (
          <Card>
            <CardContent className="py-6 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>{draft.id ? "Modifica utente" : "Nuovo utente"}</CardTitle>
              <CardDescription>
                {draft.id ? "Lascia la password vuota per non cambiarla." : "Password di almeno 6 caratteri."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={saveUser}>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="firstName">Nome</Label>
                    <Input
                      id="firstName"
                      value={draft.firstName}
                      onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lastName">Cognome</Label>
                    <Input
                      id="lastName"
                      value={draft.lastName}
                      onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="userEmail">Email</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={draft.email}
                    onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="userPassword">Password</Label>
                  <Input
                    id="userPassword"
                    type="password"
                    value={draft.password}
                    onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                    required={!draft.id}
                    minLength={draft.password ? 6 : undefined}
                    placeholder={draft.id ? "Invariata" : "Minimo 6 caratteri"}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="role">Ruolo</Label>
                    <select
                      id="role"
                      className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                      value={draft.role}
                      onChange={(e) => setDraft({ ...draft, role: e.target.value as RoleName })}
                    >
                      <option value="STUDENT">Studente</option>
                      <option value="TEACHER">Docente</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="xp">XP</Label>
                    <Input
                      id="xp"
                      type="number"
                      min={0}
                      value={draft.xp}
                      onChange={(e) => setDraft({ ...draft, xp: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-teal-700 hover:bg-teal-800" disabled={saving}>
                    {draft.id ? "Salva" : "Crea utente"}
                  </Button>
                  {draft.id ? (
                    <Button type="button" variant="outline" onClick={() => setDraft(emptyDraft)}>
                      Annulla
                    </Button>
                  ) : null}
                </div>
              </form>

              {editing?.role === "STUDENT" ? (
                <div className="mt-4 space-y-2 border-t pt-4">
                  <p className="text-sm font-medium">Roster</p>
                  <ul className="space-y-1 text-sm">
                    {editing.memberships.length === 0 ? (
                      <li className="text-muted-foreground">Nessuna classe.</li>
                    ) : (
                      editing.memberships.map((m) => (
                        <li key={m.classroom.id} className="flex items-center justify-between gap-2">
                          <span>
                            {m.classroom.name}{" "}
                            <span className="text-muted-foreground">({m.classroom.code})</span>
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={() => unenroll(editing.id, m.classroom.id)}
                          >
                            Togli
                          </Button>
                        </li>
                      ))
                    )}
                  </ul>
                  <div className="flex gap-2">
                    <select
                      className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-background px-2 text-sm"
                      value={enrollClass}
                      onChange={(e) => setEnrollClass(e.target.value)}
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <Button type="button" variant="outline" onClick={enroll} disabled={!enrollClass}>
                      Iscrivi
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Utenti</CardTitle>
              <CardDescription>{loading ? "Carico…" : `${users.length} account`}</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr>
                    <th className="pb-2 font-medium">Nome</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Ruolo</th>
                    <th className="pb-2 font-medium">XP</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-border/70">
                      <td className="py-2 pr-2">{user.name || "—"}</td>
                      <td className="py-2 pr-2 text-muted-foreground">{user.email || "—"}</td>
                      <td className="py-2 pr-2">{user.role}</td>
                      <td className="py-2 pr-2">{user.xp}</td>
                      <td className="py-2 text-right whitespace-nowrap">
                        <Button type="button" variant="ghost" size="xs" onClick={() => editUser(user)}>
                          Modifica
                        </Button>
                        {user.id !== selfId ? (
                          <Button type="button" variant="ghost" size="xs" onClick={() => removeUser(user)}>
                            Elimina
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Classi</CardTitle>
            <CardDescription>Nome, codice e docente proprietario. Eliminare una classe cancella i suoi ticket.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {classes.length === 0 && !loading ? (
              <p className="text-sm text-muted-foreground">Nessuna classe.</p>
            ) : null}
            {classes.map((cls) => (
              <ClassRow
                key={cls.id}
                cls={cls}
                staff={staff}
                onSave={(patch) => saveClass(cls, patch)}
                onDelete={() => removeClass(cls)}
              />
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function ClassRow({
  cls,
  staff,
  onSave,
  onDelete,
}: {
  cls: AdminClass;
  staff: AdminUser[];
  onSave: (patch: { name?: string; code?: string; ownerId?: string }) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(cls.name);
  const [code, setCode] = useState(cls.code);
  const [ownerId, setOwnerId] = useState(cls.owner.id);

  useEffect(() => {
    setName(cls.name);
    setCode(cls.code);
    setOwnerId(cls.owner.id);
  }, [cls.name, cls.code, cls.owner.id]);

  return (
    <div className="grid gap-2 rounded-lg border border-border/70 p-3 md:grid-cols-[1fr_140px_1fr_auto] md:items-end">
      <div className="space-y-1">
        <Label>Nome</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Codice</Label>
        <Input value={code} onChange={(e) => setCode(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Proprietario</Label>
        <select
          className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
        >
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name || s.email} ({s.role})
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          {cls._count.memberships} studenti · {cls._count.tickets} ticket · {cls._count.labTasks} attività
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          className="bg-teal-700 hover:bg-teal-800"
          onClick={() => onSave({ name: name.trim(), code: code.trim(), ownerId })}
        >
          Salva
        </Button>
        <Button type="button" variant="destructive" onClick={onDelete}>
          Elimina
        </Button>
      </div>
    </div>
  );
}
