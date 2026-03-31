import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
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

const APP_URL = "https://familytv.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "FamilyTV — Private Family Sharing",
    template: "%s | FamilyTV",
  },
  description:
    "The private place for families to share photos, videos, and calendars. No ads, no algorithms, just family.",
  keywords: [
    "family photo sharing",
    "private family app",
    "family calendar",
    "family memories",
    "no ads social media",
  ],
  authors: [{ name: "FamilyTV" }],
  creator: "FamilyTV",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "FamilyTV",
    title: "FamilyTV — Your Family's Private Space to Share Memories",
    description:
      "Share photos, videos, and calendars only with family. No ads, no algorithms, no strangers.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FamilyTV — Private Family Sharing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FamilyTV — Your Family's Private Space",
    description:
      "Share photos, videos, and calendars only with family. No ads, no algorithms.",
    images: ["/og-image.png"],
    creator: "@familytv",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
          {children}
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
