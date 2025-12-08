import type { Route } from "next";

import { CardInfoPopover } from "@/components/home/card-info-popover";
import {
  HomeCardRowLink,
  HomeCardRowSpinner,
  HomeCardRows,
} from "@/components/home/home-card-row";
import { HomeCard } from "@/components/home/home-card";

const sideQuests = [
  {
    href: "/unclejimmy/hug-ball" as Route,
    label: "Hug Ball",
    emoji: "🤗",
  },
  {
    href: "/tullyelly/ruins" as Route,
    label: "Ruins",
    emoji: "🪦",
  },
  {
    href: "/unclejimmy/cute-stamps" as Route,
    label: "Cute Stamps",
    emoji: "📮",
  },
  {
    href: "/theabbott/heels-have-eyes" as Route,
    label: "Heels Have Eyes",
    emoji: "🤼",
  },
  {
    href: "/theabbott/roadwork-rappin" as Route,
    label: "Roadwork Rappin'",
    emoji: "🚧",
  },
];

export function SideQuestsCard() {
  const info = (
    <CardInfoPopover ariaLabel="About side quests">
      <p className="m-0">
        Detours when the main path needs a breather; odd relics, rap pits, and
        postal runs live here.
      </p>
      <p className="m-0 mt-2">
        Pick a lane and wander; new routes unlock whenever the dojo gets
        restless.
      </p>
    </CardInfoPopover>
  );

  return (
    <HomeCard title="Side Quests" info={info}>
      <HomeCardRows>
        {sideQuests.map((quest) => (
          <HomeCardRowLink
            key={quest.href}
            href={quest.href}
            className="flex items-center gap-2 text-base"
          >
            <span aria-hidden className="no-underline">
              {quest.emoji}
            </span>
            <span className="underline decoration-current underline-offset-2">
              {quest.label}
            </span>
            <span className="ml-auto flex h-4 w-4 items-center justify-center">
              <HomeCardRowSpinner />
            </span>
          </HomeCardRowLink>
        ))}
      </HomeCardRows>
    </HomeCard>
  );
}
