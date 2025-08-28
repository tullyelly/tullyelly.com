import { STATUS_STYLES, TYPE_STYLES } from "@/app/ui/badge-maps";

test("status and type maps contain expected keys", () => {
  for (const k of ["planned", "released", "hotfix", "archived"]) {
    expect(STATUS_STYLES[k]).toBeTruthy();
  }
  for (const k of ["hotfix", "minor", "major", "planned"]) {
    expect(TYPE_STYLES[k]).toBeTruthy();
  }
});
