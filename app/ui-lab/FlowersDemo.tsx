import FlowersInline from "@/components/flowers/FlowersInline";
import FlowersBlock from "@/components/flowers/FlowersBlock";
import { Card } from "@ui";

export default function FlowersDemo() {
  return (
    <Card as="section" className="space-y-3" aria-labelledby="flowers-demo">
      <h2 id="flowers-demo" className="text-xl font-semibold">Flowers</h2>
      <p className="text-sm text-muted-foreground">Screen readers announce &quot;Acknowledgments&quot;; the emoji is aria-hidden.</p>
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground"><FlowersInline>PostgreSQL, Neon & DataGrip; rekindled my database crush.</FlowersInline></div>
        <div className="text-sm text-muted-foreground"><FlowersInline>Chronicles wiki &amp; Raistlin Majere</FlowersInline></div>
      </div>
      <FlowersBlock
        items={[
          <span key="1">PostgreSQL, Neon &amp; DataGrip; rekindled my database crush.</span>,
          <span key="2">Chronicles wiki &amp; Raistlin Majere</span>,
        ]}
      />
    </Card>
  );
}
