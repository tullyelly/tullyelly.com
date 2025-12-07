import { BlogBoiCard } from "@/components/home/blog-boi-card";
import { AlterEgoCard } from "@/components/home/cards/alter-ego-card";

export default async function HomePage() {
  return (
    <div className="grid gap-6 p-6 md:grid-cols-2 xl:grid-cols-3">
      <AlterEgoCard />
      <BlogBoiCard />
    </div>
  );
}
