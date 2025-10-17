export type Crumb = {
  label: string;
  href?: string;
};

let currentBreadcrumb: Crumb[] | null = null;

export function setBreadcrumb(
  items: readonly Crumb[] | null | undefined,
): void {
  currentBreadcrumb = Array.isArray(items)
    ? items.map((item) => ({ ...item }))
    : null;
}

export function getBreadcrumb(): Crumb[] | null {
  return currentBreadcrumb
    ? currentBreadcrumb.map((item) => ({ ...item }))
    : null;
}

export function clearBreadcrumb(): void {
  currentBreadcrumb = null;
}
