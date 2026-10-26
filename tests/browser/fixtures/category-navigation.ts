// Browser-fixture routing only. Production components keep the real Next router.
export function useRouter() {
  return {
    refresh() {
      window.dispatchEvent(new Event("category-fixture-refresh"));
    },
  };
}
