import FlowersInline from "@/components/flowers/FlowersInline";
import FlowersBlock from "@/components/flowers/FlowersBlock";

export default function FlowersDemo() {
  return (
    <section className="card space-y-3" aria-labelledby="flowers-demo">
      <h2 id="flowers-demo" className="text-xl font-semibold">Flowers</h2>
      <p className="text-sm text-muted-foreground">Screen readers announce &quot;Acknowledgments&quot;; the emoji is aria-hidden.</p>
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground"><FlowersInline>Postgres, Neon & DataGrip—rekindled my database crush.</FlowersInline></div>
        <div className="text-sm text-muted-foreground"><FlowersInline>Chronicles wiki &amp; Raistlin Majere</FlowersInline></div>
      </div>
      <FlowersBlock
        items={[
          <span key="1">Postgres, Neon &amp; DataGrip—rekindled my database crush.</span>,
          <span key="2">Chronicles wiki &amp; Raistlin Majere</span>,
        ]}
      />
    </section>
  );
}
