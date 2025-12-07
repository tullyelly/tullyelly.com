import Link from "next/link";

import { CardInfoPopover } from "@/components/home/card-info-popover";
import { HomeCard } from "@/components/home/home-card";

export function RelationalRuckusCard() {
  const info = (
    <CardInfoPopover ariaLabel="About the relational ruckus">
      <p className="m-0">
        Here are the artifacts driven by a database backend. I would love for
        this to be much more robust than it currently is, and yet, here we are.
      </p>
      <p className="m-0 mt-2">
        Check out shaolin scrolls to see how all of my projects evovle, and hit
        up tcdb rankings to see just how obsessed I am with giannis at any given
        movement.
      </p>
    </CardInfoPopover>
  );

  return (
    <HomeCard title="The Relational Ruckus" info={info}>
      <Link
        href="/mark2/shaolin-scrolls"
        className="flex items-center gap-2 text-base"
      >
        <span aria-hidden>📜</span>
        <span>Shaolin Scrolls</span>
      </Link>
      <Link
        href="/cardattack/tcdb-rankings"
        className="flex items-center gap-2 text-base"
      >
        <span aria-hidden>🏀</span>
        <span>TCDB Rankings</span>
      </Link>
    </HomeCard>
  );
}
