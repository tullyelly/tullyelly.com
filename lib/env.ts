import { z } from "zod";

const Env = z.object({
  DATABASE_URL: z.string().url(),
});

const rawDatabaseUrl =
  process.env.DATABASE_URL ?? process.env.TEST_DATABASE_URL ?? undefined;

export const { DATABASE_URL } = Env.parse({ DATABASE_URL: rawDatabaseUrl });
