#!/usr/bin/env node
/**
 * Vercel build: SQLite file DB cannot run on serverless.
 * If DATABASE_URL looks like Postgres, patch Prisma provider then generate + push + build.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const schemaPath = resolve("prisma/schema.prisma");
const databaseUrl = process.env.DATABASE_URL || "";
const isPostgres = /^(postgres|postgresql):\/\//i.test(databaseUrl);

if (!databaseUrl) {
  console.error("DATABASE_URL is required for Vercel builds.");
  process.exit(1);
}

if (isPostgres) {
  let schema = readFileSync(schemaPath, "utf8");
  if (schema.includes('provider = "sqlite"')) {
    schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
    writeFileSync(schemaPath, schema);
    console.log("Prisma provider switched to postgresql for Vercel.");
  }
} else if (databaseUrl.startsWith("file:")) {
  console.warn(
    "WARNING: SQLite file URLs are not durable on Vercel. Use Neon/Supabase Postgres.",
  );
}

execSync("npx prisma generate", { stdio: "inherit" });
execSync("npx prisma db push --skip-generate", { stdio: "inherit" });

if (process.env.SEED_ON_DEPLOY === "1") {
  console.log("SEED_ON_DEPLOY=1 → running seed…");
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
}

execSync("npx next build", { stdio: "inherit" });
