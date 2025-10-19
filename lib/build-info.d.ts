// Type-only declaration so typecheck passes on clean clones
// even before the generator writes lib/build-info.ts.

declare module "@/lib/build-info" {
  export type BuildInfo = {
    name: string;
    version: string;
    commit: string;
    branch: string;
    message: string;
    dirty: boolean;
    buildTime: string;
    env: string;
    region: string;
    url: string;
  };
  export const buildInfo: BuildInfo;
}
