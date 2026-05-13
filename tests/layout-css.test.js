import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("responsive column layout keeps .layout-columns side-by-side at the 1100px breakpoint", () => {
  const css = readFileSync(new URL("../styles/app.css", import.meta.url), "utf8");
  const desktopToTabletBlock = css
    .split("@media (max-width: 1100px) {")[1]
    ?.split("@media (max-width: 800px) {")[0] || "";

  assert.equal(
    desktopToTabletBlock.includes(".layout-columns"),
    false,
    "1100px rules should not collapse two-column slide directives",
  );
});
