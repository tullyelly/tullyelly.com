import { BlogBoiCard } from "@/components/home/blog-boi-card";
import { InfinityStonesCard } from "@/components/home/infinity-stones-card";

export async function ChroniclePostTailCards() {
  return (
    <div className="grid w-full gap-6 grid-cols-1 md:grid-cols-2">
      <BlogBoiCard />
      <InfinityStonesCard />
    </div>
  );
}
