const PREFIXES = ["IT", "RET", "SYS", "SEC", "LAB", "HD"];

export function generateClassroomCode(): string {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}
