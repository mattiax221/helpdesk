export async function reportLabScore(input: {
  gameKey: string;
  score: number;
  taskId?: string;
  meta?: Record<string, unknown>;
}): Promise<{ xpEarned: number; completed?: boolean; bestScore?: number }> {
  const res = await fetch("/api/games/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      gameKey: input.gameKey,
      score: input.score,
      taskId: input.taskId,
      meta: input.meta ?? {},
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Salvataggio punteggio fallito");
  }
  return {
    xpEarned: data.xpEarned ?? 0,
    completed: data.completed,
    bestScore: data.bestScore,
  };
}
