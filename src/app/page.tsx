"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Calendar, Image, Star } from "lucide-react";

/* ---- Hero Image Carousel ---- */
const HERO_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1600&q=80",
    alt: "Family gathering around a table",
  },
  {
    src: "https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?w=1600&q=80",
    alt: "Family sharing a meal outdoors",
  },
  {
    src: "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=1600&q=80",
    alt: "Parents and children playing together",
  },
  {
    src: "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=1600&q=80",
    alt: "Multi-generational family celebration",
  },
  {
    src: "https://images.unsplash.com/photo-1519214605650-76a613ee3248?w=1600&q=80",
    alt: "Family holiday moment",
  },
];

function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    setTimeout(() => setIsTransitioning(false), 850);
  }, [isTransitioning]);

  useEffect(() => {
    const timer = setInterval(goToNext, 5000);
    return () => clearInterval(timer);
  }, [goToNext]);

  // Respect prefers-reduced-motion
  // Lazy initializer — avoids synchronous setState in useEffect (react-hooks rule)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line -- hydration mismatch acceptable here, effect syncs state
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (prefersReducedMotion) {
    return (
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${HERO_IMAGES[0].src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      {HERO_IMAGES.map((img, i) => (
        <div
          key={img.src}
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${img.src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: i === currentIndex ? 1 : 0,
            transition: `opacity 800ms ease-in-out`,
          }}
        />
      ))}
      {/* Cinema Black 45%→20%→45% gradient overlay — image shows through */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(13,13,15,0.45) 0%, rgba(13,13,15,0.2) 50%, rgba(13,13,15,0.45) 100%)",
        }}
      />
      {/* Film grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          opacity: 0.03,
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );
}

/* ---- Social Proof Testimonials ---- */
const TESTIMONIALS = [
  {
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=96&h=96&fit=crop&q=80",
    familyName: "The Richardson Family",
    quote: "Grandma finally gets to see the kids grow up, even from across the country.",
  },
  {
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&q=80",
    familyName: "The Nakamura Family",
    quote: "We share everything — birthday parties, soccer games, random Tuesdays. It feels like we're always together.",
  },
  {
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=96&h=96&fit=crop&q=80",
    familyName: "The O'Brien Family",
    quote: "No more group chats with 47 messages. Just one channel, our family.",
  },
];

function SocialProofSection() {
  return (
    <section className="py-12 px-4 sm:px-6" style={{ backgroundColor: "#0D0D0F" }}>
      <div className="max-w-4xl mx-auto">
        <h2
          className="font-heading text-sm font-semibold text-center mb-8 uppercase tracking-[0.08em]"
          style={{ color: "#A8A8B0" }}
        >
          Families love FamilyTV
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.familyName}
              className="rounded-xl p-4"
              style={{
                backgroundColor: "#1A1A1E",
                border: "1px solid rgba(13,13,15,0.8)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                {/* 48px avatar circle with Broadcast Gold border */}
                <div
                  className="w-12 h-12 rounded-full overflow-hidden shrink-0"
                  style={{
                    border: "2px solid rgba(212,175,55,0.4)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.avatar}
                    alt={t.familyName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span
                  className="font-heading text-sm font-medium"
                  style={{ color: "#D4AF37" }}
                >
                  {t.familyName}
                </span>
              </div>
              {/* Quote with decorative opening mark */}
              <p
                className="text-sm leading-relaxed italic"
                style={{ color: "#E8E8EC" }}
              >
                <span style={{ color: "#D4AF37", fontSize: "20px", lineHeight: 0, verticalAlign: "sub" }}>
                  &ldquo;
                </span>
                {t.quote}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ backgroundColor: "#0D0D0F" }}
    >
      {/* Film grain overlay — fixed, full-page */}
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          opacity: 0.04,
          mixBlendMode: "overlay",
          zIndex: 9999,
        }}
      />

      {/* Header */}
      <header
        className="relative z-10 border-b"
        style={{
          backgroundColor: "rgba(26,26,30,0.85)",
          borderColor: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* TV Icon */}
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#C41E3A" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FDF8F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                <polyline points="17 2 12 7 7 2" />
              </svg>
            </div>
            {/* Broadcast Gold logo with soft glow */}
            <span
              className="font-heading text-xl font-semibold tracking-wide"
              style={{
                color: "#D4AF37",
                textShadow: "0 0 20px rgba(212,175,55,0.5), 0 0 40px rgba(212,175,55,0.2)",
              }}
            >
              FamilyTV
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button
                variant="ghost"
                size="sm"
                className="hover:text-silver"
                style={{ color: "#A8A8B0" }}
              >
                Sign in
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button
                size="sm"
                className="border-0 transition-all duration-150 text-sm"
                style={{
                  backgroundColor: "#2D5A4A",
                  color: "#FDF8F3",
                  boxShadow: "0 4px 16px rgba(45,90,74,0.3)",
                  padding: "8px 16px",
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
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — full-bleed image carousel */}
      <main className="flex-1">
        {/* Carousel: explicit height, not filling the whole main */}
        <div className="relative overflow-hidden" style={{ height: "min(60vh, 480px)", minHeight: "320px" }}>
          <HeroCarousel />
        </div>

        {/* Hero content below the carousel image */}
        <section className="py-16 sm:py-24 px-4 sm:px-6" style={{ backgroundColor: "#0D0D0F" }}>
          <div className="max-w-3xl mx-auto text-center w-full">
            {/* Channel Callsign */}
            <div className="mb-6">
              <span
                className="font-heading text-sm tracking-[0.3em] uppercase"
                style={{ color: "#A8A8B0" }}
              >
                ★ Now Streaming ★
              </span>
            </div>

            <h1
              className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight"
              style={{ color: "#E8E8EC" }}
            >
              Your family&apos;s
              <br />
              <span
                style={{
                  color: "#D4AF37",
                  textShadow: "0 0 30px rgba(212,175,55,0.6), 0 0 60px rgba(212,175,55,0.3)",
                }}
              >
                private channel
              </span>
            </h1>

            <p
              className="text-lg mb-10 max-w-xl mx-auto leading-relaxed"
              style={{ color: "#A8A8B0" }}
            >
              Photos, videos, and live moments — shared only with family.
              No ads, no algorithms, no strangers. Just your people, seeing what matters.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-base px-6 sm:px-8 border-0 transition-all duration-150"
                  style={{
                    backgroundColor: "#2D5A4A",
                    color: "#FDF8F3",
                    boxShadow: "0 4px 20px rgba(45,90,74,0.4), 0 0 40px rgba(45,90,74,0.15)",
                    borderRadius: "8px",
                    padding: "14px 24px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#3D7A64";
                    e.currentTarget.style.boxShadow = "0 4px 24px rgba(45,90,74,0.55), 0 0 50px rgba(45,90,74,0.2)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#2D5A4A";
                    e.currentTarget.style.boxShadow = "0 4px 20px rgba(45,90,74,0.4), 0 0 40px rgba(45,90,74,0.15)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  Start free
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-base px-6 sm:px-8 border"
                  style={{
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "#A8A8B0",
                    backgroundColor: "transparent",
                    borderRadius: "8px",
                    padding: "14px 24px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#E8E8EC";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#A8A8B0";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  }}
                >
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <SocialProofSection />

        {/* How it works */}
        <section className="py-12 sm:py-16 px-4 sm:px-6" style={{ backgroundColor: "#0D0D0F" }}>
          <div className="max-w-3xl mx-auto">
            <h2
              className="font-heading text-3xl font-semibold text-center mb-10 tracking-wide"
              style={{ color: "#E8E8EC" }}
            >
              HOW IT WORKS
            </h2>
            <div className="space-y-6">
              {[
                {
                  num: 1,
                  title: "Create your family channel",
                  desc: "Sign up in seconds — no credit card needed. Your channel is ready immediately.",
                },
                {
                  num: 2,
                  title: "Invite your family",
                  desc: "Share a simple link — no app downloads required. Anyone can join on any device.",
                },
                {
                  num: 3,
                  title: "Share what matters",
                  desc: "Post photos, videos, and go live. Everything stays private to your family.",
                },
              ].map((step) => (
                <div
                  key={step.num}
                  className="flex gap-4 items-start p-4 rounded-lg"
                  style={{
                    backgroundColor: "#1A1A1E",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-heading font-semibold text-sm"
                    style={{ backgroundColor: "#2D5A4A", color: "#FDF8F3" }}
                  >
                    {step.num}
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold mb-1" style={{ color: "#E8E8EC" }}>
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#A8A8B0" }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          className="py-12 sm:py-16 px-4 sm:px-6 border-y"
          style={{
            borderColor: "rgba(255,255,255,0.06)",
            backgroundColor: "#1A1A1E",
          }}
        >
          <div className="max-w-5xl mx-auto">
            <h2
              className="font-heading text-3xl font-semibold text-center mb-12 tracking-wide"
              style={{ color: "#E8E8EC" }}
            >
              YOUR CHANNEL INCLUDES
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  iconBg: "rgba(196,30,58,0.15)",
                  iconColor: "#C41E3A",
                  icon: Image,
                  title: "Photo & Video",
                  desc: "Share memories in high quality. No compression, no limits on what your family can see.",
                },
                {
                  iconBg: "rgba(212,175,55,0.15)",
                  iconColor: "#D4AF37",
                  icon: Star,
                  title: "Live Broadcasting",
                  desc: "Go live and share moments in real-time. Family everywhere can watch together.",
                },
                {
                  iconBg: "rgba(46,204,113,0.15)",
                  iconColor: "#2ECC71",
                  icon: Calendar,
                  title: "Family Calendar",
                  desc: "Birthdays, events, reunions — everyone sees what's coming up. Never miss a moment.",
                },
              ].map((feature) => (
                <Card key={feature.title} className="border-0" style={{ backgroundColor: "#252529" }}>
                  <CardHeader className="pb-2">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                      style={{ backgroundColor: feature.iconBg }}
                    >
                      <feature.icon size={20} style={{ color: feature.iconColor }} />
                    </div>
                    <CardTitle className="text-lg font-heading" style={{ color: "#E8E8EC" }}>
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base" style={{ color: "#A8A8B0" }}>
                      {feature.desc}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy callout */}
        <section className="py-12 sm:py-20 px-4 sm:px-6" style={{ backgroundColor: "#0D0D0F" }}>
          <div className="max-w-2xl mx-auto text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "rgba(46,204,113,0.15)" }}
            >
              <Users size={24} style={{ color: "#2ECC71" }} />
            </div>
            <h2 className="font-heading text-2xl font-semibold mb-4" style={{ color: "#E8E8EC" }}>
              Family privacy, guaranteed.
            </h2>
            <p className="leading-relaxed" style={{ color: "#A8A8B0" }}>
              We don&apos;t sell your data. We don&apos;t show ads. We don&apos;t use your family&apos;s
              photos to train AI. FamilyTV is built to protect what you share, not exploit it.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 border-t py-8 px-4 sm:px-6"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ backgroundColor: "#C41E3A" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FDF8F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                <polyline points="17 2 12 7 7 2" />
              </svg>
            </div>
            <span className="font-heading text-sm" style={{ color: "#A8A8B0" }}>
              FamilyTV
            </span>
          </div>
          <p className="text-sm" style={{ color: "#A8A8B0" }}>
            Made for families, with privacy first.
          </p>
        </div>
      </footer>


    </div>
  );
}
