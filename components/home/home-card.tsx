import { Card } from "@/components/ui/Card";

export function HomeCard({
  title,
  description,
  info,
  children,
}: {
  title: string;
  description?: string;
  info?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card
      accent="cream-city-cream"
      className="rounded-2xl bg-white/5 p-0 overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 bg-[var(--green)] px-4 py-3 text-white">
        <span className="text-lg font-semibold">{title}</span>
        {info ? <div className="shrink-0">{info}</div> : null}
      </div>
      <div className="space-y-3 p-4">
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        <div className="space-y-2">{children}</div>
      </div>
    </Card>
  );
}
