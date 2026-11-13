import { prisma } from "@/lib/prisma";

let seeding: Promise<void> | null = null;

/** Ensures demo data exists when the SQLite DB is empty (useful on first publish boot). */
export async function ensureSeeded() {
  if (seeding) return seeding;
  seeding = (async () => {
    const count = await prisma.user.count();
    if (count > 0) return;
    // Dynamic import keeps the heavy seed out of the hot path once data exists.
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const execFileAsync = promisify(execFile);
    try {
      await execFileAsync("npx", ["tsx", "prisma/seed.ts"], {
        cwd: process.cwd(),
        env: process.env,
      });
    } catch (error) {
      console.error("Auto-seed failed:", error);
    }
  })();
  return seeding;
}
