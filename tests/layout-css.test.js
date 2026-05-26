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

test("on-click hidden column uses visibility:hidden not display:none to prevent layout shift", () => {
  const css = readFileSync(new URL("../styles/app.css", import.meta.url), "utf8");

  // The rule must set display:block (to override the UA [hidden] rule)
  // and visibility:hidden so the column still occupies flex space.
  const ruleMatch = css.match(
    /\.slide-card\s+\.layout-columns\s+\.layout-columns__column\.next\[hidden\][\s\S]*?\{([\s\S]*?)\}/,
  );
  assert.ok(
    ruleMatch,
    "CSS should include a rule for .slide-card .layout-columns .layout-columns__column.next[hidden]",
  );

  const ruleBody = ruleMatch[1];
  assert.ok(
    /display\s*:\s*block/.test(ruleBody),
    "hidden on-click column should set display:block to override UA [hidden] rule",
  );
  assert.ok(
    /visibility\s*:\s*hidden/.test(ruleBody),
    "hidden on-click column should use visibility:hidden so the column still occupies flex space and the sibling column does not reflow",
  );

  // One-page view must restore full visibility for those same elements
  const onePageMatch = css.match(
    /\.one-page-body\s+\.layout-columns\s+\.layout-columns__column\.next\[hidden\][\s\S]*?\{([\s\S]*?)\}/,
  );
  assert.ok(
    onePageMatch,
    "CSS should include a one-page-body rule that restores visibility for hidden on-click columns",
  );
  assert.ok(
    /visibility\s*:\s*visible/.test(onePageMatch[1]),
    "one-page-body rule should restore visibility:visible for hidden on-click columns",
  );
});

test("h1+h2 heading pair uses min-height and margin-bottom to keep the subtitle block at a fixed size", () => {
  const css = readFileSync(new URL("../styles/app.css", import.meta.url), "utf8");

  // Find the .slide-card h1 + h2 rule
  const h1h2Match = css.match(/\.slide-card\s+h1\s*\+\s*h2\s*\{([\s\S]*?)\}/);
  assert.ok(
    h1h2Match,
    "CSS should include a .slide-card h1 + h2 rule for heading-pair layout",
  );

  const ruleBody = h1h2Match[1];
  assert.ok(
    /min-height/.test(ruleBody),
    ".slide-card h1 + h2 should set min-height to reserve consistent space for the subtitle " +
    "so the body content start-position does not shift when navigating between slides",
  );
  assert.ok(
    /margin-bottom/.test(ruleBody),
    ".slide-card h1 + h2 should set margin-bottom to create a consistent gap before body content",
  );
});

test("slide body is top-aligned when h1+h2 are present at the slide content level", () => {
  const css = readFileSync(new URL("../styles/app.css", import.meta.url), "utf8");

  // The selector anchors body content to the top when H1 and H2 are slide-level headings,
  // preventing the body from floating at different vertical positions on different slides.
  const anchorRuleMatch = css.match(
    /\.slide-card__content\s*>\s*h1\s*\+\s*h2\s*\+\s*\.slide-card__body\s*\{([\s\S]*?)\}/,
  );
  assert.ok(
    anchorRuleMatch,
    "CSS should include a rule for .slide-card__content > h1 + h2 + .slide-card__body to anchor body below headings",
  );

  const ruleBody = anchorRuleMatch[1];
  assert.ok(
    /justify-content\s*:\s*flex-start/.test(ruleBody),
    ".slide-card__content > h1 + h2 + .slide-card__body should use justify-content:flex-start " +
    "so body content anchors below the heading block instead of floating in the center",
  );
});
