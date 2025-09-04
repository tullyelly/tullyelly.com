// types/fs-extra.d.ts
// [WU-251] Minimal module declaration for fs-extra
// TODO(WU-251): replace `any` with accurate fs-extra typings

declare module 'fs-extra' {
  const fsExtra: any;
  export default fsExtra;
}
