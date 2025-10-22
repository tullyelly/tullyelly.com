import { SITE_URL } from "./constants";

export function canonicalFor(path: string, search?: string): string {
  const base = SITE_URL.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return search ? `${base}${p}${search}` : `${base}${p}`;
}

export function clampDescription(desc: string, min = 40, max = 180): string {
  if (desc.length < min) return desc;
  if (desc.length > max) return desc.slice(0, max - 1) + "...";
  return desc;
}
