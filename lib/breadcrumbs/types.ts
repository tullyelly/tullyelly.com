export type CrumbKind = "root" | "segment" | "leaf" | "registered" | "forced";

export type Crumb = {
  label: string;
  href?: string;
  kind?: CrumbKind;
};
