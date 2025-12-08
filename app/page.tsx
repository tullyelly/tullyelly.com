import Image from "next/image";
import Link from "next/link";

import { AlterEgoCard } from "@/components/home/cards/alter-ego-card";
import { BlogBoiCard } from "@/components/home/blog-boi-card";
import { InfinityStonesCard } from "@/components/home/infinity-stones-card";
import { RelationalRuckusCard } from "@/components/home/relational-ruckus-card";
import { SideQuestsCard } from "@/components/home/side-quests-card";
import { TopChronicleTagsCard } from "@/components/home/top-chronicle-tags-card";

export default async function HomePage() {
  return (
    <div className="space-y-4 p-6">
      <p className="text-base text-muted-foreground">
        Welcome to the next last homepage. Here you&apos;ll find a collection of
        whatever I arbitarily decide should be the first thing you see. Also
        known as, engagement farming.
      </p>
      <p className="text-base text-muted-foreground">
        Hover over or click on the information icon to experience a deeper level
        of comtemplation.
      </p>
      <p className="text-base text-muted-foreground">
        Visit the{" "}
        <Link href="/tullyelly/ruins" className="underline hover:no-underline">
          ruins
        </Link>{" "}
        to see the evolution of a homepage.
      </p>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        <AlterEgoCard />
        <BlogBoiCard />
        <InfinityStonesCard />
        <TopChronicleTagsCard />
        <RelationalRuckusCard />
        <SideQuestsCard />
      </div>
      <div className="flex justify-center">
        <figure className="overflow-hidden rounded-2xl border border-border/60 bg-white/70">
          <Image
            src="/images/optimized/homepage.webp"
            alt="Homepage collage preview"
            width={1280}
            height={853}
            sizes="(max-width: 1024px) 100vw, 960px"
            className="h-auto w-full"
            priority
          />
        </figure>
      </div>
    </div>
  );
}
