import dns from "node:dns";

try {
  dns.setDefaultResultOrder("ipv4first");
} catch (error) {
  if (process.env.NODE_ENV !== "production") {
    console.warn("[dns-polyfill] Failed to set default result order", error);
  }
}
