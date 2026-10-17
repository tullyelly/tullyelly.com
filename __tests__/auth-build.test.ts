/** @jest-environment node */
jest.mock("@prisma/client", () => ({ PrismaClient: jest.fn(() => ({})) }));
jest.mock("@next-auth/prisma-adapter", () => ({
  PrismaAdapter: jest.fn(() => ({ fixture: true })),
}));
jest.mock("@/app/_auth/policy", () => ({
  getEffectiveFeatures: jest.fn(),
  getAuthzRevision: jest.fn(),
}));
import { PrismaClient } from "@prisma/client";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

const originalEnvironment = {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PHASE: process.env.NEXT_PHASE,
  SKIP_DB: process.env.SKIP_DB,
};
afterEach(() => {
  Object.assign(process.env, originalEnvironment);
  for (const [key, value] of Object.entries(originalEnvironment))
    if (value === undefined) delete process.env[key];
  jest.clearAllMocks();
});
test("production build imports auth without constructing Prisma and denies explicit database access", () => {
  Object.assign(process.env, {
    NODE_ENV: "production",
    NEXT_PHASE: "phase-production-build",
    SKIP_DB: "true",
  });
  jest.isolateModules(() => {
    const { authOptions, getPrisma } =
      jest.requireActual<typeof import("@/auth")>("@/auth");
    expect(authOptions.adapter).toBeUndefined();
    expect(() => getPrisma()).toThrow(
      "Prisma access disabled during Next.js production build.",
    );
  });
  expect(PrismaClient).not.toHaveBeenCalled();
  expect(PrismaAdapter).not.toHaveBeenCalled();
});
test("production runtime retains its database auth adapter even if SKIP_DB was configured", () => {
  Object.assign(process.env, { NODE_ENV: "production", SKIP_DB: "true" });
  delete process.env.NEXT_PHASE;
  jest.isolateModules(() => {
    const { authOptions, getPrisma } =
      jest.requireActual<typeof import("@/auth")>("@/auth");
    expect(authOptions.adapter).toBeDefined();
    expect(getPrisma()).toBeDefined();
  });
  expect(PrismaClient).toHaveBeenCalledTimes(1);
  expect(PrismaAdapter).toHaveBeenCalledTimes(1);
});
