import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              You need to sign in to access your family space.
            </p>
            <a href="/sign-in">
              <Button>Sign in</Button>
            </a>
          </div>
        </div>
      </SignedOut>
    </>
  );
}
