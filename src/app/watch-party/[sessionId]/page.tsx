import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { WatchPartyContainer } from "@/components/watch-party/WatchPartyContainer";

/* ============================================================
   Types
   ============================================================ */

interface WatchPartyPageProps {
  // In Next.js 15+, params is a Promise
  params: Promise<{ sessionId: string }>;
}

/* ============================================================
   Demo/placeholder data (in real app, this comes from API)
   ============================================================ */

const DEMO_VIDEO = {
  videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  posterUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
  videoTitle: "Thanksgiving Outtakes 2024",
  videoChosenBy: "Grandma June",
};

/* ============================================================
   Page Component (Server Component with Auth)
   ============================================================ */

export default async function WatchPartyPage({ params }: WatchPartyPageProps) {
  // Auth check - redirect unauthenticated users to sign-in
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in/");
  }

  // Resolve params
  const resolvedParams = await params;
  const sessionId = resolvedParams.sessionId;

  // In production, fetch room details from API to verify family membership
  // For now, construct room ID from sessionId
  const roomId = `family:demo-family:video:demo-video:session:${sessionId}`;

  return (
    <div className="w-full h-screen overflow-hidden" data-testid="watch-party-redirect-signin" style={{ backgroundColor: "#0D0D0F" }}>
      <WatchPartyContainer
        roomId={roomId}
        userId={userId}
        userName={"Family Member"}
        avatarUrl={undefined}
        videoUrl={DEMO_VIDEO.videoUrl}
        videoTitle={DEMO_VIDEO.videoTitle}
        videoChosenBy={DEMO_VIDEO.videoChosenBy}
        posterUrl={DEMO_VIDEO.posterUrl}
      />
    </div>
  );
}
