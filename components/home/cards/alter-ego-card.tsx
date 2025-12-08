"use client";

import { CardInfoPopover } from "@/components/home/card-info-popover";
import { HomeCard } from "@/components/home/home-card";
import {
  HomeCardRowLink,
  HomeCardRowSpinner,
  HomeCardRows,
} from "@/components/home/home-card-row";

export function AlterEgoCard() {
  const info = (
    <CardInfoPopover ariaLabel="About the alter egos">
      <p className="m-0">
        Each alter ego represents a different wing of the shaolin dojo:
        architecture, data, writing, performance, and the forge where everything
        gets built.
      </p>
      <p className="m-0 mt-2">Consider this the onramp for the entire site.</p>
    </CardInfoPopover>
  );

  return (
    <HomeCard title="Alter Ego Origin Stories" info={info}>
      <HomeCardRows>
        <HomeCardRowLink href="/mark2" className="flex items-center gap-2">
          <span aria-hidden className="no-underline">
            🧠
          </span>
          <span className="truncate underline decoration-current underline-offset-2">
            mark2 | blueprint
          </span>
          <span className="ml-auto flex h-4 w-4 items-center justify-center">
            <HomeCardRowSpinner />
          </span>
        </HomeCardRowLink>
        <HomeCardRowLink href="/cardattack" className="flex items-center gap-2">
          <span aria-hidden className="no-underline">
            🃏
          </span>
          <span className="truncate underline decoration-current underline-offset-2">
            cardattack | vault
          </span>
          <span className="ml-auto flex h-4 w-4 items-center justify-center">
            <HomeCardRowSpinner />
          </span>
        </HomeCardRowLink>
        <HomeCardRowLink href="/theabbott" className="flex items-center gap-2">
          <span aria-hidden className="no-underline">
            🪶
          </span>
          <span className="truncate underline decoration-current underline-offset-2">
            theabbott | cipher
          </span>
          <span className="ml-auto flex h-4 w-4 items-center justify-center">
            <HomeCardRowSpinner />
          </span>
        </HomeCardRowLink>
        <HomeCardRowLink href="/unclejimmy" className="flex items-center gap-2">
          <span aria-hidden className="no-underline">
            🎙️
          </span>
          <span className="truncate underline decoration-current underline-offset-2">
            unclejimmy | circus
          </span>
          <span className="ml-auto flex h-4 w-4 items-center justify-center">
            <HomeCardRowSpinner />
          </span>
        </HomeCardRowLink>
        <HomeCardRowLink href="/tullyelly" className="flex items-center gap-2">
          <span aria-hidden className="no-underline">
            🛠️
          </span>
          <span className="truncate underline decoration-current underline-offset-2">
            tullyelly | forge
          </span>
          <span className="ml-auto flex h-4 w-4 items-center justify-center">
            <HomeCardRowSpinner />
          </span>
        </HomeCardRowLink>
      </HomeCardRows>
    </HomeCard>
  );
}
