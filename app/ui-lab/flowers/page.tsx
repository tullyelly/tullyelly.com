import FlowersDemo from "@/app/ui-lab/FlowersDemo";

export const metadata = {
  title: 'Flowers; UI Lab',
  description: 'Acknowledgments inline and block components',
  alternates: { canonical: 'https://tullyelly.com/ui-lab/flowers' },
};

export default function Page() {
  return <div className="mx-auto max-w-container p-4"><FlowersDemo /></div>;
}

