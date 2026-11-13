import { NextResponse } from "next/server";
import { listIncidentChains } from "@/lib/incident-chains";
import { requireApiUser } from "@/lib/api";

export async function GET() {
  const { error } = await requireApiUser("TEACHER");
  if (error) return error;
  return NextResponse.json({ chains: listIncidentChains() });
}
