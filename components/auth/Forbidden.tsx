import Link from "next/link";
import { PageState } from "@/components/ui/PageState";

export default function Forbidden({ feature }: { feature?: string }) {
  return (
    <div data-recent-history-exclude>
      <PageState
        role="alert"
        title="You don’t have access"
        description={
          feature ? (
            <>
              Your account is missing the required permission:{" "}
              <code className="font-mono">{feature}</code>
            </>
          ) : (
            "Your account is not authorized for this page."
          )
        }
        actions={
          <Link className="btn px-6 no-underline" href="/">
            <span className="text-white">Return home</span>
          </Link>
        }
      />
    </div>
  );
}
