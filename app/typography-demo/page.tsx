import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Typography Demo",
};

export default function TypographyDemo() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-extrabold">Typography</h1>
      <p className="font-normal">Primary type uses Inter. Monospace uses JetBrains Mono.</p>
      <h2 className="text-3xl font-bold">Heading 2</h2>
      <p className="font-medium">Body copy demonstrates default sans-serif family.</p>
      <h3 className="text-2xl font-semibold">Heading 3</h3>
      <p className="font-normal">Another paragraph with regular weight.</p>
      <h4 className="text-xl font-semibold">Heading 4</h4>
      <p className="font-normal">Yet another body example.</p>
      <p className="font-mono text-sm text-muted">Updated 2024-06-07</p>
      <p>
        Inline code like <code className="font-mono">{`const font = 'JetBrains Mono';`}</code> uses the
        monospace stack.
      </p>
      <pre className="font-mono p-4 rounded border border-border-subtle">
        <code>{`function hello() {\n  console.log('world');\n}`}</code>
      </pre>
    </div>
  );
}
