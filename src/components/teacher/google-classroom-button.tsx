"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function GoogleClassroomButton({
  classroomId,
  linked,
}: {
  classroomId: string;
  linked: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function connect() {
    setLoading(true);
    const res = await fetch(`/api/classrooms/${classroomId}/google`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error || "Operazione non riuscita");
      return;
    }
    toast.message(data.message || "Google Classroom predisposto");
  }

  return (
    <Button variant="outline" size="sm" onClick={connect} disabled={loading}>
      {linked ? "Classroom ✓" : "Collega Google Classroom"}
    </Button>
  );
}
