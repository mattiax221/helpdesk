"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AddStudentForm({ classroomId }: { classroomId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSingle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/classrooms/${classroomId}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: fd.get("firstName"),
        lastName: fd.get("lastName"),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Impossibile aggiungere lo studente");
      return;
    }
    toast.success("Studente aggiunto al roster");
    e.currentTarget.reset();
    router.refresh();
  }

  async function onBulk(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/classrooms/${classroomId}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines: fd.get("lines") }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Import non riuscito");
      return;
    }
    const data = await res.json();
    toast.success(`Import: ${data.added} nuovi, ${data.skipped} già presenti`);
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <Tabs defaultValue="single">
      <TabsList>
        <TabsTrigger value="single">Singolo</TabsTrigger>
        <TabsTrigger value="bulk">Import elenco</TabsTrigger>
      </TabsList>
      <TabsContent value="single" className="pt-3">
        <form className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]" onSubmit={onSingle}>
          <div className="space-y-1">
            <Label htmlFor="firstName">Nome</Label>
            <Input id="firstName" name="firstName" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="lastName">Cognome</Label>
            <Input id="lastName" name="lastName" required />
          </div>
          <Button type="submit" className="self-end bg-teal-700 hover:bg-teal-800" disabled={loading}>
            Aggiungi
          </Button>
        </form>
      </TabsContent>
      <TabsContent value="bulk" className="pt-3">
        <form className="space-y-2" onSubmit={onBulk}>
          <Label htmlFor="lines">Un studente per riga (Nome Cognome)</Label>
          <Textarea
            id="lines"
            name="lines"
            rows={5}
            placeholder={"Anna Bianchi\nLuca Verdi\nSara Neri"}
            required
          />
          <Button type="submit" className="bg-teal-700 hover:bg-teal-800" disabled={loading}>
            Importa roster
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
