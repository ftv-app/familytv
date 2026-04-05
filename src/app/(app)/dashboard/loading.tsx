// Brand tokens for skeleton loaders — warm cinema palette
const LOADING_BG = "rgba(196, 120, 90, 0.10)";
const LOADING_BG_LIGHT = "rgba(196, 120, 90, 0.06)";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-8 w-48 rounded-lg animate-pulse" style={{ backgroundColor: LOADING_BG }} />
          <div className="h-4 w-32 rounded animate-pulse" style={{ backgroundColor: LOADING_BG_LIGHT }} />
        </div>
        <div className="h-10 w-32 rounded-lg animate-pulse" style={{ backgroundColor: LOADING_BG }} />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-xl animate-pulse" style={{ backgroundColor: LOADING_BG }} />
        ))}
      </div>

      {/* Feed skeleton */}
      <div className="space-y-4">
        <div className="h-12 rounded-lg animate-pulse" style={{ backgroundColor: LOADING_BG }} />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 rounded-xl animate-pulse" style={{ backgroundColor: LOADING_BG }} />
        ))}
      </div>
    </div>
  );
}
