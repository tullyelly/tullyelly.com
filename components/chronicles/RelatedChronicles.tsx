import Link from "next/link";
import type { Post } from "contentlayer/generated";
import { Card } from "@ui";

import { fmtDate } from "@/lib/datetime";
import {
  getRelatedChronicles,
  type RelatedChronicle,
} from "@/lib/related-chronicles";

type RelatedChroniclesProps = {
  currentPost: Post;
  posts: readonly Post[];
};

function reasonLabel(post: RelatedChronicle): string {
  const tags = post.reasons
    .filter((reason) => reason.type === "tag")
    .map((reason) => `#${reason.value}`);
  const persona = post.reasons.find((reason) => reason.type === "persona");
  return [...tags, ...(persona ? [`persona: ${persona.value}`] : [])].join(
    ", ",
  );
}

export function RelatedChronicles({
  currentPost,
  posts,
}: RelatedChroniclesProps) {
  const related = getRelatedChronicles(currentPost, posts);
  if (related.length === 0) return null;

  return (
    <Card as="section" aria-labelledby="related-chronicles-title">
      <h2 id="related-chronicles-title" className="text-xl font-semibold">
        Related Chronicles
      </h2>
      <ul className="mt-3 divide-y divide-border">
        {related.map((post) => (
          <li key={post.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <Link className="link-blue font-semibold" href={post.href}>
                {post.title}
              </Link>
              <time
                className="text-xs text-muted-foreground"
                dateTime={post.date}
              >
                {fmtDate(post.date)}
              </time>
            </div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {post.summary}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Related by {reasonLabel(post)}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
