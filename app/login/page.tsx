import LoginClient from "./LoginClient";
import { canonicalUrl } from "@/lib/share/canonicalUrl";

export const dynamic = "force-dynamic";

const pageTitle = "Login | tullyelly";
const pageDescription =
  "Sign in with Google to access tullyelly projects, admin tools, and protected routes.";

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: canonicalUrl("login") },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/login",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: pageTitle,
    description: pageDescription,
  },
};

export default function LoginPage() {
  return <LoginClient />;
}
