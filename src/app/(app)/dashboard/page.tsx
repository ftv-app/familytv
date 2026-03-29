import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-lg">
                F
              </span>
            </div>
            <span className="font-heading text-xl font-semibold text-foreground">
              FamilyTV
            </span>
          </div>
          <div className="flex items-center gap-3">
            {user?.username && (
              <span className="text-sm text-muted-foreground">
                @{user.username}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="font-heading text-3xl font-semibold text-foreground mb-2">
          Welcome back
        </h1>
        <p className="text-muted-foreground mb-8">
          Your family dashboard is coming soon. For now, enjoy the landing page!
        </p>

        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-foreground">
            👋 You&apos;re signed in as <strong>{user?.primaryEmailAddress?.emailAddress}</strong>
          </p>
        </div>
      </main>
    </div>
  );
}
