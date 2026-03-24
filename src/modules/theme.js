import { applySlideDimensions, buildSlideDimensionStyle } from "./slide-layout.js";

const THEME_LINK_ID = "deck-theme-stylesheet";

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

export function applyDeckTheme(metadata = {}) {
  const theme = metadata.theme || "default-high-contrast";
  document.documentElement.dataset.theme = theme;
  applySlideDimensions(metadata);

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
