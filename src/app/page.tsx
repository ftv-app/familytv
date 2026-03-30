"use client";

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

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0D0D0F' }}>
      {/* Header */}
      <header 
        className="border-b sticky top-0 z-10"
        style={{ 
          backgroundColor: 'rgba(26, 26, 30, 0.85)', 
          borderColor: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* TV Icon */}
            <div 
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#C41E3A' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FDF8F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
                <polyline points="17 2 12 7 7 2"/>
              </svg>
            </div>
            <span 
              className="font-heading text-xl font-semibold tracking-wide"
              style={{ color: '#D4AF37' }}
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
                style={{ color: '#8E8E96' }}
              >
                Sign in
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button 
                size="sm" 
                className="border-0"
                style={{ backgroundColor: '#2D5A4A', color: '#FDF8F3' }}
              >
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — TV Channel aesthetic */}
      <main className="flex-1">
        <section className="py-16 sm:py-24 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            {/* Channel Callsign */}
            <div className="mb-6">
              <span 
                className="font-heading text-sm tracking-[0.3em] uppercase"
                style={{ color: '#8E8E96' }}
              >
                ★ Now Streaming ★
              </span>
            </div>
            
            <h1 
              className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight"
              style={{ color: '#E8E8EC' }}
            >
              Your family&apos;s
              <br />
              <span style={{ color: '#D4AF37' }} className="glow-gold">private channel</span>
            </h1>
            
            <p 
              className="text-lg mb-10 max-w-xl mx-auto leading-relaxed"
              style={{ color: '#8E8E96' }}
            >
              Photos, videos, and live moments — shared only with family. 
              No ads, no algorithms, no strangers. Just your people, seeing what matters.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto text-base px-8 border-0"
                  style={{ backgroundColor: '#2D5A4A', color: '#FDF8F3' }}
                >
                  Start your channel — free
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-base px-8 border"
                  style={{ 
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#8E8E96',
                    backgroundColor: 'transparent'
                  }}
                >
                  Already broadcasting
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 
              className="font-heading text-3xl font-semibold text-center mb-10 tracking-wide"
              style={{ color: '#E8E8EC' }}
            >
              HOW IT WORKS
            </h2>
            <div className="space-y-6">
              <div 
                className="flex gap-4 items-start p-4 rounded-lg"
                style={{ backgroundColor: '#1A1A1E', border: '1px solid rgba(255, 255, 255, 0.06)' }}
              >
                <div 
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-heading font-semibold text-sm"
                  style={{ backgroundColor: '#2D5A4A', color: '#FDF8F3' }}
                >
                  1
                </div>
                <div>
                  <h3 
                    className="font-heading font-semibold mb-1"
                    style={{ color: '#E8E8EC' }}
                  >
                    Create your family channel
                  </h3>
                  <p 
                    className="text-sm leading-relaxed"
                    style={{ color: '#8E8E96' }}
                  >
                    Sign up in seconds — no credit card needed. Your channel is ready immediately.
                  </p>
                </div>
              </div>
              
              <div 
                className="flex gap-4 items-start p-4 rounded-lg"
                style={{ backgroundColor: '#1A1A1E', border: '1px solid rgba(255, 255, 255, 0.06)' }}
              >
                <div 
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-heading font-semibold text-sm"
                  style={{ backgroundColor: '#2D5A4A', color: '#FDF8F3' }}
                >
                  2
                </div>
                <div>
                  <h3 
                    className="font-heading font-semibold mb-1"
                    style={{ color: '#E8E8EC' }}
                  >
                    Invite your family
                  </h3>
                  <p 
                    className="text-sm leading-relaxed"
                    style={{ color: '#8E8E96' }}
                  >
                    Share a simple link — no app downloads required. Anyone can join on any device.
                  </p>
                </div>
              </div>
              
              <div 
                className="flex gap-4 items-start p-4 rounded-lg"
                style={{ backgroundColor: '#1A1A1E', border: '1px solid rgba(255, 255, 255, 0.06)' }}
              >
                <div 
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-heading font-semibold text-sm"
                  style={{ backgroundColor: '#2D5A4A', color: '#FDF8F3' }}
                >
                  3
                </div>
                <div>
                  <h3 
                    className="font-heading font-semibold mb-1"
                    style={{ color: '#E8E8EC' }}
                  >
                    Share what matters
                  </h3>
                  <p 
                    className="text-sm leading-relaxed"
                    style={{ color: '#8E8E96' }}
                  >
                    Post photos, videos, and go live. Everything stays private to your family.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section 
          className="py-12 sm:py-16 px-4 sm:px-6 border-y"
          style={{ borderColor: 'rgba(255, 255, 255, 0.06)', backgroundColor: '#1A1A1E' }}
        >
          <div className="max-w-5xl mx-auto">
            <h2 
              className="font-heading text-3xl font-semibold text-center mb-12 tracking-wide"
              style={{ color: '#E8E8EC' }}
            >
              YOUR CHANNEL INCLUDES
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card 
                className="border-0"
                style={{ backgroundColor: '#252529' }}
              >
                <CardHeader className="pb-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: 'rgba(196, 30, 58, 0.15)' }}>
                    <Image size={20} style={{ color: '#C41E3A' }} />
                  </div>
                  <CardTitle 
                    className="text-lg font-heading"
                    style={{ color: '#E8E8EC' }}
                  >
                    Photo & Video
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription 
                    className="text-base"
                    style={{ color: '#8E8E96' }}
                  >
                    Share memories in high quality. No compression, no limits on what your family can see.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card 
                className="border-0"
                style={{ backgroundColor: '#252529' }}
              >
                <CardHeader className="pb-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)' }}>
                    <Star size={20} style={{ color: '#D4AF37' }} />
                  </div>
                  <CardTitle 
                    className="text-lg font-heading"
                    style={{ color: '#E8E8EC' }}
                  >
                    Live Broadcasting
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription 
                    className="text-base"
                    style={{ color: '#8E8E96' }}
                  >
                    Go live and share moments in real-time. Family everywhere can watch together.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card 
                className="border-0"
                style={{ backgroundColor: '#252529' }}
              >
                <CardHeader className="pb-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: 'rgba(46, 204, 113, 0.15)' }}>
                    <Calendar size={20} style={{ color: '#2ECC71' }} />
                  </div>
                  <CardTitle 
                    className="text-lg font-heading"
                    style={{ color: '#E8E8EC' }}
                  >
                    Family Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription 
                    className="text-base"
                    style={{ color: '#8E8E96' }}
                  >
                    Birthdays, events, reunions — everyone sees what&apos;s coming up. Never miss a moment.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Privacy callout */}
        <section className="py-12 sm:py-20 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(46, 204, 113, 0.15)' }}>
              <Users size={24} style={{ color: '#2ECC71' }} />
            </div>
            <h2 
              className="font-heading text-2xl font-semibold mb-4"
              style={{ color: '#E8E8EC' }}
            >
              Family privacy, guaranteed.
            </h2>
            <p 
              className="leading-relaxed"
              style={{ color: '#8E8E96' }}
            >
              We don&apos;t sell your data. We don&apos;t show ads. We don&apos;t use your family&apos;s 
              photos to train AI. FamilyTV is built to protect what you share, not exploit it.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer 
        className="border-t py-8 px-4 sm:px-6"
        style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ backgroundColor: '#C41E3A' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FDF8F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
                <polyline points="17 2 12 7 7 2"/>
              </svg>
            </div>
            <span 
              className="font-heading text-sm"
              style={{ color: '#8E8E96' }}
            >
              FamilyTV
            </span>
          </div>
          <p 
            className="text-sm"
            style={{ color: '#8E8E96' }}
          >
            Made for families, with privacy first.
          </p>
        </div>
      </footer>
    </div>
  );
}
