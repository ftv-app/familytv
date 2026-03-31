"use client";

import { useState } from "react";
import { Show, SignOutButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Home,
  Users,
  Calendar,
  Image,
  Plus,
  Menu,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="md:hidden">
        <button
          className="flex items-center justify-center w-12 h-12 rounded-lg hover:bg-muted transition-colors focus-visible:outline-2 focus-visible:outline focus-visible:outline-[#2D5A4A] focus-visible:offset-2"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <Menu className="w-6 h-6 text-foreground" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-sm">
                F
              </span>
            </div>
            <span className="font-heading text-lg font-semibold text-foreground">
              FamilyTV
            </span>
          </SheetTitle>
        </SheetHeader>
        <nav className="p-3 space-y-1">
          <Link
            href="/app"
            className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors focus-visible:outline-2 focus-visible:outline focus-visible:outline-[#2D5A4A] focus-visible:offset-2"
            onClick={() => setOpen(false)}
          >
            <Home className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Dashboard</span>
          </Link>
          <Link
            href="/app/create-family"
            className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors focus-visible:outline-2 focus-visible:outline focus-visible:outline-[#2D5A4A] focus-visible:offset-2"
            onClick={() => setOpen(false)}
          >
            <Plus className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Create family</span>
          </Link>
          <div className="pt-4 mt-4 border-t border-border">
            <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Account
            </p>
            <SignOutButton>
              <button
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors w-full text-left focus-visible:outline-2 focus-visible:outline focus-visible:outline-[#2D5A4A] focus-visible:offset-2"
                onClick={() => { window.location.href = "/"; }}
              >
                <LogOut className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Sign out</span>
              </button>
            </SignOutButton>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Show
      when="signed-in"
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
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
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            {/* Mobile: hamburger + logo | Desktop: logo only */}
            <div className="flex items-center gap-2">
              <MobileNav />
              <Link href="/app" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-heading font-bold text-sm">
                    F
                  </span>
                </div>
                <span className="font-heading text-lg font-semibold text-foreground hidden sm:block">
                  FamilyTV
                </span>
              </Link>
            </div>

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
        <main className="flex-1 py-6 px-4 sm:py-8 sm:px-6">
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>
      </div>
    </Show>
  );
}
