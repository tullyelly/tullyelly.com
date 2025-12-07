import { AlterEgoCard } from "@/components/home/cards/alter-ego-card";
import { BlogBoiCard } from "@/components/home/blog-boi-card";
import { InfinityStonesCard } from "@/components/home/infinity-stones-card";
import { RelationalRuckusCard } from "@/components/home/relational-ruckus-card";
import { TopChronicleTagsCard } from "@/components/home/top-chronicle-tags-card";

export default async function HomePage() {
  return (
    <div className="grid gap-6 p-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      <AlterEgoCard />
      <BlogBoiCard />
      <InfinityStonesCard />
      <TopChronicleTagsCard />
      <RelationalRuckusCard />
    </div>
  );
}
