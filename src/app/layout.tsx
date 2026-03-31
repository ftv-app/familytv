// NOTE: The application name shown in Clerk's hosted UI (sign-in, account portal, etc.)
// is configured in Clerk's Dashboard (dashboard.clerk.com) > Settings > General > Application Name.
// It cannot be set via the ClerkProvider SDK props. Set it to "FamilyTV" there.
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

/* ---- FamilyTV Fonts ---- */
/* Heading: Fraunces - warm serif with personality, not Inter */
const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

/* Body: Plus Jakarta Sans - geometric but warm, highly readable */
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FamilyTV — Your Family's Private Place to Share",
  description:
    "Photos, videos, and calendars shared only with family. No ads, no algorithms. Start your private family space for free.",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  alternates: {
    canonical: "https://familytv.vercel.app",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://familytv.vercel.app",
    siteName: "FamilyTV",
    title: "FamilyTV — Your Family's Private Place to Share",
    description:
      "Photos, videos, and calendars shared only with family. No ads, no algorithms. Start your private family space for free.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FamilyTV — Your Family's Private Place to Share",
    description:
      "Photos, videos, and calendars shared only with family. No ads, no algorithms. Start your private family space for free.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${plusJakarta.variable} ${fraunces.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-background text-foreground">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "FamilyTV",
                url: "https://familytv.vercel.app",
                logo: "https://familytv.vercel.app/favicon.ico",
                description:
                  "Private family social media platform for sharing photos, videos, and calendars with family only.",
                sameAs: [],
              }),
            }}
          />
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <ErrorBoundary>{children}</ErrorBoundary>
            <Analytics />
          </ThemeProvider>
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: "oklch(0.18 0.015 50)",
                color: "oklch(0.98 0.005 50)",
                border: "1px solid oklch(0.86 0.008 50)",
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
