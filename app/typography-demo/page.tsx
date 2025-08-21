import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Typography Demo",
};

export default function TypographyDemo() {
  return (
    <div className="space-y-6">
      <h1>Typography</h1>
      <p>Primary type uses Inter. Monospace uses JetBrains Mono.</p>
      <h2>Heading 2</h2>
      <p>Body copy demonstrates default sans-serif family.</p>
      <h3>Heading 3</h3>
      <p>
        Inline code like <code className="font-mono">{`const font = 'JetBrains Mono';`}</code> uses
        the monospace stack.
      </p>
      <pre className="font-mono p-4 rounded border border-border-subtle">
        <code>{`function hello() {\n  console.log('world');\n}`}</code>
      </pre>
    </div>
  );
}
