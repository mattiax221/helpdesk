import { OS_SCENARIOS } from "@/lib/os-sim";

export type DesktopAction = { label: string; ok: boolean };

export type DesktopAttempt = {
  score: number;
  at: string;
  scenarioTitle: string;
  report: string;
  actions: DesktopAction[];
  keywordsHit: string[];
  keywordsMiss: string[];
  notes: string[];
};

export function parseDesktopAttempt(
  metaRaw: string,
  score: number,
  createdAt: Date,
): DesktopAttempt | null {
  let meta: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(metaRaw) as unknown;
    if (parsed && typeof parsed === "object") meta = parsed as Record<string, unknown>;
  } catch {
    return null;
  }
  if (typeof meta.report !== "string") return null;

  const scenarioId = typeof meta.scenarioId === "string" ? meta.scenarioId : "";
  const known = OS_SCENARIOS.find((s) => s.id === scenarioId);
  const actions = Array.isArray(meta.actions)
    ? meta.actions.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as { label?: unknown; ok?: unknown };
        if (typeof row.label !== "string") return [];
        return [{ label: row.label, ok: row.ok === true }];
      })
    : [];
  const strings = (value: unknown) =>
    Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];

  return {
    score,
    at: createdAt.toISOString(),
    scenarioTitle:
      typeof meta.scenarioTitle === "string"
        ? meta.scenarioTitle
        : known?.title || "Desktop",
    report: meta.report,
    actions,
    keywordsHit: strings(meta.keywordsHit),
    keywordsMiss: strings(meta.keywordsMiss),
    notes: strings(meta.notes),
  };
}
