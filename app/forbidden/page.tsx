import Link from "next/link";
import { PageState } from "@/components/ui/PageState";

export const metadata = { title: "Access denied" };

export default function ForbiddenPage() {
  return (
    <PageState
      role="alert"
      title="Access denied"
      description="You’re signed in, but your account isn’t authorized for this page."
      actions={
        <Link className="btn px-6 no-underline" href="/">
          <span className="text-white">Home</span>
        </Link>
      }
    />
  );
}
