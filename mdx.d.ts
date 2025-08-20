declare module '*.mdx' {
  export const frontmatter: any;
  export const metadata: any;
  let MDXComponent: (props: any) => JSX.Element;
  export default MDXComponent;
}
