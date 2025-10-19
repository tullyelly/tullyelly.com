"use client";

import type { MDXComponents } from "mdx/types";
import { useMDXComponent } from "next-contentlayer/hooks";
import { mdxComponents } from "@/mdx-components";

type Props = {
  code: string;
  components?: MDXComponents;
};

export function MdxRenderer({ code, components }: Props) {
  const Component = useMDXComponent(code);
  return <Component components={{ ...mdxComponents, ...components }} />;
}
