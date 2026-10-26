import TrendPill from "@/components/tcdb/TrendPill";
import {
  formatCategoryRanking,
  formatCategoryRankChange,
  formatCategoryDifference,
  formatCategoryDifferenceChange,
  formatCategorySignChange,
  type CategorySnapshot,
} from "@/lib/card-categories";

function SnapshotTrend({ trend }: { trend: CategorySnapshot["trend_rank"] }) {
  return trend ? <TrendPill trend={trend} /> : "No comparison";
}
export default function CategoryRankSummary({
  snapshot,
}: {
  snapshot: CategorySnapshot;
}) {
  return (
    <>
      <div>
        <dt>TCDb rank</dt>
        <dd className="font-semibold tabular-nums">
          {formatCategoryRanking(snapshot.ranking)}
        </dd>
      </div>
      <div>
        <dt>Previous TCDb rank</dt>
        <dd>{formatCategoryRanking(snapshot.previous_ranking)}</dd>
      </div>
      <div>
        <dt>Rank change</dt>
        <dd>{formatCategoryRankChange(snapshot.rank_delta)}</dd>
      </div>
      <div>
        <dt>Rank trend</dt>
        <dd>
          <SnapshotTrend trend={snapshot.trend_rank} />
        </dd>
      </div>
      <div>
        <dt>Difference</dt>
        <dd className="tabular-nums">
          {formatCategoryDifference(snapshot.difference)}
        </dd>
      </div>
      <div>
        <dt>Previous difference</dt>
        <dd className="tabular-nums">
          {formatCategoryDifference(snapshot.previous_difference)}
        </dd>
      </div>
      <div>
        <dt>Difference change</dt>
        <dd className="tabular-nums">
          {formatCategoryDifferenceChange(snapshot.diff_delta)}
        </dd>
      </div>
      <div>
        <dt>Difference sign changed</dt>
        <dd>{formatCategorySignChange(snapshot.diff_sign_changed)}</dd>
      </div>
      <div>
        <dt>Overall trend</dt>
        <dd>
          <SnapshotTrend trend={snapshot.trend_overall} />
        </dd>
      </div>
    </>
  );
}
