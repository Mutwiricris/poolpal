import { Suspense } from "react";
import CommunityDetailsClient from "./client";

type PageParams = {
  params: {
    id: string;
  };
};

export default function CommunityDetailsPage({ params }: PageParams) {
  // In Next.js server components, we can safely access params directly without use()
  // This component is already a server component since we removed "use client"
  const communityId = params.id;
  
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>}>
      <CommunityDetailsClient communityId={communityId} />
    </Suspense>
  );
}
