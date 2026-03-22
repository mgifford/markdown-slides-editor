const DEFAULT_SLIDE_WIDTH = 1280;
const DEFAULT_SLIDE_HEIGHT = 720;
const MIN_BODY_SCALE = 0.72;
const SCALE_STEP = 0.04;

function parseDimension(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getSlideDimensions(metadata = {}) {
  const width = parseDimension(metadata.slideWidth, DEFAULT_SLIDE_WIDTH);
  const height = parseDimension(metadata.slideHeight, DEFAULT_SLIDE_HEIGHT);
  return {
    width,
    height,
    aspectRatio: width / height,
  };
}

export function applySlideDimensions(metadata = {}, root = document.documentElement) {
  const dimensions = getSlideDimensions(metadata);
  root.style.setProperty("--slide-width-px", String(dimensions.width));
  root.style.setProperty("--slide-height-px", String(dimensions.height));
  root.style.setProperty("--slide-aspect-ratio", String(dimensions.aspectRatio));
  return dimensions;
}

export function buildSlideDimensionStyle(metadata = {}) {
  const dimensions = getSlideDimensions(metadata);
  return `--slide-width-px:${dimensions.width};--slide-height-px:${dimensions.height};--slide-aspect-ratio:${dimensions.aspectRatio};`;
}

function wrapSlideBody(contentNode) {
  let bodyNode = contentNode.querySelector(":scope > .slide-card__body");
  if (bodyNode) return bodyNode;

  const bodyChildren = [...contentNode.children].filter((child) => child.tagName !== "H1");
  if (bodyChildren.length === 0) return null;

  bodyNode = document.createElement("div");
  bodyNode.className = "slide-card__body";
  const anchor = contentNode.querySelector(":scope > h1");
  contentNode.insertBefore(bodyNode, anchor ? anchor.nextSibling : contentNode.firstChild);
  bodyChildren.forEach((child) => bodyNode.append(child));
  return bodyNode;
}

function contentOverflows(contentNode) {
  return contentNode.scrollHeight > contentNode.clientHeight + 1 || contentNode.scrollWidth > contentNode.clientWidth + 1;
}

export function fitSlideBodyText(container, renderedSlide) {
  if (!container || !renderedSlide || renderedSlide.kind === "title" || renderedSlide.kind === "closing") {
    return { scale: 1, overflow: false };
  }

  const contentNode = container.querySelector(".slide-card__content");
  if (!contentNode) return { scale: 1, overflow: false };

  const bodyNode = wrapSlideBody(contentNode);
  if (!bodyNode) return { scale: 1, overflow: false };

  let scale = 1;
  bodyNode.style.setProperty("--slide-body-scale", String(scale));

  while (scale > MIN_BODY_SCALE && contentOverflows(contentNode)) {
    scale = Math.max(MIN_BODY_SCALE, Number((scale - SCALE_STEP).toFixed(2)));
    bodyNode.style.setProperty("--slide-body-scale", String(scale));
  }

  const overflow = contentOverflows(contentNode);
  container.dataset.slideOverflow = overflow ? "true" : "false";
  return { scale, overflow };
}
