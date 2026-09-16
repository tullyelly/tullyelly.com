import CollectionChronicleFeed from "@/components/layout/CollectionChronicleFeed";
import type { UspsNarrativeDay } from "@/lib/usps-content";

type UspsChronicleFeedProps = {
  days: UspsNarrativeDay[];
  entryLabel: string;
  emptyMessage: string;
  missingContentMessage: string;
};

export default function UspsChronicleFeed(props: UspsChronicleFeedProps) {
  return CollectionChronicleFeed({
    ...props,
    theme: {
      accent: "var(--usps-accent)",
      border: "var(--usps-border)",
      ink: "var(--usps-ink)",
      link: "var(--usps-link)",
      linkHover: "var(--usps-link-hover)",
      pillForeground: "var(--usps-pill-fg)",
      surface: "var(--usps-surface)",
    },
  });
}
