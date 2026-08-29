import test from "node:test";
import assert from "node:assert/strict";
import { parseSource } from "../src/modules/parser.js";
import { renderDeck } from "../src/modules/render.js";

function buildRenderedSlide(markdown) {
  const deck = parseSource(`---\ntitle: Test\n---\n\n${markdown}`);
  return renderDeck(deck).renderedSlides[0];
}

function buildArticleHtml(renderedSlide, options = {}) {
  const { deferActivation = false, includeLabel = true } = options;
  const title = renderedSlide.headings.find((h) => h.level === 1)?.text || "Slide preview";
  const slideClasses = ["slide-card"];
  if (renderedSlide.isImageHero) {
    slideClasses.push("slide-card--image-hero");
    if (renderedSlide.imageHeroShowAll) slideClasses.push("slide-card--image-hero-show-all");
    if (renderedSlide.imageHeroShowTitle) slideClasses.push("slide-card--image-hero-show-title");
    if (renderedSlide.imageHeroShowSubtitle) slideClasses.push("slide-card--image-hero-show-subtitle");
  } else if (renderedSlide.kind === "title") {
    slideClasses.push("slide-card--title");
  }
  const slideClass = slideClasses.join(" ");
  const activeClass = deferActivation ? "" : " active";
  const escapeAttribute = (v) => String(v).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
  return `<article class="${slideClass}${activeClass}"${includeLabel ? ` aria-label="${escapeAttribute(title)}"` : ""}>`;
}

test("mountSlideInto includes active class by default", () => {
  const slide = buildRenderedSlide("# Hello\n\nWorld");
  const html = buildArticleHtml(slide);
  assert.ok(html.includes('class="slide-card active"'), "should include active class");
});

test("mountSlideInto omits active class when deferActivation is true", () => {
  const slide = buildRenderedSlide("# Hello\n\nWorld");
  const html = buildArticleHtml(slide, { deferActivation: true });
  assert.ok(html.includes('class="slide-card"'), "should not include active class");
  assert.ok(!html.includes("active"), "active should not appear anywhere in class");
});

test("mountSlideInto with hero slide includes active class by default", () => {
  const slide = buildRenderedSlide("# Hero\n\n::image-hero\n![alt](https://example.com/img.jpg)");
  const html = buildArticleHtml(slide);
  assert.ok(html.includes("slide-card--image-hero"), "should have hero class");
  assert.ok(html.includes("active"), "should include active class");
});

test("mountSlideInto with hero slide omits active class when deferActivation is true", () => {
  const slide = buildRenderedSlide("# Hero\n\n::image-hero\n![alt](https://example.com/img.jpg)");
  const html = buildArticleHtml(slide, { deferActivation: true });
  assert.ok(html.includes("slide-card--image-hero"), "should have hero class");
  assert.ok(!html.includes("active"), "active should not appear in class");
});

// Integration: the full deck pipeline (parseSource -> renderDeck) must produce a
// mountable math node for native LaTeX delimiters, and flag the slide as
// containing math so the view knows to load MathJax. This is the app-level path
// that catches "the running app does not recognise \( \) / \[ \]".

test("deck pipeline produces a MathJax-ready node for native inline \\( \\) math", () => {
  const slide = buildRenderedSlide("# Math\n\nEnergy \\( E = mc^2 \\) is famous.");
  assert.ok(slide.hasMath, "slide must be flagged as containing math");
  assert.ok(
    slide.html.includes('class="math-tex math-tex--inline"'),
    "must emit an inline math node",
  );
  assert.ok(
    slide.html.includes('data-math-source="E = mc^2"'),
    "must preserve the LaTeX source",
  );
  assert.ok(slide.html.includes("\\(E = mc^2\\)"), "must wrap in MathJax delimiters");
});

test("deck pipeline produces a display math node for native \\[ \\] math", () => {
  const slide = buildRenderedSlide("# Math\n\n\\[\nE = mc^2\n\\]");
  assert.ok(slide.hasMath, "slide must be flagged as containing math");
  assert.ok(
    slide.html.includes('class="math-tex math-tex--display"'),
    "must emit a display math node",
  );
});

test("deck pipeline leaves a plain deck free of math markup", () => {
  const slide = buildRenderedSlide("# Plain\n\nJust text, no math.");
  assert.equal(slide.hasMath, false);
  assert.ok(!slide.html.includes("math-tex"), "must not emit math nodes");
});
