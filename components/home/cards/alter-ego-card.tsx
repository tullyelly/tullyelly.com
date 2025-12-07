"use client";

import Link from "next/link";

import { CardInfoPopover } from "@/components/home/card-info-popover";
import { HomeCard } from "@/components/home/home-card";
import { homeCardRowClassName } from "@/components/home/home-card-row";

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
      <Link
        href="/mark2"
        className={homeCardRowClassName("flex items-center gap-2")}
      >
        <span aria-hidden>🧠</span>
        <span className="truncate">mark2 | blueprint</span>
      </Link>
      <Link
        href="/cardattack"
        className={homeCardRowClassName("flex items-center gap-2")}
      >
        <span aria-hidden>🃏</span>
        <span className="truncate">cardattack | vault</span>
      </Link>
      <Link
        href="/theabbott"
        className={homeCardRowClassName("flex items-center gap-2")}
      >
        <span aria-hidden>🪶</span>
        <span className="truncate">theabbott | cipher</span>
      </Link>
      <Link
        href="/unclejimmy"
        className={homeCardRowClassName("flex items-center gap-2")}
      >
        <span aria-hidden>🎙️</span>
        <span className="truncate">unclejimmy | circus</span>
      </Link>
      <Link
        href="/tullyelly"
        className={homeCardRowClassName("flex items-center gap-2")}
      >
        <span aria-hidden>🛠️</span>
        <span className="truncate">tullyelly | forge</span>
      </Link>
    </HomeCard>
  );
}
