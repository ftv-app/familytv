import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "FamilyTV Privacy Policy — how we protect your family's private photos, videos, and data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-lg">F</span>
            </div>
            <span className="font-heading text-xl font-semibold text-foreground">FamilyTV</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">Back to home</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="font-heading text-4xl font-semibold text-foreground mb-8">
          Privacy Policy
        </h1>

        <div className="prose prose-stone max-w-none space-y-6 text-muted-foreground">
          <p className="text-base">Last updated: March 30, 2026</p>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              1. What we collect
            </h2>
            <p>
              FamilyTV collects only what you provide: your email address when you sign up,
              and the photos, videos, calendar events, and posts you choose to share within
              your family group. We do not collect browsing data, location data, or device
              information beyond what is strictly necessary to operate the service.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              2. How we use your data
            </h2>
            <p>
              Your data is used solely to operate FamilyTV — displaying your family&apos;s
              content to the family members you choose to invite. We do not use your
              family&apos;s photos or videos to train AI models. We do not sell your data to
              third parties. We do not display ads based on your content.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              3. Who can see your content
            </h2>
            <p>
              Only the family members you explicitly invite can view your posts, photos,
              videos, and calendar events. Each family is completely isolated — we do not
              have a public feed, discovery feature, or any way for non-members to see
              your content.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              4. Data storage and security
            </h2>
            <p>
              Your data is stored on servers in the United States. We use industry-standard
              encryption for data in transit and at rest. Access to our database is restricted
              to authorized personnel only.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              5. Your rights
            </h2>
            <p>
              You can export or delete your account and all associated data at any time
              from your account settings. If you have questions about your data, contact us
              at{" "}
              <a
                href="mailto:privacy@familytv.app"
                className="text-primary hover:underline"
              >
                privacy@familytv.app
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              6. Cookies
            </h2>
            <p>
              FamilyTV uses a small number of authentication cookies that are essential to
              keeping you signed in. We do not use tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              7. Changes to this policy
            </h2>
            <p>
              If we make changes to this privacy policy, we will update the &quot;Last updated&quot;
              date above and, for significant changes, notify you by email or through the
              app. Your continued use of FamilyTV after any changes means you accept the
              updated policy.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
