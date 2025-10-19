#!/usr/bin/env node
import { setTimeout as delay } from "node:timers/promises";
import nextConfig from "../next.config.mjs";

async function main() {
  const targetUrl = process.argv[2] ?? "http://127.0.0.1:4010/";
  const requiredHeaders = [
    "Strict-Transport-Security",
    "X-Frame-Options",
    "X-Content-Type-Options",
  ];

  if (typeof nextConfig.headers !== "function") {
    throw new Error(
      "next.config.mjs does not expose a headers() function to inspect.",
    );
  }

  const configHeaders = await nextConfig.headers();
  const globalHeaderConfig = configHeaders.find(
    (entry) => entry.source === "/(.*)",
  );
  if (!globalHeaderConfig) {
    throw new Error("Missing /(.*) header config in next.config.mjs.");
  }

  const expectedHeaderMap = new Map();
  for (const { key, value } of globalHeaderConfig.headers) {
    if (requiredHeaders.includes(key)) {
      expectedHeaderMap.set(key.toLowerCase(), value);
    }
  }

  for (const headerName of requiredHeaders) {
    const normalized = headerName.toLowerCase();
    if (!expectedHeaderMap.has(normalized)) {
      throw new Error(
        `Expected ${headerName} to be defined in next.config.mjs headers().`,
      );
    }
  }

  const maxAttempts = 15;
  let response;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      response = await fetch(targetUrl, { redirect: "manual" });
      break;
    } catch (error) {
      if (attempt === maxAttempts) {
        throw new Error(
          `Failed to fetch ${targetUrl}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      await delay(500);
    }
  }

  if (!response) {
    throw new Error(`No response received from ${targetUrl}.`);
  }

  if (!response.ok) {
    let snippet = "";
    try {
      const bodyText = await response.text();
      const compact = bodyText.replace(/\s+/g, " ").trim();
      snippet = compact.slice(0, 280);
    } catch {
      // ignore body read errors; snippet stays empty
    }
    const details = snippet ? ` Body preview: ${snippet}` : "";
    throw new Error(
      `Security header check expected HTTP 2xx; received ${response.status}.${details}`,
    );
  }

  const actualHeaderMap = new Map();
  for (const [key, value] of response.headers.entries()) {
    actualHeaderMap.set(key.toLowerCase(), value);
  }

  for (const [normalizedKey, expectedValue] of expectedHeaderMap.entries()) {
    const actualValue = actualHeaderMap.get(normalizedKey);
    if (!actualValue) {
      throw new Error(`Missing ${normalizedKey} header on ${targetUrl}.`);
    }
    if (actualValue.trim() !== expectedValue) {
      throw new Error(
        `Header ${normalizedKey} expected "${expectedValue}"; received "${actualValue.trim()}".`,
      );
    }
  }

  console.log(`Security headers verified for ${targetUrl}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
