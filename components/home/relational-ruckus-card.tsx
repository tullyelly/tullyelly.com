import { CardInfoPopover } from "@/components/home/card-info-popover";
import {
  HomeCardRowLink,
  HomeCardRowSpinner,
  HomeCardRows,
} from "@/components/home/home-card-row";
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
      <HomeCardRows>
        <HomeCardRowLink
          href="/mark2/shaolin-scrolls"
          className="flex items-center gap-2 text-base"
        >
          <span aria-hidden className="no-underline">
            📜
          </span>
          <span className="underline decoration-current underline-offset-2">
            Shaolin Scrolls
          </span>
          <span className="ml-auto flex h-4 w-4 items-center justify-center">
            <HomeCardRowSpinner />
          </span>
        </HomeCardRowLink>
        <HomeCardRowLink
          href="/cardattack/tcdb-rankings"
          className="flex items-center gap-2 text-base"
        >
          <span aria-hidden className="no-underline">
            🏀
          </span>
          <span className="underline decoration-current underline-offset-2">
            TCDB Rankings
          </span>
          <span className="ml-auto flex h-4 w-4 items-center justify-center">
            <HomeCardRowSpinner />
          </span>
        </HomeCardRowLink>
      </HomeCardRows>
    </HomeCard>
  );
}
