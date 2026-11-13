import { NextResponse } from "next/server";
import { scanAndNotifyOverdue } from "@/lib/overdue-notices";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // In local/dev without secret, allow only non-production.
    return process.env.NODE_ENV !== "production";
  }
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await scanAndNotifyOverdue();
  return NextResponse.json({ ok: true, ...result, at: new Date().toISOString() });
}

export async function POST(req: Request) {
  return GET(req);
}
