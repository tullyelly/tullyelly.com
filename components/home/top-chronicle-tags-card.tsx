import Link from "next/link";

import { CardInfoPopover } from "@/components/home/card-info-popover";
import { HomeCard } from "@/components/home/home-card";
import { Badge } from "@/app/ui/Badge";
import { getBadgeClass } from "@/app/ui/badge-maps";
import { getTopChronicleTags } from "@/lib/chronicles";

export async function TopChronicleTagsCard() {
  const tags = await getTopChronicleTags(10);

  const info = (
    <CardInfoPopover ariaLabel="About Chronicle tags">
      <p className="m-0">
        Here are the top 10 most used tags in shaolin chronicles. While this is
        not a competition, I am ready to make it one if you are.
      </p>
      <p className="m-0 mt-2">
        Click on any tag to follow along on the individual journey the tag
        represents.
      </p>
      <p className="m-0 mt-2">GOAT = Greatest Of All Tags</p>
    </CardInfoPopover>
  );

  return (
    <HomeCard title="Chronicle Tags [GOAT]" info={info}>
      {tags.length === 0 ? (
        <p className="px-4 pb-4 pt-3 text-sm text-muted-foreground">
          No tags found.
        </p>
      ) : (
        <div className="px-4 pb-4 pt-3">
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <Link
                key={t.tag}
                href={`/shaolin/tags/${encodeURIComponent(t.tag)}`}
                className="inline-flex"
                prefetch={false}
              >
                <Badge className={getBadgeClass("classic")}>
                  #{t.tag}{" "}
                  <span className="pl-1 text-[11px] opacity-80">
                    ({t.count})
                  </span>
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </HomeCard>
  );
}
