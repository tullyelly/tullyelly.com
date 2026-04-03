import ReviewLandingPage from "@/components/reviews/ReviewLandingPage";
import { listReviewSummaries } from "@/lib/review-content";
import { getReviewRouteConfig } from "@/lib/review-route-config";
import { getReviewCollectionMetadata } from "@/lib/review-route-metadata";

const reviewType = "save-point" as const;
const routeConfig = getReviewRouteConfig(reviewType);

export const metadata = getReviewCollectionMetadata(reviewType);
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UncleJimmyCallASavePointPage() {
  const rows = await listReviewSummaries(reviewType);
  return <ReviewLandingPage config={routeConfig} rows={rows} />;
}
