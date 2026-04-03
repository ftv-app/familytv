"use client";

import { useParams } from "next/navigation";
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
   Page Component
   ============================================================ */

export default function WatchPartyPage({ params }: WatchPartyPageProps) {
  // Unwrap params in Next.js 15+
  // In Next.js 14: const { sessionId } = useParams();
  // In Next.js 15+: params is a Promise
  const resolvedParams = useParams();

  // Build room ID from sessionId
  // In production, sessionId maps to family:{familyId}:video:{videoId}:session:{sessionId}
  // For demo, we construct a plausible room ID
  const sessionId = resolvedParams.sessionId as string;

  // In production, you'd fetch user info from Clerk and room details from API
  // For now, use placeholder values - replace with actual auth in production
  const userId = "demo-user-id"; // Replace with: const { userId } = auth();
  const userName = "Demo User"; // Replace with: const { userName } = auth();
  const avatarUrl = undefined; // Replace with: const { avatarUrl } = auth();

  // Room ID format: family:{familyId}:video:{videoId}:session:{sessionId}
  // For demo, we use a placeholder family ID
  const roomId = `family:demo-family:video:demo-video:session:${sessionId}`;

  return (
    <div className="w-full h-screen overflow-hidden" style={{ backgroundColor: "#0D0D0F" }}>
      <WatchPartyContainer
        roomId={roomId}
        userId={userId}
        userName={userName}
        avatarUrl={avatarUrl}
        videoUrl={DEMO_VIDEO.videoUrl}
        videoTitle={DEMO_VIDEO.videoTitle}
        videoChosenBy={DEMO_VIDEO.videoChosenBy}
        posterUrl={DEMO_VIDEO.posterUrl}
      />
    </div>
  );
}
