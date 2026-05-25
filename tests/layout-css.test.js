import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("responsive column layout keeps .layout-columns side-by-side at the 1100px breakpoint", () => {
  const css = readFileSync(new URL("../styles/app.css", import.meta.url), "utf8");
  const desktopToTabletBlock = css
    .split("@media (max-width: 1100px) {")[1]
    ?.split("@media (max-width: 800px) {")[0] || "";
  const mobileBlock = css
    .split("@media (max-width: 800px) {")[1]
    ?.split("@media (max-height: 500px) and (orientation: landscape) {")[0] || "";

  assert.equal(
    desktopToTabletBlock.includes(".layout-columns"),
    false,
    "1100px rules should not collapse two-column slide directives",
  );
  assert.equal(
    mobileBlock.includes(".layout-columns"),
    true,
    "800px rules should collapse two-column slide directives for mobile screens",
  );
});

test("column-left and column-right are each constrained to max-width 50%", () => {
  const css = readFileSync(new URL("../styles/app.css", import.meta.url), "utf8");

  assert.ok(
    css.includes(".layout-columns__column--left"),
    "CSS should include a rule for .layout-columns__column--left",
  );
  assert.ok(
    css.includes(".layout-columns__column--right"),
    "CSS should include a rule for .layout-columns__column--right",
  );

  // Find the rule block that constrains these columns to 50%
  const leftRuleMatch = css.match(/\.layout-columns__column--left[\s\S]*?max-width:\s*50%/);
  assert.ok(
    leftRuleMatch,
    "column-left should have max-width: 50% to prevent it stretching into the right column's space",
  );

  const rightRuleMatch = css.match(/\.layout-columns__column--right[\s\S]*?max-width:\s*50%/);
  assert.ok(
    rightRuleMatch,
    "column-right should have max-width: 50% to prevent it stretching into the left column's space",
  );
});

test("column-left and column-right with explicit width override the 50% cap", () => {
  const css = readFileSync(new URL("../styles/app.css", import.meta.url), "utf8");

  // The [style] selector rule should define max-width using the custom property
  const styleRuleIdx = css.indexOf(".layout-columns__column[style]");
  const modifierRuleIdx = css.search(/\.layout-columns__column--(left|right)/);

  assert.ok(styleRuleIdx !== -1, ".layout-columns__column[style] rule should exist");
  assert.ok(modifierRuleIdx !== -1, ".layout-columns__column--left/right rule should exist");
  assert.ok(
    styleRuleIdx < modifierRuleIdx,
    "the [style] explicit-width rule should appear before the --left/--right rule; the [style] selector has higher specificity so it wins even for the max-width override",
  );

  assert.ok(
    css.includes("max-width: var(--column-basis)"),
    ".layout-columns__column[style] should set max-width to var(--column-basis) for explicit widths",
  );
});
