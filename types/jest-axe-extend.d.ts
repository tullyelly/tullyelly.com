// types/jest-axe-extend.d.ts

// Ensure runtime extension + provide types
import "jest-axe/extend-expect";

// ---- Type augmentations (cover both style of Jest typings) ----

// a) Classic @types/jest augmentation
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
    }
  }
}

// b) Newer Jest typings via `expect` module
declare module "expect" {
  interface Matchers<R> {
    toHaveNoViolations(): R;
  }
}
