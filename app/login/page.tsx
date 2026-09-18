import LoginClient from "./LoginClient";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import {
  SHARED_OPEN_GRAPH_FIELDS,
  SHARED_TWITTER_FIELDS,
} from "@/lib/seo/constants";

export const dynamic = "force-dynamic";

const pageTitle = "Login | tullyelly";
const pageDescription =
  "Sign in with Google to access tullyelly projects, admin tools, and protected routes.";

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: canonicalUrl("login") },
  openGraph: {
    ...SHARED_OPEN_GRAPH_FIELDS,
    title: pageTitle,
    description: pageDescription,
    url: "/login",
    type: "website",
  },
  twitter: {
    ...SHARED_TWITTER_FIELDS,
    title: pageTitle,
    description: pageDescription,
  },
};

export default function LoginPage() {
  return <LoginClient />;
}
