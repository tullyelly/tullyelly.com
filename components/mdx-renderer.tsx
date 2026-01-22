import type { MDXComponents } from "mdx/types";
import { getMDXComponent } from "next-contentlayer2/hooks";
import { mdxComponents } from "@/mdx-components";

import * as React from "react";

const CLIENT_INTERNALS_KEY =
  "__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE";

const reactWithInternals = React as Record<string, unknown>;
const canMutateReactInternals = Object.isExtensible(reactWithInternals);
let internals = reactWithInternals[CLIENT_INTERNALS_KEY] as
  | Record<string, unknown>
  | undefined;
if (!internals) {
  internals = canMutateReactInternals
    ? ((reactWithInternals[CLIENT_INTERNALS_KEY] = {}) as Record<
        string,
        unknown
      >)
    : {};
}
const canMutateInternals = Object.isExtensible(internals);

if (
  canMutateInternals &&
  typeof internals.recentlyCreatedOwnerStacks !== "number"
) {
  internals.recentlyCreatedOwnerStacks = 0;
}

const ownerContext =
  (internals.A as { getOwner?: () => unknown } | undefined) ??
  (canMutateInternals
    ? ((internals.A = {}) as { getOwner?: () => unknown })
    : ({ getOwner: () => null } as { getOwner?: () => unknown }));

if (typeof ownerContext.getOwner !== "function") {
  ownerContext.getOwner = () => null;
}

type Props = {
  code: string;
  components?: MDXComponents;
};

export function MdxRenderer({ code, components }: Props) {
  const mergedComponents = components
    ? { ...mdxComponents, ...components }
    : mdxComponents;
  return React.createElement(getMDXComponent(code), {
    components: mergedComponents,
  });
}
