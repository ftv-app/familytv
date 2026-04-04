import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protect all /app routes — redirect to sign-in if not authenticated
  // This must be in a server component to avoid hydration mismatches
  // (server renders AppShell only after auth is confirmed)
  let userId: string | null = null;
  try {
    const { userId: uid } = await auth();
    userId = uid;
  } catch {
    redirect("/sign-in");
  }

  if (!userId) {
    redirect("/sign-in");
  }

  return <AppShell>{children}</AppShell>;
}
