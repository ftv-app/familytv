"use client";

import { CreatePost } from "@/components/create-post";
import { ActivityFeed } from "@/components/feed/ActivityFeed";

interface FamilyFeedTabProps {
  familyId: string;
  familyName?: string;
}

export function FamilyFeedTab({ familyId, familyName }: FamilyFeedTabProps) {
  return (
    <div className="space-y-4">
      <CreatePost familyId={familyId} onPostCreated={() => window.location.reload()} />
      <ActivityFeed familyId={familyId} familyName={familyName} />
    </div>
  );
}
