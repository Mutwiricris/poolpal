import { Suspense } from "react";
import PaymentDetailClient from "./client";
import { use } from "react";

export default function PaymentDetailPage({ params }: { params: { id: string } }) {
  // Use React.use() to unwrap the params object as recommended by Next.js
  const unwrappedParams = use(params);
  const paymentId = unwrappedParams.id;
  
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>}>
      <PaymentDetailClient paymentId={paymentId} />
    </Suspense>
  );
}
