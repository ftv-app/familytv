/**
 * Loading state for all /app routes.
 * Shown while server components fetch data (posts, families, calendar events).
 * Warm FamilyTV branding — cinema/terracotta tones.
 */
export default function AppLoading() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] gap-5"
      aria-label="Loading your family space..."
      role="status"
    >
      {/* Spinning TV icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center animate-pulse"
        style={{ backgroundColor: "rgba(196, 120, 90, 0.12)" }}
        aria-hidden="true"
      >
        {/* Inner spinner ring */}
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{
            borderColor: "rgba(196, 120, 90, 0.2)",
            borderTopColor: "#c4785a",
          }}
          role="img"
          aria-hidden="true"
        />
      </div>
      <p
        className="text-sm font-medium"
        style={{ color: "oklch(0.68 0.015 50)" }}
      >
        Loading your family...
      </p>
    </div>
  );
}
