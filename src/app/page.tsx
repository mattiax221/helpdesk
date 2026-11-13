import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ensureSeeded } from "@/lib/ensure-seed";

export default async function HomePage() {
  await ensureSeeded();
  const session = await auth();
  if (!session?.user) redirect("/login");
  redirect(session.user.role === "TEACHER" ? "/teacher" : "/student");
}
