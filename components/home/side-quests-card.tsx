import Link from "next/link";

import { CardInfoPopover } from "@/components/home/card-info-popover";
import { homeCardRowClassName } from "@/components/home/home-card-row";
import { HomeCard } from "@/components/home/home-card";

const sideQuests = [
  {
    href: "/unclejimmy/hug-ball",
    label: "Hug Ball",
    emoji: "🤗",
  },
  {
    href: "/tullyelly/ruins",
    label: "Ruins",
    emoji: "🪦",
  },
  {
    href: "/unclejimmy/cute-stamps",
    label: "Cute Stamps",
    emoji: "📮",
  },
  {
    href: "/theabbott/heels-have-eyes",
    label: "Heels Have Eyes",
    emoji: "🤼",
  },
  {
    href: "/theabbott/roadwork-rappin",
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
      {sideQuests.map((quest) => (
        <Link
          key={quest.href}
          href={quest.href}
          className={homeCardRowClassName("flex items-center gap-2 text-base")}
        >
          <span aria-hidden>{quest.emoji}</span>
          <span>{quest.label}</span>
        </Link>
      ))}
    </HomeCard>
  );
}
