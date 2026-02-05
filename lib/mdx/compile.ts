import "server-only";
import { compile, type CompileOptions } from "@mdx-js/mdx";

const COMPILE_OPTIONS: CompileOptions = {
  outputFormat: "function-body",
  development: false,
};

const alignWithContentlayerRuntime = (code: string): string =>
  // MDX function-body output references `arguments[0]` for the JSX runtime.
  // Contentlayer's getMDXComponent injects `_jsx_runtime` into scope instead.
  code.replace(/arguments\[0\]/g, "_jsx_runtime");

export async function compileMdxToCode(source: string): Promise<string> {
  if (!source.trim()) return "";
  const compiled = await compile(source, COMPILE_OPTIONS);
  return alignWithContentlayerRuntime(String(compiled));
}
