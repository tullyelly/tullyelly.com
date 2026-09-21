import Link from "next/link";
import { PageState } from "@/components/ui/PageState";

export default function NotFound() {
  return (
    <div data-recent-history-exclude>
      <PageState
        title="Tag not found"
        description="That Chronicle tag does not exist."
        actions={
          <Link className="btn px-6 no-underline" href="/shaolin/tags">
            <span className="text-white">Back to Chronicle tags</span>
          </Link>
        }
      />
    </div>
  );
}
