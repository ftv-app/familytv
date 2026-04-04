/**
 * Loading state for all /app routes.
 * Shown while server components fetch data (posts, families, calendar events).
 */
export default function AppLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]" aria-label="Loading...">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 border-3 border-muted border-t-primary rounded-full animate-spin"
          aria-hidden="true"
        />
        <p className="text-muted-foreground text-sm">Loading your family...</p>
      </div>
    </div>
  );
}
