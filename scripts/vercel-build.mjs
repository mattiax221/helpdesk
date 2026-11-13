#!/usr/bin/env node
/**
 * Vercel build for Supabase Postgres:
 * - DATABASE_URL = transaction pooler :6543 (app runtime)
 * - DIRECT_URL   = session pooler :5432 (prisma db push / seed)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const schemaPath = resolve("prisma/schema.prisma");
const databaseUrl = process.env.DATABASE_URL || "";
const directUrl = process.env.DIRECT_URL || "";
const isPostgres = /^(postgres|postgresql):\/\//i.test(databaseUrl);

function describeUrl(label, url) {
  try {
    const u = new URL(url);
    console.log(`${label}: host=${u.hostname} port=${u.port || "(default)"} user=${u.username}`);
  } catch {
    console.log(`${label}: (unparseable)`);
  }
}

function isPoolerTransaction(url) {
  return url.includes(":6543") || /pgbouncer=true/i.test(url);
}

if (!databaseUrl) {
  console.error("DATABASE_URL is required for Vercel builds.");
  process.exit(1);
}

describeUrl("DATABASE_URL", databaseUrl);
if (directUrl) describeUrl("DIRECT_URL", directUrl);

if (isPostgres && isPoolerTransaction(databaseUrl) && !directUrl) {
  console.error(
    "DATABASE_URL looks like Supabase transaction pooler (:6543).\n" +
      "Add DIRECT_URL with the Session URL on port 5432.",
  );
  process.exit(1);
}

if (directUrl && isPoolerTransaction(directUrl)) {
  console.error(
    "DIRECT_URL still points to the transaction pooler (:6543 / pgbouncer=true).\n" +
      "Use the Session URL, example:\n" +
      "postgresql://postgres.PROJECT:PASSWORD@aws-….pooler.supabase.com:5432/postgres?sslmode=require",
  );
  process.exit(1);
}

if (isPostgres) {
  let schema = readFileSync(schemaPath, "utf8");
  if (schema.includes('provider = "sqlite"')) {
    schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
    console.log("Prisma provider switched to postgresql for Vercel.");
  }
  // Keep schema simple for build tooling: single url. Runtime on Vercel still
  // gets DATABASE_URL (pooler) from env for the Next.js app.
  schema = schema.replace(/\n\s*directUrl\s*=\s*env\("DIRECT_URL"\)/, "");
  writeFileSync(schemaPath, schema);
} else if (databaseUrl.startsWith("file:")) {
  console.warn(
    "WARNING: SQLite file URLs are not durable on Vercel. Use Supabase Postgres.",
  );
}

execSync("npx prisma generate", { stdio: "inherit" });

const pushEnv = { ...process.env };
const pushUrl = directUrl || databaseUrl;
pushEnv.DATABASE_URL = pushUrl;
// Avoid Prisma preferring a bad DIRECT_URL during CLI.
delete pushEnv.DIRECT_URL;

describeUrl("db push using", pushUrl);
if (isPoolerTransaction(pushUrl)) {
  console.error("Refusing db push on transaction pooler — it hangs. Fix DIRECT_URL.");
  process.exit(1);
}

console.log("Running prisma db push…");
execSync("npx prisma db push --skip-generate --accept-data-loss", {
  stdio: "inherit",
  env: pushEnv,
});

if (process.env.SEED_ON_DEPLOY === "1") {
  console.log("SEED_ON_DEPLOY=1 → running seed…");
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env: pushEnv });
}

execSync("npx next build", { stdio: "inherit" });
