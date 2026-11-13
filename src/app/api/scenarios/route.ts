import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api";
import { listScenarioCatalog } from "@/lib/ai";

export async function GET() {
  const { user, error } = await requireApiUser("TEACHER");
  if (error || !user) return error!;
  return NextResponse.json({ scenarios: listScenarioCatalog() });
}
