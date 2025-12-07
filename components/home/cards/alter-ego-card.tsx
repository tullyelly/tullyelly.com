"use client";

import Link from "next/link";

import { CardInfoPopover } from "@/components/home/card-info-popover";
import { HomeCard } from "@/components/home/home-card";

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
      <Link href="/mark2" className="block">
        🧠 mark2 | blueprint
      </Link>
      <Link href="/cardattack" className="block">
        🃏 cardattack | vault
      </Link>
      <Link href="/theabbott" className="block">
        🪶 theabbott | cipher
      </Link>
      <Link href="/unclejimmy" className="block">
        🎙️ unclejimmy | circus
      </Link>
      <Link href="/tullyelly" className="block">
        🛠️ tullyelly | forge
      </Link>
    </HomeCard>
  );
}
