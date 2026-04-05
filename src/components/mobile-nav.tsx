"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
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
  Tv,
} from "lucide-react";

const CINE_BLACK = "#0D0D0F";
const THEATER_CHARCOAL = "#1A1A1E";
const SHADOW_GRAY = "#252529";
const BROADCAST_GOLD = "#D4AF37";
const SILVER_WHITE = "#E8E8EC";
const MUTED_SILVER = "#A8A8B0";

// Family context nav items — shown when inside a family route
const familyNavItems = [
  { href: "/app/family/[familyId]/feed", icon: Home, label: "Feed" },
  { href: "/app/family/[familyId]/albums", icon: Image, label: "Albums" },
  { href: "/app/family/[familyId]/events", icon: Calendar, label: "Events" },
  { href: "/app/family/[familyId]/members", icon: Users, label: "Members" },
];

// Generic nav items — shown when not inside a specific family
const genericNavItems = [
  { href: "/app", icon: Home, label: "Dashboard" },
  { href: "/app/create-family", icon: Plus, label: "Create family" },
];

function isFamilyContext(pathname: string): boolean {
  return /\/app\/family\/[^/]+/.test(pathname);
}

function getNavItems(pathname: string) {
  return isFamilyContext(pathname) ? familyNavItems : genericNavItems;
}

function isActiveNavItem(href: string, pathname: string): boolean {
  // For family nav items, check if pathname starts with the base path
  if (href.includes("[familyId]")) {
    const basePath = href.replace("/[familyId]/", "/");
    const basePattern = basePath.replace("/app/family/", "/app/family/");
    return pathname.includes(basePattern.replace("/feed", "").replace("/albums", "").replace("/events", "").replace("/members", ""));
  }
  return pathname === href;
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const navItems = getNavItems(pathname);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="md:hidden">
        {/*
          CTM-222 + CTM-39 + CTM-34: Hamburger for seniors
          - Tap target: 48×54px minimum
          - Contrast: icon #2D5A3D on #faf8f5 = ~6.5:1 ✓ (WCAG AA)
          - Forest green focus ring per CTM-221
          - "Menu" label for clarity
        */}
        <button
          data-testid="hamburger-menu"
          className="flex items-center gap-1.5 px-3 py-3 rounded-lg border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2D5A3D] focus-visible:outline-offset-2"
          style={{ backgroundColor: "#faf8f5", borderColor: "#2D5A3D", borderWidth: "1px" }}
          aria-label="Open navigation menu"
        >
          <Menu
            className="w-6 h-6 shrink-0"
            style={{ color: "#2D5A3D" }}
            aria-hidden="true"
          />
          <span
            className="text-sm font-semibold tracking-wide pr-1"
            style={{ color: "#2D5A3D" }}
          >
            Menu
          </span>
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0" style={{ backgroundColor: THEATER_CHARCOAL }}>
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
                color: BROADCAST_GOLD,
                textShadow: "0 0 16px rgba(212,175,55,0.4)",
              }}
            >
              FamilyTV
            </span>
          </SheetTitle>
        </SheetHeader>
        <nav className="p-3 space-y-1">
          {navItems.map((item, index) => {
            const active = isActiveNavItem(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`nav-item-${item.label.toLowerCase()}`}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200
                  focus-visible:outline-2 focus-visible:outline-[#2D5A3D] focus-visible:outline-offset-2
                  nav-item-animate
                `}
                style={{
                  backgroundColor: active ? SHADOW_GRAY : "transparent",
                  color: active ? SILVER_WHITE : MUTED_SILVER,
                  animationDelay: `${index * 40}ms`,
                }}
                onClick={() => setOpen(false)}
              >
                <item.icon
                  className="w-5 h-5 shrink-0"
                  style={{ color: active ? BROADCAST_GOLD : "inherit" }}
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
                data-testid="sign-out-button"
                className="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors w-full text-left
                  focus-visible:outline-2 focus-visible:outline-[#2D5A3D] focus-visible:outline-offset-2"
                style={{ color: MUTED_SILVER }}
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

export default MobileNav;
