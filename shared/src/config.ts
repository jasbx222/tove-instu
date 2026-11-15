// Per-application settings. The shared folder is copied into each repository;
// only this file differs between the admin, teacher, and institute builds.
export type AppKind = "admin" | "teacher" | "institute"

export const appConfig: { kind: AppKind; serverSearch: boolean } = {
  kind: "institute",
  // The admin API filters lists with `q`. The teacher and institute lists filter the loaded page.
  serverSearch: false,
}
