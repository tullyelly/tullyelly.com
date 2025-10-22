import sql from "@/lib/neon-sql";

type NeonResult<T> = T[] | { rows: T[] };

function isRowsObject<T>(value: NeonResult<T>): value is { rows: T[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as any).rows)
  );
}

function unwrapRows<T>(result: NeonResult<T>): T[] {
  if (Array.isArray(result)) return result as T[];
  if (isRowsObject(result)) return result.rows as T[];
  throw new Error("Unexpected result shape from Neon query");
}

export async function sqlRows<T>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  const result = await (sql as any)(strings, ...values);
  return unwrapRows<T>(result);
}

export async function sqlOne<T>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T | null> {
  const rows = await sqlRows<T>(strings, ...values);
  return rows.length > 0 ? rows[0] : null;
}

export async function sqlQueryRows<T>(
  text: string,
  values?: readonly unknown[],
): Promise<T[]> {
  const executor =
    typeof (sql as any).query === "function"
      ? (sql as any).query.bind(sql)
      : (sql as any);
  const result = await executor(text, values);
  return unwrapRows<T>(result);
}

export async function sqlQueryOne<T>(
  text: string,
  values?: readonly unknown[],
): Promise<T | null> {
  const rows = await sqlQueryRows<T>(text, values);
  return rows.length > 0 ? rows[0] : null;
}
