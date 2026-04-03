import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ReviewDetailPage from "@/components/reviews/ReviewDetailPage";
import { getReviewPageData } from "@/lib/review-content";
import { getReviewRouteConfig } from "@/lib/review-route-config";
import { getReviewDetailMetadata } from "@/lib/review-route-metadata";

type Params = { id: string };

const reviewType = "lcs" as const;
const routeConfig = getReviewRouteConfig(reviewType);

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const review = await getReviewPageData(reviewType, id);
  return getReviewDetailMetadata(reviewType, id, review);
}

export default async function CardattackLcsIdPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const review = await getReviewPageData(reviewType, id);
  if (!review) {
    notFound();
  }

  return <ReviewDetailPage config={routeConfig} review={review} />;
}
