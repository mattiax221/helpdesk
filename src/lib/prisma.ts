import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaVersion?: string;
};

// Bump when Prisma models change so hot reload drops a stale client singleton.
const SCHEMA_VERSION = "lab-tasks-v1";

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getPrisma(): PrismaClient {
  const cached = globalForPrisma.prisma;
  const stale =
    !cached ||
    globalForPrisma.prismaSchemaVersion !== SCHEMA_VERSION ||
    typeof (cached as { labTask?: unknown }).labTask?.findMany !== "function";

  if (stale) {
    if (cached) {
      void cached.$disconnect().catch(() => undefined);
    }
    globalForPrisma.prisma = createPrismaClient();
    globalForPrisma.prismaSchemaVersion = SCHEMA_VERSION;
  }

  return globalForPrisma.prisma!;
}

export const prisma = getPrisma();
