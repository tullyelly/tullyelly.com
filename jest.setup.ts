import "@testing-library/jest-dom";

import { createRequire } from "node:module";
import {
  MessageChannel as NodeMessageChannel,
  MessagePort as NodeMessagePort,
} from "node:worker_threads";
import {
  ReadableStream,
  TransformStream,
  WritableStream,
} from "node:stream/web";
import { TextDecoder, TextEncoder } from "node:util";
import { expect } from "@jest/globals";
import { cleanup } from "@testing-library/react";
import { act } from "react";

process.env.TEST_MODE = process.env.TEST_MODE ?? "1";
process.env.NEXT_PUBLIC_TEST_MODE = process.env.NEXT_PUBLIC_TEST_MODE ?? "1";
(globalThis as any).ReadableStream = ReadableStream;
(globalThis as any).WritableStream = WritableStream;
(globalThis as any).TransformStream = TransformStream;
(globalThis as any).TextEncoder = TextEncoder;
(globalThis as any).TextDecoder =
  TextDecoder as unknown as typeof globalThis.TextDecoder;

// Web API polyfills for Node-based tests and Next internals.
const require = createRequire(import.meta.url);

const hadMessageChannel =
  typeof (globalThis as any).MessageChannel !== "undefined";
const hadMessagePort = typeof (globalThis as any).MessagePort !== "undefined";

if (!hadMessageChannel && typeof NodeMessageChannel !== "undefined") {
  (globalThis as any).MessageChannel = NodeMessageChannel as any;
}
if (!hadMessagePort && typeof NodeMessagePort !== "undefined") {
  (globalThis as any).MessagePort = NodeMessagePort as any;
}

const axeMatchers = require("jest-axe").toHaveNoViolations;
const {
  fetch,
  Request,
  Response,
  Headers,
  FormData,
  File,
  Blob,
} = require("undici");
(globalThis as any).fetch = fetch;
(globalThis as any).Request = Request;
(globalThis as any).Response = Response;
(globalThis as any).Headers = Headers;
(globalThis as any).FormData = FormData;
(globalThis as any).File = File;
(globalThis as any).Blob = Blob;

expect.extend(axeMatchers);

// --- Quiet Next.js Link/IO/idle-callback side-effects and flush renders ---

// Make next/link behave like a plain <a> (no prefetch or state updates in tests).
// Avoid JSX in this file; use React.createElement to keep it runtime-only.
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => {
    const React = require("react");
    const to = typeof href === "string" ? href : href?.pathname || "#";
    const {
      prefetch: _prefetch,
      replace: _replace,
      scroll: _scroll,
      shallow: _shallow,
      locale: _locale,
      legacyBehavior: _legacyBehavior,
      passHref: _passHref,
      ...anchorProps
    } = props ?? {};
    return React.createElement("a", { href: to, ...anchorProps }, children);
  },
}));

// Minimal IntersectionObserver so Next's useIntersection doesn't schedule updates.
class __JestMockIO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).IntersectionObserver =
  (globalThis as any).IntersectionObserver || (__JestMockIO as any);

// Stable requestIdleCallback/cancelIdleCallback so nothing lingers.
(globalThis as any).requestIdleCallback =
  (globalThis as any).requestIdleCallback ||
  ((cb: any) => setTimeout(() => cb({ timeRemaining: () => 0 }), 0));
(globalThis as any).cancelIdleCallback =
  (globalThis as any).cancelIdleCallback || ((id: number) => clearTimeout(id));

// Ensure unmount + microtask flush after each test to settle async work.
async function __flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

afterEach(async () => {
  await __flush();
  cleanup();
});

// Key fix: steer React 18 scheduler away from MessageChannel (prevents MESSAGEPORT open handles).
if (typeof (globalThis as any).MessageChannel !== "undefined") {
  (globalThis as any).MessageChannel = undefined as any;
}
if (typeof (globalThis as any).MessagePort !== "undefined") {
  (globalThis as any).MessagePort = undefined as any;
}
