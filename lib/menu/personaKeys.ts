export type PersonaKey =
  | "shaolin"
  | "mark2"
  | "tullyelly"
  | "unclejimmy"
  | "cardattack"
  | "theabbott";

export const PERSONA_KEYS = [
  "shaolin",
  "mark2",
  "tullyelly",
  "unclejimmy",
  "cardattack",
  "theabbott",
] as const satisfies readonly PersonaKey[];

export function isPersonaKey(
  value: string | null | undefined,
): value is PersonaKey {
  if (!value) return false;
  return (PERSONA_KEYS as readonly string[]).includes(value);
}

export function assertPersonaKey(
  value: string | null | undefined,
): asserts value is PersonaKey {
  if (!isPersonaKey(value)) {
    throw new Error(`Unknown persona key: ${String(value)}`);
  }
}
