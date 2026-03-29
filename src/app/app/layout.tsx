"use client";

import { useState } from "react";
import { Show, SignOutButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  Calendar,
  Users,
  Settings,
  X,
  Menu,
} from "lucide-react";

function MobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  const navItems = [
    { href: "/app", label: "Dashboard", icon: Home },
    { href: "/app/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-card shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-sm">
                F
              </span>
            </div>
            <span className="font-heading text-lg font-semibold text-foreground">
              FamilyTV
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-muted transition-colors min-h-[44px]"
            >
              <item.icon className="w-5 h-5 text-muted-foreground shrink-0" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="px-3 py-2">
            <p className="text-xs text-muted-foreground">Signed in</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="sm:hidden w-10 h-10 rounded-lg hover:bg-muted flex items-center justify-center transition-colors shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>

            <Link href="/app" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shrink-0">
                <span className="text-primary-foreground font-heading font-bold text-sm">
                  F
                </span>
              </div>
              <span className="font-heading text-lg font-semibold text-foreground">
                FamilyTV
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-1">
              <Link
                href="/app"
                className="px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/app/settings"
                className="px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Settings
              </Link>
            </nav>

            <div className="flex items-center gap-2">
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

        {/* Mobile nav drawer */}
        <MobileNav
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />

        <main className="flex-1 py-6 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>
      </div>
    </Show>
  );
}
