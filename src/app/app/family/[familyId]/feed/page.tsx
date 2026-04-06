import { Suspense } from "react";
import { FamilyFeed } from "@/components/family-feed";
import { FamilyFeedTagged } from "@/components/family-feed-tagged";
import { Skeleton } from "@/components/ui/skeleton";

function FeedLoadingSkeleton() {
  return (
    <div className="space-y-4" data-testid="feed-loading-skeleton">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl p-4 flex gap-3 animate-pulse"
          style={{ backgroundColor: "#1A1A1E" }}
        >
          <div className="w-10 h-10 rounded-full" style={{ backgroundColor: "rgba(212,175,55,0.12)" }} />
          <div className="flex-1 space-y-2">
            <div className="h-3 rounded-md w-1/3" style={{ backgroundColor: "rgba(212,175,55,0.12)" }} />
            <div className="h-3 rounded-md w-2/3" style={{ backgroundColor: "rgba(212,175,55,0.08)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

interface PageProps {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<{ tagId?: string }>;
}

export default async function FamilyFeedPage({ params, searchParams }: PageProps) {
  const { familyId } = await params;
  const { tagId } = await searchParams;

  return (
    <Suspense fallback={<FeedLoadingSkeleton />}>
      {tagId ? (
        <FamilyFeedTagged familyId={familyId} tagId={tagId} />
      ) : (
        <FamilyFeed familyId={familyId} />
      )}
    </Suspense>
  );
}
