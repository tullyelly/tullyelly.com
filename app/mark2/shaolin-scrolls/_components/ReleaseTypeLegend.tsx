import { Badge } from "@/app/ui/Badge";
import {
  BADGE_VARIANTS,
  getBadgeClass,
  type BadgeVariant,
} from "@/app/ui/badge-maps";
import { Table, TBody, THead } from "@/components/ui/Table";
import type { ReleaseTypeRow } from "@/lib/scrolls";

type ReleaseTypeLegendProps = {
  releaseTypes: ReleaseTypeRow[];
};

function getBadgeVariant(code: string): BadgeVariant {
  const normalized = code.toLowerCase();
  return Object.prototype.hasOwnProperty.call(BADGE_VARIANTS, normalized)
    ? (normalized as BadgeVariant)
    : "archived";
}

export default function ReleaseTypeLegend({
  releaseTypes,
}: ReleaseTypeLegendProps) {
  return (
    <Table
      variant="bucks"
      showOnMobile
      aria-label="Release type legend"
      data-testid="release-type-legend"
    >
      <THead variant="bucks">
        <th scope="col" className="w-[96px] whitespace-nowrap">
          ID
        </th>
        <th scope="col">Type</th>
      </THead>
      <TBody>
        {releaseTypes.map((item) => {
          const label = item.code.toLowerCase();
          const variant = getBadgeVariant(label);
          return (
            <tr
              key={`${item.id}-${item.code}`}
              className="border-b border-black/5 last:border-0"
            >
              <td className="whitespace-nowrap tabular-nums text-ink/80">
                {item.id}
              </td>
              <td className="whitespace-nowrap">
                <Badge className={getBadgeClass(variant)}>{label}</Badge>
              </td>
            </tr>
          );
        })}
      </TBody>
    </Table>
  );
}
