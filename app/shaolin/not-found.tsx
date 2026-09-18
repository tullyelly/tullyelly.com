import Link from "next/link";
import { PageState } from "@/components/ui/PageState";

export default function NotFound() {
  return (
    <div data-recent-history-exclude>
      <PageState
        title="Nothing to see here."
        description="That post or tag does not exist."
        actions={
          <Link className="btn px-6 no-underline" href="/shaolin">
            <span className="text-white">Back to chronicles</span>
          </Link>
        }
      />
    </div>
  );
}
