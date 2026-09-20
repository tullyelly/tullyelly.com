import type { Post } from "contentlayer/generated";
import type { ChronicleMusicUsage } from "@/lib/alterEgo";

export type CrateAppearance = ChronicleMusicUsage & {
  chronicleTitle: string;
  chronicleUrl: string;
  chronicleDate: string;
};

export function collectCrateAppearances(
  posts: readonly Post[],
): CrateAppearance[] {
  return posts
    .filter((post) => !post.draft)
    .flatMap((post) => {
      const usages = Array.isArray(post.musicUsages)
        ? (post.musicUsages as ChronicleMusicUsage[])
        : [];
      return usages
        .filter(
          (usage) =>
            usage.alterEgo === "theabbott" ||
            (!usage.alterEgo && post.resolvedAlterEgo === "theabbott"),
        )
        .map((usage) => ({
          ...usage,
          chronicleTitle: post.title,
          chronicleUrl: post.url,
          chronicleDate: post.date,
        }));
    })
    .sort(
      (left, right) =>
        new Date(right.chronicleDate).getTime() -
          new Date(left.chronicleDate).getTime() ||
        left.chronicleUrl.localeCompare(right.chronicleUrl),
    );
}
