export type Crumb = {
  label: string;
  href?: string;
};

let currentBreadcrumb: Crumb[] | null = null;

export function setBreadcrumb(items: readonly Crumb[]): void {
  currentBreadcrumb = Array.isArray(items) ? [...items] : null;
}

export function getBreadcrumb(): Crumb[] | null {
  return currentBreadcrumb;
}
