import { applySlideDimensions, buildSlideDimensionStyle } from "./slide-layout.js";

const THEME_LINK_ID = "deck-theme-stylesheet";
const DECK_COLOR_STYLE_ID = "deck-color-overrides";

export const BUILT_IN_THEMES = [
  {
    id: "default-high-contrast",
    label: "Default high contrast",
  },
  {
    id: "paper-warm",
    label: "Paper warm",
  },
  {
    id: "night-slate",
    label: "Night slate",
  },
  {
    id: "civic-bright",
    label: "Civic bright",
  },
];

/**
 * Maps front matter color key names to their CSS custom property targets.
 * Each token supports three variants:
 *   - `key`       → applies to :root (both light and dark modes)
 *   - `keyLight`  → applies to :root[data-color-mode="light"] only
 *   - `keyDark`   → applies to :root[data-color-mode="dark"] only
 */
export const COLOR_TOKENS = [
  { key: "colorAccent", cssVar: "--accent" },
  { key: "colorCanvas", cssVar: "--bg" },
  { key: "colorCard", cssVar: "--panel" },
  { key: "colorCardStrong", cssVar: "--panel-strong" },
  { key: "colorCardSoft", cssVar: "--panel-alt" },
  { key: "colorInk", cssVar: "--ink" },
  { key: "colorMuted", cssVar: "--muted" },
  { key: "colorH1", cssVar: "--slide-h1-color" },
  { key: "colorH2", cssVar: "--slide-h2-color" },
];

/**
 * Sanitize a color value from front matter. Only allows characters valid in
 * CSS color values; rejects anything that could break out of a property
 * declaration or inject additional rules.
 */
function sanitizeColorValue(value) {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim();
  if (/[;{}<\\]/.test(trimmed)) return "";
  return trimmed;
}

/**
 * Build a CSS string applying deck-level color overrides extracted from
 * front matter metadata. Returns an empty string when no color keys are present.
 *
 * Supports three variants per token:
 *   - `colorAccent`      → :root (both modes)
 *   - `colorAccentLight` → :root[data-color-mode="light"]
 *   - `colorAccentDark`  → :root[data-color-mode="dark"]
 */
export function buildDeckColorStyle(metadata = {}) {
  const rootDecls = [];
  const lightDecls = [];
  const darkDecls = [];

  for (const { key, cssVar } of COLOR_TOKENS) {
    const base = sanitizeColorValue(metadata[key]);
    const light = sanitizeColorValue(metadata[`${key}Light`]);
    const dark = sanitizeColorValue(metadata[`${key}Dark`]);

    if (base) rootDecls.push(`  ${cssVar}: ${base};`);
    if (light) lightDecls.push(`  ${cssVar}: ${light};`);
    if (dark) darkDecls.push(`  ${cssVar}: ${dark};`);
  }

  if (!rootDecls.length && !lightDecls.length && !darkDecls.length) return "";

  const parts = [];
  if (rootDecls.length) parts.push(`:root {\n${rootDecls.join("\n")}\n}`);
  if (lightDecls.length) parts.push(`:root[data-color-mode="light"] {\n${lightDecls.join("\n")}\n}`);
  if (darkDecls.length) parts.push(`:root[data-color-mode="dark"] {\n${darkDecls.join("\n")}\n}`);

  return parts.join("\n");
}

export function isValidThemeStylesheetUrl(value) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function ensureThemeLink() {
  let link = document.querySelector(`#${THEME_LINK_ID}`);
  if (!link) {
    link = document.createElement("link");
    link.id = THEME_LINK_ID;
    link.rel = "stylesheet";
    document.head.append(link);
  }
  return link;
}

function applyDeckColorStyle(metadata = {}) {
  let style = document.querySelector(`#${DECK_COLOR_STYLE_ID}`);
  const css = buildDeckColorStyle(metadata);

  if (!css) {
    if (style) style.remove();
    return;
  }

  if (!style) {
    style = document.createElement("style");
    style.id = DECK_COLOR_STYLE_ID;
    document.head.append(style);
  }
  style.textContent = css;
}

export function applyDeckTheme(metadata = {}) {
  const theme = metadata.theme || "default-high-contrast";
  document.documentElement.dataset.theme = theme;
  document.documentElement.lang = metadata.lang || "en";
  applySlideDimensions(metadata);
  applyDeckColorStyle(metadata);

  const link = ensureThemeLink();
  if (isValidThemeStylesheetUrl(metadata.themeStylesheet)) {
    link.href = metadata.themeStylesheet;
    link.disabled = false;
  } else {
    link.href = "";
    link.disabled = true;
  }
}

export function buildThemeLinkTag(metadata = {}) {
  if (!isValidThemeStylesheetUrl(metadata.themeStylesheet)) {
    return "";
  }

  return `<link rel="stylesheet" href="${metadata.themeStylesheet}" />`;
}

export function buildDeckStyleAttribute(metadata = {}) {
  return buildSlideDimensionStyle(metadata);
}
