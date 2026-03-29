import { FamilyFeed } from "@/components/family-feed";

interface PageProps {
  params: Promise<{ familyId: string }>;
}

export default async function FamilyFeedPage({ params }: PageProps) {
  const { familyId } = await params;
  return <FamilyFeed familyId={familyId} />;
}
