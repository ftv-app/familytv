import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-lg">
                F
              </span>
            </div>
            <span className="font-heading text-xl font-semibold text-foreground">
              FamilyTV
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="py-16 sm:py-24 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-heading text-4xl sm:text-5xl font-semibold tracking-tight text-foreground mb-6 leading-tight">
              Your family&apos;s private place
              <br />
              <span className="text-primary">to share what matters</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
              Photos, videos, and calendars — shared only with family. No ads,
              no algorithms, no strangers. Just the people you love, seeing what
              you share.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="w-full sm:w-auto text-base px-8">
                  Start your family — it&apos;s free
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-base px-8"
                >
                  Already have an account
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 bg-muted/30 border-y border-border">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-center text-foreground mb-8 sm:mb-12">
              Everything your family needs, nothing they don&apos;t
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-heading">
                    Share privately
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Photos and videos are visible only to people you invite.
                    Your family, nobody else.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-heading">
                    Chronological feed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    No algorithm deciding what you see. Posts appear in the
                    order they happened, like a family album.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-heading">
                    Shared calendar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Birthdays, events, reunions — everyone sees what&apos;s
                    coming up. Never miss a family moment.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Privacy callout */}
        <section className="py-12 sm:py-20 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">
              Privacy isn&apos;t a feature. It&apos;s the foundation.
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We don&apos;t sell your data. We don&apos;t show ads. We don&apos;t
              use your family&apos;s photos to train AI. FamilyTV is built to
              protect what you share, not exploit it.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-xs">
                F
              </span>
            </div>
            <span className="font-heading text-sm text-muted-foreground">
              FamilyTV
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Made for families, with privacy first.
          </p>
        </div>
      </footer>
    </div>
  );
}
