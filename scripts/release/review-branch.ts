import { z } from "zod";

/** Working refs only; never a production branch, option or revision expression. */
export const reviewBranchSchema = z
  .string()
  .max(200)
  .regex(/^(?:cipher|feature)\/[a-z0-9][a-z0-9._/-]*$/)
  .refine(
    (branch) =>
      !branch.includes("..") &&
      branch
        .split("/")
        .every(
          (part) =>
            part.length > 0 &&
            !part.startsWith(".") &&
            !part.endsWith(".") &&
            !part.endsWith(".lock"),
        ),
  );
