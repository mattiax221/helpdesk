#!/usr/bin/env node
/**
 * Vercel build: SQLite file DB cannot run on serverless.
 * If DATABASE_URL looks like Postgres, patch Prisma provider then generate + push + build.
 *
 * Supabase: DATABASE_URL should be the pooler (6543) for the app.
 * DIRECT_URL should be the direct/session URL (5432) for prisma db push — pooler often hangs.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const schemaPath = resolve("prisma/schema.prisma");
const databaseUrl = process.env.DATABASE_URL || "";
const directUrl = process.env.DIRECT_URL || "";
const isPostgres = /^(postgres|postgresql):\/\//i.test(databaseUrl);

if (!databaseUrl) {
  console.error("DATABASE_URL is required for Vercel builds.");
  process.exit(1);
}

const looksLikePooler =
  databaseUrl.includes("pooler.supabase.com") ||
  databaseUrl.includes(":6543/") ||
  databaseUrl.includes("pgbouncer=true");

if (isPostgres && looksLikePooler && !directUrl) {
  console.error(
    "Supabase pooler detected, but DIRECT_URL is missing.\n" +
      "Add DIRECT_URL (Session / direct, port 5432) from Supabase → Connect → Prisma.\n" +
      "prisma db push hangs on the Transaction pooler (6543).",
  );
  process.exit(1);
}

if (isPostgres) {
  let schema = readFileSync(schemaPath, "utf8");
  if (schema.includes('provider = "sqlite"')) {
    schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
    console.log("Prisma provider switched to postgresql for Vercel.");
  }
  if (directUrl && !schema.includes("directUrl")) {
    schema = schema.replace(
      /url\s*=\s*env\("DATABASE_URL"\)/,
      'url       = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")',
    );
    console.log("Prisma directUrl enabled for Supabase.");
  }
  writeFileSync(schemaPath, schema);
} else if (databaseUrl.startsWith("file:")) {
  console.warn(
    "WARNING: SQLite file URLs are not durable on Vercel. Use Supabase Postgres.",
  );
}

execSync("npx prisma generate", { stdio: "inherit" });

// Always run schema push against DIRECT_URL when available (avoids pgbouncer hang).
const pushEnv = { ...process.env };
if (directUrl) {
  pushEnv.DATABASE_URL = directUrl;
  console.log("Running prisma db push via DIRECT_URL…");
} else {
  console.log("Running prisma db push via DATABASE_URL…");
}
execSync("npx prisma db push --skip-generate --accept-data-loss", {
  stdio: "inherit",
  env: pushEnv,
});

if (process.env.SEED_ON_DEPLOY === "1") {
  console.log("SEED_ON_DEPLOY=1 → running seed…");
  // Seed also needs a working connection; prefer direct for reliability.
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env: pushEnv });
}

execSync("npx next build", { stdio: "inherit" });
