import { z } from "zod";

const Env = z.object({
  DATABASE_URL: z.string().url(),
});

export const { DATABASE_URL } = Env.parse(process.env);
