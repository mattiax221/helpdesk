"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddStudentForm({ classroomId }: { classroomId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
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

  return (
    <form className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]" onSubmit={onSubmit}>
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
  );
}
