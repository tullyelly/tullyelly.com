import type { Post } from "contentlayer/generated";

import { BlogBoiCard } from "@/components/home/blog-boi-card";
import { InfinityStonesCard } from "@/components/home/infinity-stones-card";
import { RelatedChronicles } from "@/components/chronicles/RelatedChronicles";

type ChroniclePostTailCardsProps = {
  currentPost?: Post;
  posts?: readonly Post[];
};

export async function ChroniclePostTailCards({
  currentPost,
  posts,
}: ChroniclePostTailCardsProps) {
  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <BlogBoiCard />
        <InfinityStonesCard />
      </div>
      {currentPost && posts ? (
        <RelatedChronicles currentPost={currentPost} posts={posts} />
      ) : null}
    </div>
  );
}
