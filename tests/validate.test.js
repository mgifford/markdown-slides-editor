import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateDeck } from "../src/modules/validate.js";
import { parseSource } from "../src/modules/parser.js";
import { LAYOUT_DIRECTIVES, isSectionDirective } from "../src/modules/directives.js";

function codes(report, kind = "errors") {
  return report[kind].map((issue) => issue.code);
}

test("validateDeck flags an unclosed layout directive that swallows the next slide", () => {
  const source = "# One\n\n::callout\nCallout text.\n\n---\n\n# Two";
  const report = validateDeck(source);
  assert.equal(report.valid, false);
  assert.ok(codes(report).includes("UNCLOSED_DIRECTIVE"), codes(report).join(","));
  assert.ok(codes(report).includes("SEPARATOR_INSIDE_DIRECTIVE"), codes(report).join(","));
  assert.equal(parseSource(source).slides.length, 1);
});

test("validateDeck accepts a correctly closed layout directive", () => {
  const source = "# One\n\n::callout\nCallout text.\n::\n\n---\n\n# Two";
  const report = validateDeck(source);
  assert.equal(report.valid, true);
  assert.equal(report.errors.length, 0);
  assert.equal(report.warnings.length, 0);
  assert.equal(parseSource(source).slides.length, 2);
});

test("validateDeck accepts an unclosed speaker section ending at the next slide", () => {
  const source = "# One\n\n::notes\nNote text.\n\n---\n\n# Two";
  const report = validateDeck(source);
  assert.equal(report.valid, true);
  const deck = parseSource(source);
  assert.equal(deck.slides.length, 2);
  assert.equal(deck.slides[0].notes, "Note text.");
});

test("validateDeck accepts internal --- sections for media/split directives", () => {
  for (const directive of ["media-left", "media-right", "split-left", "split-right"]) {
    const source = `# One\n\n::${directive}\n![Alt](https://example.com/image.jpg)\n---\nSupporting text.\n::\n\n---\n\n# Two`;
    const report = validateDeck(source);
    assert.equal(report.valid, true, `${directive}: ${JSON.stringify(report.errors)}`);
    assert.equal(parseSource(source).slides.length, 2);
  }
});

test("validateDeck accepts internal --- sections for figure/big-stat/image-hero within bounds", () => {
  const figure = "# One\n\n::figure\n![A chart](chart.png)\n---\nCaption.\n::\n\n---\n\n# Two";
  const bigStat = "# One\n\n::big-stat\n**73%**\n---\nBody text.\n::\n\n---\n\n# Two";
  const hero = "# One\n\n::image-hero text-bottom-left\n![Alt](photo.jpg)\n---\nShort overlay\n::\n\n---\n\n# Two";
  for (const source of [figure, bigStat, hero]) {
    const report = validateDeck(source);
    assert.equal(report.valid, true, JSON.stringify(report.errors));
    assert.equal(parseSource(source).slides.length, 2);
  }
});

test("validateDeck reports too many internal --- sections as MALFORMED_DIRECTIVE_SECTIONS", () => {
  const source = "::big-stat\n1\n---\n2\n---\n3\n---\n4\n::";
  const report = validateDeck(source);
  assert.equal(report.valid, false);
  assert.ok(codes(report).includes("MALFORMED_DIRECTIVE_SECTIONS"));
});

test("validateDeck warns when a media directive has no internal --- section", () => {
  const source = "::media-left\n![Alt](https://example.com/image.jpg)\n::";
  const report = validateDeck(source);
  assert.equal(report.valid, true);
  assert.ok(codes(report, "warnings").includes("MISSING_DIRECTIVE_SECTION"));
});

test("validateDeck flags an unknown directive as an error", () => {
  const source = "# One\n\n::column-middle\nCustom box.\n::\n\n---\n\n# Two";
  const report = validateDeck(source);
  assert.equal(report.valid, false);
  assert.ok(codes(report).includes("UNKNOWN_DIRECTIVE"));
});

