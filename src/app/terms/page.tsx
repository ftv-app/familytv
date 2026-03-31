import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "FamilyTV Terms of Service — the rules for using our private family sharing platform.",
};

export default function TermsPage() {
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
          Terms of Service
        </h1>

        <div className="prose prose-stone max-w-none space-y-6 text-muted-foreground">
          <p className="text-base">Last updated: March 30, 2026</p>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              1. Acceptance of terms
            </h2>
            <p>
              By creating a FamilyTV account or using any part of our service, you agree to
              these Terms of Service. If you do not agree, please do not use FamilyTV.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              2. Who can use FamilyTV
            </h2>
            <p>
              FamilyTV is for personal family use. You must be at least 13 years old to
              create an account. You are responsible for the activity that happens under
              your account, and you agree to keep your sign-in credentials secure.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              3. Family groups and invites
            </h2>
            <p>
              Each FamilyTV account can belong to one family group. The person who creates
              a family group is the owner and can invite other members. Invite links are
              personal — you should only share them with the person you're inviting. We
              reserve the right to revoke invite links that are being used in a way that
              violates these terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              4. What you can share
            </h2>
            <p>
              You retain ownership of everything you post on FamilyTV. By posting content,
              you grant FamilyTV a limited license to store and display it to the family
              members you choose to share it with. You are responsible for ensuring that
              the content you post does not infringe on the rights of others.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              5. What you cannot share
            </h2>
            <p>
              You may not post content that is unlawful, harmful, threatening, defamatory,
              or that violates the rights of others. FamilyTV is a private space for
              families — we will remove content that violates these terms and may
              terminate accounts that repeatedly break the rules.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              6. Our service and availability
            </h2>
            <p>
              FamilyTV is provided "as is." While we aim to keep the service reliable and
              available, we do not guarantee uninterrupted access. We may update, modify,
              or discontinue features from time to time. We will give reasonable notice
              of significant changes.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              7. Account termination
            </h2>
            <p>
              You can delete your account at any time from your settings. If your account
              is deleted, your personal data will be removed as described in our Privacy
              Policy. Content you have shared within a family group may remain with that
              group if other members have not also deleted their accounts.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              8. Changes to these terms
            </h2>
            <p>
              We may update these terms from time to time. For significant changes, we will
              notify you by email or through the app. Your continued use of FamilyTV after
              any changes means you accept the updated terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">
              9. Contact
            </h2>
            <p>
              Questions about these terms? Reach us at{" "}
              <a
                href="mailto:legal@familytv.app"
                className="text-primary hover:underline"
              >
                legal@familytv.app
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
