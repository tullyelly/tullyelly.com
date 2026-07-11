import type { MetricDefinition } from "@/lib/analytics/types";
import { loadAlterEgoPostMetric } from "@/lib/analytics/providers/posts";

export const ACTIVITY_METRICS: Record<string, MetricDefinition> = {
  "mark2-posts": { key: "mark2-posts", label: "mark2 posts", unit: "posts", color: "#00471B", axis: "primary", loader: (periods) => loadAlterEgoPostMetric("mark2", periods) },
  "cardattack-posts": { key: "cardattack-posts", label: "cardattack posts", unit: "posts", color: "#00471B", axis: "primary", loader: (periods) => loadAlterEgoPostMetric("cardattack", periods) },
  "theabbott-posts": { key: "theabbott-posts", label: "theabbott posts", unit: "posts", color: "#00471B", axis: "primary", loader: (periods) => loadAlterEgoPostMetric("theabbott", periods) },
  "unclejimmy-posts": { key: "unclejimmy-posts", label: "unclejimmy posts", unit: "posts", color: "#00471B", axis: "primary", loader: (periods) => loadAlterEgoPostMetric("unclejimmy", periods) },
  "tullyelly-posts": { key: "tullyelly-posts", label: "tullyelly posts", unit: "posts", color: "#00471B", axis: "primary", loader: (periods) => loadAlterEgoPostMetric("tullyelly", periods) },
};
