import { installNegativePerformanceMeasureGuard } from "@/lib/dev-performance-measure-guard";

if (process.env.NODE_ENV === "development") {
  installNegativePerformanceMeasureGuard(performance);
}
