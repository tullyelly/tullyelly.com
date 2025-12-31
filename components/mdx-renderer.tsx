import type { MDXComponents } from "mdx/types";
import { getMDXComponent } from "next-contentlayer2/hooks";
import { mdxComponents } from "@/mdx-components";

import * as React from "react";

const CLIENT_INTERNALS_KEY =
  "__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE";

const reactWithInternals = React as Record<string, unknown>;
const internals =
  (reactWithInternals[CLIENT_INTERNALS_KEY] as Record<string, unknown>) ??
  ((reactWithInternals[CLIENT_INTERNALS_KEY] = {}) as Record<string, unknown>);

if (typeof internals.recentlyCreatedOwnerStacks !== "number") {
  internals.recentlyCreatedOwnerStacks = 0;
}

const ownerContext =
  (internals.A as { getOwner?: () => unknown } | undefined) ??
  ((internals.A = {}) as { getOwner?: () => unknown });

if (typeof ownerContext.getOwner !== "function") {
  ownerContext.getOwner = () => null;
}

type Props = {
  code: string;
  components?: MDXComponents;
};

export function MdxRenderer({ code, components }: Props) {
  const Component = getMDXComponent(code);
  return <Component components={{ ...mdxComponents, ...components }} />;
}
