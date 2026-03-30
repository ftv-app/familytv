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
  title: "FamilyTV — Private Family Sharing",
  description:
    "The private place for families to share photos, videos, and calendars. No ads, no algorithms, just family.",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
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
