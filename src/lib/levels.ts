export type Level = {
  level: number;
  title: string;
  min: number;
  next: number | null;
};

const STEPS: { level: number; title: string; min: number }[] = [
  { level: 1, title: "Tirocinante", min: 0 },
  { level: 2, title: "Tecnico L1", min: 50 },
  { level: 3, title: "Tecnico L2", min: 150 },
  { level: 4, title: "Specialist", min: 300 },
  { level: 5, title: "Referente", min: 500 },
];

export function levelForXp(xp: number): Level {
  const safe = Math.max(0, xp);
  let current = STEPS[0];
  for (const step of STEPS) {
    if (safe >= step.min) current = step;
  }
  const nextStep = STEPS.find((step) => step.min > current.min);
  return {
    level: current.level,
    title: current.title,
    min: current.min,
    next: nextStep ? nextStep.min : null,
  };
}

export const LEVEL_STEPS = STEPS;
