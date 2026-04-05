"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useAuth } from "@clerk/nextjs";
import {
  Home,
  Users,
  Calendar,
  Settings,
  Tv,
} from "lucide-react";
import { MobileNav } from "@/components/mobile-nav";

const navItems = [
  { href: "/app", icon: Home, label: "Dashboard" },
  { href: "/app/family", icon: Users, label: "Family" },
  { href: "/app/calendar", icon: Calendar, label: "Calendar" },
  { href: "/app/settings", icon: Settings, label: "Settings" },
];

function SignedOutFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#0D0D0F" }}
    >
      <div className="text-center space-y-4">
        <p className="text-sm" style={{ color: "#A8A8B0" }}>
          You need to sign in to access your family space.
        </p>
        <Link href="/sign-in">
          <button
            className="px-4 py-2 rounded-md font-medium border-0 transition-all duration-150
              focus-visible:outline-2 focus-visible:outline-[#2D5A3D] focus-visible:outline-offset-2
              hover:brightness-110"
            style={{
              backgroundColor: "#2D5A4A",
              color: "#FDF8F3",
              boxShadow: "0 4px 16px rgba(45,90,74,0.3)",
            }}
          >
            Sign in
          </button>
        </Link>
      </div>
    </div>
  );
}

function AppShellContent({ pathname, children }: { pathname: string; children: React.ReactNode }) {
  return (
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
                    data-testid={`desktop-nav-${item.label.toLowerCase()}`}
                    className={`
                      flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[48px]
                      focus-visible:outline-2 focus-visible:outline-[#2D5A3D] focus-visible:outline-offset-2
                      hover:bg-[#252529] hover:text-[#E8E8EC]
                    `}
                    style={{
                      color: isActive ? "#E8E8EC" : "#A8A8B0",
                      backgroundColor: isActive ? "#252529" : "transparent",
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
                  userButtonAvatarBox: "w-12 h-12 rounded-full",
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
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  // CTM-59 fix: Call useAuth() and usePathname() unconditionally and before any
  // early returns. This ensures hooks are called in the same order on every render,
  // preventing "Rendered more hooks than during the previous render." errors.
  //
  // Previously, <Show when="signed-in"> was used. Show internally calls useAuth()
  // and when isLoaded=false, it returned null — suppressing its children (and their
  // hooks: useState + usePathname in MobileNav). When auth finished loading and
  // user was signed in, MobileNav's hooks suddenly rendered, causing React to throw.
  //
  // The fix: useAuth() is always called at the top of AppShell. The isLoaded check
  // gates which UI renders, but hooks are always called in the same order.
  const { isLoaded, userId } = useAuth();
  const pathname = usePathname();

  if (!isLoaded) {
    return <SignedOutFallback />;
  }

  if (!userId) {
    return <SignedOutFallback />;
  }

  return <AppShellContent pathname={pathname}>{children}</AppShellContent>;
}

// Default export as alias for the named export
export default AppShell;
