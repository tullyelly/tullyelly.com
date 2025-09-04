// types/jest-axe.d.ts
// [WU-251] Minimal module declarations for jest-axe

declare module 'jest-axe' {
  // TODO(WU-251): refine parameter and return types
  export function axe(...args: any[]): Promise<any>;
  export const toHaveNoViolations: {
    toHaveNoViolations: (...args: any[]) => any;
  };
  export function configureAxe(...args: any[]): any;
}
