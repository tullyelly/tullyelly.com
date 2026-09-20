export const IDENTITY_CONTEXTS = [
  "cardattack",
  "theabbott",
  "unclejimmy",
] as const;

export type IdentityContext = (typeof IDENTITY_CONTEXTS)[number];
export type IdentityKind = "person" | "group";
export type IdentityContextRole = "homie" | "clan" | "fam" | "squad";

export type IdentityContextMetadata = {
  role?: IdentityContextRole;
  href?: string;
};

export type IdentityMetadata = {
  kind?: IdentityKind;
  contexts: Partial<Record<IdentityContext, IdentityContextMetadata>>;
};

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function nonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function readIdentityMetadata(
  meta: Record<string, unknown>,
): IdentityMetadata {
  const identity = objectValue(meta.identity);
  const rawContexts = objectValue(identity?.contexts);
  const contexts: IdentityMetadata["contexts"] = {};

  for (const context of IDENTITY_CONTEXTS) {
    const rawContext = objectValue(rawContexts?.[context]);
    if (!rawContext) continue;
    const role = nonEmptyString(rawContext.role);
    const href = nonEmptyString(rawContext.href);
    contexts[context] = {
      ...(role === "homie" ||
      role === "clan" ||
      role === "fam" ||
      role === "squad"
        ? { role }
        : {}),
      ...(href ? { href } : {}),
    };
  }

  return {
    ...(identity?.kind === "person" || identity?.kind === "group"
      ? { kind: identity.kind }
      : {}),
    contexts,
  };
}

export function resolveIdentityHref(
  meta: Record<string, unknown>,
  context: IdentityContext,
  legacyHref: string | null = null,
): string | null {
  return readIdentityMetadata(meta).contexts[context]?.href ?? legacyHref;
}
