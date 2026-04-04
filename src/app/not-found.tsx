import Link from "next/link";

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#0D0D0F" }}
      aria-label="Page not found"
    >
      <div className="w-full max-w-md text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div
            className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="text-primary-foreground font-heading font-bold text-2xl">F</span>
          </div>
        </div>

        {/* Error */}
        <div className="space-y-2">
          <p
            className="text-muted-foreground text-sm font-medium uppercase tracking-wider"
            aria-hidden="true"
          >
            404
          </p>
          <h1 className="font-heading text-3xl font-semibold text-foreground">
            Page not found
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Looks like this page wandered off. It might have moved, been deleted, or never existed.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/app"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            data-testid="not-found-home-button"
          >
            Go to FamilyTV
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center px-5 py-2.5 border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            data-testid="not-found-signin-button"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
