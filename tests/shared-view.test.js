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
