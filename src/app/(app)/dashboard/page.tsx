import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const firstName = user?.firstName ?? "there";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  // Use placeholder families for now (API not ready)
  const families = [
    { id: "fam_1", name: "The Smiths", memberCount: 4 },
    { id: "fam_2", name: "The Conways", memberCount: 6 },
  ];

  return (
    <DashboardClient
      firstName={firstName}
      email={email}
      families={families}
    />
  );
}
