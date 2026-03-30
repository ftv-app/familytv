import type { Metadata, Viewport } from "next";
import { Oswald, Source_Sans_3 } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

/* ---- FamilyTV Fonts ---- */
/* Heading: Oswald — broadcast/station feel, weight 400-700 */
const oswald = Oswald({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/* Body: Source Sans 3 — clean, readable, weight 300-600 */
const sourceSans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FamilyTV — Your Family's Private Channel",
  description:
    "Your private family TV station. Share photos, videos, and live moments with family only. No ads, no algorithms.",
  alternates: {
    canonical: "https://familytv.vercel.app",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://familytv.vercel.app",
    siteName: "FamilyTV",
    title: "FamilyTV — Your Family's Private Channel",
    description:
      "Your private family TV station. Share photos, videos, and live moments with family only. No ads, no algorithms.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FamilyTV — Your Family's Private Channel",
    description:
      "Your private family TV station. Share photos, videos, and live moments with family only. No ads, no algorithms.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        className={`${sourceSans.variable} ${oswald.variable} h-full antialiased dark`}
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
                  "Private family TV station for sharing photos, videos, and live moments with family only.",
                sameAs: [],
              }),
            }}
          />
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <ErrorBoundary>{children}</ErrorBoundary>
            <Analytics />
          </ThemeProvider>
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: "#1A1A1E",
                color: "#E8E8EC",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
