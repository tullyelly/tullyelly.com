import Image from "next/image";
import type { MDXComponents } from "mdx/types";

const defaultComponents: MDXComponents = {
  img: (props: any) => (
    <Image
      alt=""
      {...props}
      width={props.width ?? 1200}
      height={props.height ?? 630}
    />
  ),
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...defaultComponents,
    ...components,
  };
}

export const mdxComponents: MDXComponents = defaultComponents;
