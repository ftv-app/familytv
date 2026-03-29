import { Show, SignOutButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Show
      when="signed-in"
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              You need to sign in to access your family space.
            </p>
            <Link href="/sign-in">
              <Button>Sign in</Button>
            </Link>
          </div>
        </div>
      }
    >
      <div className="min-h-screen flex flex-col bg-background">
        {/* App header */}
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
            <Link href="/app" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-heading font-bold text-sm">
                  F
                </span>
              </div>
              <span className="font-heading text-lg font-semibold text-foreground">
                FamilyTV
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-8 h-8",
                  },
                }}
              />
            </div>
          </div>
        </header>
        <main className="flex-1 py-8 px-6">
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>
      </div>
    </Show>
  );
}
