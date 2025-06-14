import { Suspense } from "react";
import EditCommunityClient from "./client";

type PageParams = {
  params: {
    id: string;
  };
};

export default function EditCommunityPage({ params }: PageParams) {
  // In Next.js server components, we can safely access params directly
  const communityId = params.id;
  
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>}>
      <EditCommunityClient communityId={communityId} />
    </Suspense>
  );
}
