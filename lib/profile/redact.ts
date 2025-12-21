const MATCHERS = [
  /token/i,
  /secret/i,
  /access_token/i,
  /refresh_token/i,
  /id_token/i,
  /sessiontoken/i,
];

function shouldRedactKey(key: string): boolean {
  return MATCHERS.some((regex) => regex.test(key));
}

export function redactSecrets<T>(input: T): T {
  if (input === null || input === undefined) return input;
  if (typeof input !== "object") return input;

  if (Array.isArray(input)) {
    return input.map((item) => redactSecrets(item)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (shouldRedactKey(key)) {
      result[key] = "[REDACTED]";
      continue;
    }
    result[key] = redactSecrets(value);
  }
  return result as T;
}
