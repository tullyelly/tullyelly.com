import CollectionChronicleFeed from "@/components/layout/CollectionChronicleFeed";
import type { LcsNarrativeDay } from "@/lib/lcs-content";

type LcsChronicleFeedProps = {
  days: LcsNarrativeDay[];
  entryLabel: string;
  emptyMessage: string;
  missingContentMessage: string;
};

export default function LcsChronicleFeed(props: LcsChronicleFeedProps) {
  return CollectionChronicleFeed({
    ...props,
    theme: {
      accent: "var(--lcs-accent)",
      border: "var(--lcs-border)",
      ink: "var(--lcs-ink)",
      link: "var(--lcs-link)",
      linkHover: "var(--lcs-link-hover)",
      pillForeground: "var(--lcs-pill-fg)",
      surface: "var(--lcs-surface)",
    },
  });
}