test("validateDeck warns about modifiers the renderer ignores", () => {
  const source = "::callout on-hover\nText.\n::";
  const report = validateDeck(source);
  const warning = report.warnings.find((issue) => issue.code === "UNKNOWN_MODIFIER");
  assert.ok(warning, JSON.stringify(report.warnings));
  assert.match(warning.message, /on-hover/);
  assert.equal(report.valid, true);
});

test("validateDeck reports an unmatched closing :: as a warning", () => {
  const source = "# One\n::\n---\n# Two";
  const report = validateDeck(source);
  assert.equal(report.valid, true);
  assert.ok(codes(report, "warnings").includes("UNMATCHED_CLOSE"));
});

test("validateDeck reports a --- inside a directive that does not allow internal sections", () => {
  const source = "# One\n::center\nA\n---\nB\n::\n---\n# Two";
  const report = validateDeck(source);
  assert.ok(codes(report).includes("SEPARATOR_INSIDE_DIRECTIVE"));
});

test("validateDeck reports an unclosed directive at end of content", () => {
  const source = "# One\n\n::callout\nNever closed.";
  const report = validateDeck(source);
  assert.ok(codes(report).includes("UNCLOSED_DIRECTIVE"));
});

test("validateDeck line numbers account for the front matter block", () => {
  const source = "---\ntitle: Demo\n---\n# One\n\n::callout\nCallout text.\n\n---\n\n# Two";
  const report = validateDeck(source);
  const unclosed = report.errors.find((issue) => issue.code === "UNCLOSED_DIRECTIVE");
  assert.ok(unclosed, JSON.stringify(report.errors));
  assert.equal(unclosed.line, 6); // ::callout is the 6th source line
});

test("validateDeck and parseSource agree that ::iframe modifiers with colons are directive syntax", () => {
  const source = "# One\n\n::iframe title:Demo width:80% height:60vh\nhttps://example.com\n::\n\n---\n\n# Two";
  const report = validateDeck(source);
  assert.equal(report.valid, true);
  assert.equal(parseSource(source).slides.length, 2);
});

test("validateDeck flags an unclosed ::iframe with colon modifiers as swallowing slides", () => {
  const source = "# One\n\n::iframe title:Demo width:80% height:60vh\nhttps://example.com\n\n---\n\n# Two";
  const report = validateDeck(source);
  assert.ok(codes(report).includes("UNCLOSED_DIRECTIVE"));
  assert.ok(codes(report).includes("SEPARATOR_INSIDE_DIRECTIVE"));
});

test("every canonical example deck parses to its pinned slide count and validates cleanly", () => {
  const pinned = {
    "examples/government-policy.md": 8,
    "examples/technical-talk.md": 8,
    "examples/evidence-report.md": 8,
    "examples/keynote.md": 7,
  };
  for (const [file, expectedSlides] of Object.entries(pinned)) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    const report = validateDeck(source);
    assert.equal(report.valid, true, `${file} should validate: ${JSON.stringify(report.errors)}`);
    assert.equal(report.warnings.length, 0, `${file} should have no warnings`);
    assert.equal(parseSource(source).slides.length, expectedSlides, `${file} slide count`);
  }
});

test("AI_AUTHORING.md documents every supported layout directive", () => {
  const doc = readFileSync(new URL("../AI_AUTHORING.md", import.meta.url), "utf8");
  for (const name of Object.keys(LAYOUT_DIRECTIVES)) {
    assert.ok(doc.includes(`\`::${name}\``), `AI_AUTHORING.md should mention ::${name}`);
  }
});

test("AI_AUTHORING.md documents speaker sections only if the registry declares them", () => {
  const doc = readFileSync(new URL("../AI_AUTHORING.md", import.meta.url), "utf8");
  for (const name of ["note", "notes", "resource", "resources", "reference", "references", "script", "scripts"]) {
    assert.equal(isSectionDirective(name), true, `${name} should be a section`);
  }
  assert.ok(doc.includes("::note"), "AI_AUTHORING.md should mention ::note");
});