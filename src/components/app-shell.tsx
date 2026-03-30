"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, SignOutButton, UserButton } from "@clerk/nextjs";
import { Home, Calendar, Users, Settings, Image, Tv, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/app", icon: Home, label: "Dashboard" },
  { href: "/app/family", icon: Users, label: "Family" },
  { href: "/app/calendar", icon: Calendar, label: "Calendar" },
  { href: "/app/settings", icon: Settings, label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium">
                Sign in
              </button>
            </Link>
          </div>
        </div>
      }
    >
      <div className="min-h-screen flex flex-col bg-cinema-black">
        {/* App header - Theater Charcoal */}
        <header className="border-b border-ghost-border bg-theater-charcoal sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            {/* Logo */}
            <Link href="/app" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <Tv className="w-4 h-4 text-cream" />
              </div>
              <span className="font-heading text-xl font-semibold text-gold hidden sm:block">
                FamilyTV
              </span>
            </Link>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
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

        {/* Main content */}
        <main className="flex-1 py-6 px-4 sm:py-8 sm:px-6">
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>
      </div>
    </Show>
  );
}
