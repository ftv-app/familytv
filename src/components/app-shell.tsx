"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, SignOutButton, UserButton } from "@clerk/nextjs";
import {
  Home,
  Users,
  Calendar,
  Settings,
  Tv,
  LogOut,
  Menu,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { href: "/app", icon: Home, label: "Dashboard" },
  { href: "/app/family", icon: Users, label: "Family" },
  { href: "/app/calendar", icon: Calendar, label: "Calendar" },
  { href: "/app/settings", icon: Settings, label: "Settings" },
];

function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger>
        <button
          className="flex items-center justify-center w-11 h-11 rounded-lg transition-colors"
          style={{ color: "#8E8E96" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#252529")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0" style={{ backgroundColor: "#1A1A1E" }}>
        <SheetHeader className="p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <SheetTitle className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ backgroundColor: "#2D5A4A" }}
            >
              <Tv className="w-4 h-4" style={{ color: "#FDF8F3" }} />
            </div>
            <span
              className="font-heading text-lg font-semibold"
              style={{
                color: "#D4AF37",
                textShadow: "0 0 16px rgba(212,175,55,0.4)",
              }}
            >
              FamilyTV
            </span>
          </SheetTitle>
        </SheetHeader>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors"
                style={{
                  backgroundColor: isActive ? "#252529" : "transparent",
                  color: isActive ? "#E8E8EC" : "#8E8E96",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "#252529";
                    e.currentTarget.style.color = "#E8E8EC";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "#8E8E96";
                  }
                }}
                onClick={() => setOpen(false)}
              >
                <item.icon
                  className="w-5 h-5 shrink-0"
                  style={{ color: isActive ? "#D4AF37" : "inherit" }}
                />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
          <div
            className="pt-4 mt-4 border-t"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <p
              className="px-3 py-2 text-xs font-medium uppercase tracking-wider"
              style={{ color: "#5A5A62" }}
            >
              Account
            </p>
            <SignOutButton>
              <button
                className="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors w-full text-left"
                style={{ color: "#8E8E96" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#252529";
                  e.currentTarget.style.color = "#E8E8EC";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#8E8E96";
                }}
                onClick={() => { window.location.href = "/"; }}
              >
                <LogOut className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">Sign out</span>
              </button>
            </SignOutButton>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <Show
      when="signed-in"
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "#0D0D0F" }}
        >
          <div className="text-center space-y-4">
            <p className="text-sm" style={{ color: "#8E8E96" }}>
              You need to sign in to access your family space.
            </p>
            <Link href="/sign-in">
              <button
                className="px-4 py-2 rounded-md font-medium border-0 transition-all duration-150"
                style={{
                  backgroundColor: "#2D5A4A",
                  color: "#FDF8F3",
                  boxShadow: "0 4px 16px rgba(45,90,74,0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#3D7A64";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(45,90,74,0.5), 0 0 40px rgba(45,90,74,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#2D5A4A";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(45,90,74,0.3)";
                }}
              >
                Sign in
              </button>
            </Link>
          </div>
        </div>
      }
    >
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0D0D0F" }}>
        {/* Film grain overlay */}
        <div
          className="fixed inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            opacity: 0.03,
            mixBlendMode: "overlay",
            zIndex: 9999,
          }}
        />

        {/* App header */}
        <header
          className="sticky top-0 z-10 border-b"
          style={{
            backgroundColor: "rgba(26,26,30,0.95)",
            borderColor: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            {/* Mobile: hamburger + logo | Desktop: logo + nav */}
            <div className="flex items-center gap-2">
              <MobileNav />
              <Link href="/app" className="flex items-center gap-2">
                {/* TV icon */}
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: "#2D5A4A" }}
                >
                  <Tv className="w-4 h-4" style={{ color: "#FDF8F3" }} />
                </div>
                {/* Broadcast Gold brand name */}
                <span
                  className="font-heading text-lg font-semibold hidden sm:block"
                  style={{
                    color: "#D4AF37",
                    textShadow: "0 0 16px rgba(212,175,55,0.4)",
                  }}
                >
                  FamilyTV
                </span>
              </Link>

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-1 ml-6">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        color: isActive ? "#E8E8EC" : "#8E8E96",
                        backgroundColor: isActive ? "#252529" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = "#252529";
                          e.currentTarget.style.color = "#E8E8EC";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#8E8E96";
                        }
                      }}
                    >
                      <item.icon
                        className="w-4 h-4"
                        style={{ color: isActive ? "#D4AF37" : "inherit" }}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right side */}
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

        {/* Main content */}
        <main className="flex-1 py-6 px-4 sm:py-8 sm:px-6">
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>
      </div>
    </Show>
  );
}

// Default export as alias for the named export
export default AppShell;
