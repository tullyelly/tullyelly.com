// Fixture-only document navigation stands in for server-rendered query responses.
// Production code continues using Next's router and server readers.
export function usePathname() {
  return window.location.pathname;
}
export function useSearchParams() {
  return new URLSearchParams(window.location.search);
}
export function useRouter() {
  return {
    push: (href: string) => window.location.assign(href),
    replace: (href: string) => window.location.replace(href),
    refresh: () => window.location.reload(),
  };
}
