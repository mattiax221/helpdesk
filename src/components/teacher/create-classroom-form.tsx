"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function CreateClassroomForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/classrooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        description: fd.get("description"),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Errore creazione classe");
      return;
    }
    const data = await res.json();
    toast.success(`Classe creata · codice ${data.classroom.code}`);
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuova classe</CardTitle>
        <CardDescription>
          Genera automaticamente un Codice Classe univoco da condividere agli studenti.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Nome classe</Label>
            <Input
              id="name"
              name="name"
              placeholder="4ª Tecnico Informatico - Sistemi"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea id="description" name="description" placeholder="Obiettivi del laboratorio..." />
          </div>
          <Button className="w-full bg-teal-700 hover:bg-teal-800" disabled={loading}>
            Crea classe
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
