/**
 * Single source of truth for the authoring directive grammar.
 *
 * Every consumer that needs to know "is this a directive?", "must it be
 * closed?", "does it use internal `---` sections?", or "which modifiers are
 * valid" should read it from here instead of re-deriving it:
 *
 * - `src/modules/parser.js`  (slide splitting honours the same grammar)
 * - `src/modules/markdown.js` (directive block rendering)
 * - `src/modules/validate.js` (structured deck validation)
 * - `src/modules/ai-prompt.js` (capability summary embedded in AI prompts)
 * - `AI_AUTHORING.md` (documented as the authoritative human-readable spec)
 *
 * Keep the documentation, the validator, and the parser in lock-step with the
 * entries in `LAYOUT_DIRECTIVES` and `SECTION_DIRECTIVE_NAMES`.
 */

// Matches a directive open line, e.g. `::image-hero text-bottom-left`,
// `::column-left-75% on-click`, `::iframe title:Demo`, or `::notes`.
// Directive names are restricted to letters, digits, `%`, and hyphen-family
// characters so that ordinary prose can never be mistaken for a directive.
// Modifiers are whatever remains on the line after the name.
const DIRECTIVE_LINE_RE = /^::([a-z0-9%\u00ad\u2010-\u2015\u2212-]+)(?:\s+(.+?))?\s*$/i;

const DIRECTIVE_DASH_RE = /[\u00ad\u2010-\u2015\u2212]/g;

export function normalizeDirectiveModifier(modifier) {
  return String(modifier).trim().toLowerCase().replace(DIRECTIVE_DASH_RE, "-");
}

/**
 * Parse a directive open line into a canonical name and a modifier list.
 * Returns `null` when the line is not a directive open. Mirrors the parsing
 * used by the renderer so validation and rendering always agree.
 */
export function parseDirectiveLine(line) {
  const match = DIRECTIVE_LINE_RE.exec(String(line).trim());
  if (!match) {
    return null;
  }
  return {
    name: normalizeDirectiveModifier(match[1]),
    modifiers: match[2]
      ? match[2].trim().split(/\s+/).filter(Boolean).map(normalizeDirectiveModifier)
      : [],
  };
}

export function isDirectiveOpenLine(line) {
  return DIRECTIVE_LINE_RE.test(String(line).trim());
}

const COLUMN_BASE_RE = /^column-(left|right)(?:-[0-9.]+(?:px|%|rem|vw)?)?$/i;

/**
 * Map a directive name onto its canonical registry key. Column width suffixes
 * (`::column-left-75%`) resolve to the base column directive so the registry
 * stays singular while the width stays a free modifier.
 */
export function canonicalDirectiveName(name) {
  const match = COLUMN_BASE_RE.exec(name);
  if (match) return `column-${match[1].toLowerCase()}`;
  return name;
}

// Speaker-support sections are parsed at the slide level (never rendered on
// screen) and their closing `::` is optional: an unclosed section ends at the
// next slide boundary. Singular, plural, and aliased forms are all accepted.
export const SECTION_DIRECTIVE_NAMES = new Set([
  "note",
  "notes",
  "resource",
  "resources",
  "reference",
  "references",
  "script",
  "scripts",
]);

export function isSectionDirective(name) {
  return SECTION_DIRECTIVE_NAMES.has(name);
}

const PROGRESSIVE_MODIFIERS = new Set(["on-click", "off-click"]);

// Image-hero participates in a rich modifier vocabulary; anything else is a
// typo the renderer silently ignores.
function isImageHeroModifier(modifier) {
  if (PROGRESSIVE_MODIFIERS.has(modifier)) return true;
  if (modifier === "show-title" || modifier === "show-subtitle" || modifier === "show-all") {
    return true;
  }
  if (/^(stay|transition|final|saturation)-\d+(?:\.\d+)?$/.test(modifier)) return true;
  if (/^blur-\d+(?:\.\d+)?px$/.test(modifier)) return true;
  if (/^pan-(left|right|up|down)$/.test(modifier)) return true;
  return heroAxisTokens(modifier, "text", true) || heroAxisTokens(modifier, "logo", false);
}

function heroAxisTokens(modifier, prefix, allowCenter) {
  if (!modifier.startsWith(`${prefix}-`)) return false;
  const tokens = modifier.slice(prefix.length + 1).split("-").filter(Boolean);
  if (!tokens.length) return false;
  return tokens.every(
    (token) =>
      token === "top" ||
      token === "bottom" ||
      token === "left" ||
      token === "right" ||
      (allowCenter && token === "center"),
  );
}

/**
 * Return the modifier tokens the renderer does not recognise for a directive.
 * Empty array means every supplied modifier is used (or is free-form, as with
 * the `::code` language token). Validators surface these as warnings because
 * the renderer ignores them silently.
 */
export function getUnexpectedModifiers(canonicalName, modifiers) {
  return modifiers.filter((modifier) => !isModifierRecognized(canonicalName, modifier));
}

function isModifierRecognized(canonicalName, modifier) {
  if (canonicalName === "code") return true; // any single token is the language
  if (canonicalName === "image-hero") return isImageHeroModifier(modifier);
  if (canonicalName === "slide-bg") {
    return PROGRESSIVE_MODIFIERS.has(modifier) || /^opacity-\d+(?:\.\d+)?$/.test(modifier);
  }
  if (canonicalName === "iframe") {
    if (PROGRESSIVE_MODIFIERS.has(modifier)) return true;
    if (/^width:.+$/.test(modifier)) return true;
    if (/^height:.+$/.test(modifier)) return true;
    if (/^title:.+$/.test(modifier)) return true;
    if (/^https?:\/\//i.test(modifier)) return true;
    return false;
  }
  if (canonicalName === "large" || canonicalName === "small") {
    // The renderer ignores every modifier on text-size variants.
    return false;
  }
  if (PROGRESSIVE_MODIFIERS.has(modifier)) return true;
  return false;
}

/**
 * Authoring metadata for every supported layout directive. This is the
 * contract an external AI needs: exact syntax, whether it must close, whether
 * it uses internal `---` sections, design intent, and content density. Keep
 * `AI_AUTHORING.md` and the AI prompt generation in sync with these entries.
 */
export const LAYOUT_DIRECTIVES = {
  center: {
    mustClose: true,
    internalSlideSeparator: false,
    minimumInternalSections: 0,
    maximumInternalSections: 0,
    purpose: "Centre a single image, statement, or short line.",
    use: "One visual moment, one emphatic sentence, or a section transition.",
    avoid: "More than a few words or a list; centering hides hierarchy.",
    recommendedMaxWords: 15,
    example: "::center\n**One clear idea.**\n::",
  },
  svg: {
    mustClose: true,
    internalSlideSeparator: false,
    minimumInternalSections: 0,
    maximumInternalSections: 0,
    purpose: "Present an SVG asset as a figure block.",
    use: "Diagrams, icons, and branded vector illustrations that must stay sharp.",
    avoid: "Decorative SVGs that add noise; put schema/architecture detail in notes.",
    recommendedMaxWords: 6,
    example: "::svg\n![Architecture diagram](./images/diagram.svg)\n::",
  },
  mermaid: {
    mustClose: true,
    internalSlideSeparator: false,
    minimumInternalSections: 0,
    maximumInternalSections: 0,
    purpose: "Render a Mermaid diagram from source text.",
    use: "A small flowchart or graph the audience should read at a glance.",
    avoid: "Large diagrams a screen reader cannot convey; caption the takeaway in text.",
    recommendedMaxWords: 10,
    example: "::mermaid\nflowchart LR\n  A --> B\n::",
  },
  large: {
    mustClose: true,
    internalSlideSeparator: false,
    minimumInternalSections: 0,
    maximumInternalSections: 0,
    purpose: "Scale a block of text up to roughly 1.4x body size.",
    use: "Sparse, high-impact statements that should fill the slide.",
    avoid: "Anything dense; large text amplifies crowded copy into a wall.",
    recommendedMaxWords: 12,
    example: "::large\nOne idea deserves the room.\n::",
  },
  small: {
    mustClose: true,
    internalSlideSeparator: false,
    minimumInternalSections: 0,
    maximumInternalSections: 0,
    purpose: "Scale a block of text down to roughly 0.7x body size.",
    use: "Dense reference material, comparison tables, or fine print.",
    avoid: "Making the primary point smaller; keep the headline at normal size.",
    recommendedMaxWords: 40,
    example: "::small\n| A | B |\n|---|---|\n| 1 | 2 |\n::",
  },
  callout: {
    mustClose: true,
    internalSlideSeparator: false,
    minimumInternalSections: 0,
    maximumInternalSections: 0,
    purpose: "Highlight one short conclusion, question, or takeaway.",
    use: "One sentence the audience should remember; supports `on-click` reveal.",
    avoid: "A paragraph or list of several ideas; split into separate slides.",
    recommendedMaxWords: 12,
    example: "::callout\nAccessibility is a quality issue.\n::",
  },
  quote: {
    mustClose: true,
    internalSlideSeparator: false,
    minimumInternalSections: 0,
    maximumInternalSections: 0,
    purpose: "Render an attributed quotation as a styled pull quote.",
    use: "One memorable quotation with an attribution line.",
    avoid: "Two or more quotes; long block quotations beyond a sentence or two.",
    recommendedMaxWords: 30,
    example: "::quote\n\"The web is for everyone.\"\n— Tim Berners-Lee\n::",
  },
  "big-stat": {
    mustClose: true,
    internalSlideSeparator: true,
    minimumInternalSections: 0,
    maximumInternalSections: 2,
    purpose: "Make one number the entire argument of the slide.",
    use: "A single statistic that proves the point, with a short framing line.",
    avoid: "Comparing several statistics; keep one number per big-stat slide.",
    recommendedMaxWords: 12,
    example: "::big-stat\n**73%**\n---\nremember one strong visual.\n::",
  },
  "media-left": {
    mustClose: true,
    internalSlideSeparator: true,
    minimumInternalSections: 1,
    maximumInternalSections: 1,
    purpose: "Place a visual on the left beside text on the right.",
    use: "An image or screenshot that materially explains the point.",
    avoid: "Decorative images; the companion text must stand alone.",
    recommendedMaxWords: 30,
    example: "::media-left\n![Alt text](image.jpg)\n---\nShort supporting text.\n::",
  },
  "media-right": {
    mustClose: true,
    internalSlideSeparator: true,
    minimumInternalSections: 1,
    maximumInternalSections: 1,
    purpose: "Place a visual on the right beside text on the left.",
    use: "An image or screenshot that materially explains the point.",
    avoid: "Decorative images; the companion text must stand alone.",
    recommendedMaxWords: 30,
    example: "::media-right\n![Alt text](image.jpg)\n---\nShort supporting text.\n::",
  },
  "split-left": {
    mustClose: true,
    internalSlideSeparator: true,
    minimumInternalSections: 1,
    maximumInternalSections: 1,
    purpose: "Full-height 50/50 layout with an edge-to-edge image on the left.",
    use: "One strong visual and a vertical line of text; magazine style.",
    avoid: "Dense text columns; the image half should carry the emotional weight.",
    recommendedMaxWords: 25,
    example: "::split-left\n![Alt text](photo.jpg)\n---\n### Heading\nText.\n::",
  },
  "split-right": {
    mustClose: true,
    internalSlideSeparator: true,
    minimumInternalSections: 1,
    maximumInternalSections: 1,
    purpose: "Full-height 50/50 layout with an edge-to-edge image on the right.",
    use: "One strong visual and a vertical line of text; magazine style.",
    avoid: "Dense text columns; the image half should carry the emotional weight.",
    recommendedMaxWords: 25,
    example: "::split-right\n![Alt text](photo.jpg)\n---\n### Heading\nText.\n::",
  },
  figure: {
    mustClose: true,
    internalSlideSeparator: true,
    minimumInternalSections: 0,
    maximumInternalSections: 1,
    purpose: "Wrap an image in a figure with an optional caption.",
    use: "A data visual or diagram the audience should interpret with its caption.",
    avoid: "A caption that merely repeats the image; add interpretation.",
    recommendedMaxWords: 20,
    example: "::figure\n![A chart](chart.png)\n---\nCaption text.\n::",
  },
  table: {
    mustClose: true,
    internalSlideSeparator: false,
    minimumInternalSections: 0,
    maximumInternalSections: 0,
    purpose: "Render a pipe-delimited Markdown table.",
    use: "Wide-but-short comparisons; keep the table small on screen.",
    avoid: "Long tables; split rows across slides or move data to resources.",
    recommendedMaxWords: 30,
    example: "::table\n| Option | Cost |\n| --- | --- |\n| A | 10 |\n::",
  },
  step: {
    mustClose: true,
    internalSlideSeparator: false,
    minimumInternalSections: 0,
    maximumInternalSections: 0,
    purpose: "Group a few lines into one progressive reveal block (`on-click`).",
    use: "Keep a heading and its supporting line advancing together.",
    avoid: "Using on-click for everything; reduce steps, not hide them.",
    recommendedMaxWords: 20,
    example: "::step on-click\nRevealed together.\n::",
  },
  code: {
    mustClose: true,
    internalSlideSeparator: false,
    minimumInternalSections: 0,
    maximumInternalSections: 0,
    purpose: "Render a code block with an optional language class.",
    use: "A short snippet the audience should read; supports `on-click`.",
    avoid: "Long listings; paste the full source into resources.",
    recommendedMaxWords: 25,
    example: "::code javascript\nconst x = 1;\n::",
  },
  "slide-bg": {
    mustClose: true,
    internalSlideSeparator: false,
    minimumInternalSections: 0,
    maximumInternalSections: 0,
    purpose: "Place an aria-hidden inline SVG behind all slide content.",
    use: "A subtle branded background; keep brightness below 0.20 opacity.",
    avoid: "Meaningful content in the background; it is hidden from screen readers.",
    recommendedMaxWords: 0,
    example: "::slide-bg opacity-0.12\n<svg ...>\n::",
  },
  "image-hero": {
    mustClose: true,
    internalSlideSeparator: true,
    minimumInternalSections: 0,
    maximumInternalSections: 2,
    purpose: "Full-bleed background image with a short overlay and optional logo.",
    use: "One strong photograph driving the slide; overlay text under 25 characters.",
    avoid: "Evidence-heavy slides; keep the argument in notes and resources.",
    recommendedMaxWords: 8,
    example: "::image-hero text-bottom-left\n![Alt](photo.jpg)\n---\nShort overlay\n::",
  },
  iframe: {
    mustClose: true,
    internalSlideSeparator: false,
    minimumInternalSections: 0,
    maximumInternalSections: 0,
    purpose: "Embed a single HTTP(S) page inside the slide.",
    use: "A live demo or tool the audience should see in context.",
    avoid: "Pages that block embedding; always keep the fallback open link.",
    recommendedMaxWords: 10,
    example: "::iframe title:Demo\nhttps://example.com\n::",
  },
  "column-left": {
    mustClose: true,
    internalSlideSeparator: false,
    minimumInternalSections: 0,
    maximumInternalSections: 0,
    purpose: "Left half of a side-by-side comparison.",
    use: "Genuine contrast — before/after, option A/B, two narratives.",
    avoid: "Sequential ideas that belong on separate slides.",
    recommendedMaxWords: 25,
    example: "::column-left\n### Before\n- point\n::\n\n::column-right\n### After\n- point\n::",
  },
  "column-right": {
    mustClose: true,
    internalSlideSeparator: false,
    minimumInternalSections: 0,
    maximumInternalSections: 0,
    purpose: "Right half of a side-by-side comparison.",
    use: "Genuine contrast — before/after, option A/B, two narratives.",
    avoid: "Sequential ideas that belong on separate slides.",
    recommendedMaxWords: 25,
    example: "::column-right\n### After\n- point\n::\n\n::column-left\n### Before\n- point\n::",
  },
};

/**
 * Compact, prompt-safe authoring rules embedded in generated AI prompts so an
 * external model can author valid decks without reading the repository.
 * Builds directly from the registry to avoid drift.
 */
export function buildAuthoringRules() {
  const directiveNames = Object.keys(LAYOUT_DIRECTIVES).sort();
  const internalSeparatorNames = directiveNames.filter(
    (name) => LAYOUT_DIRECTIVES[name].internalSlideSeparator,
  );
  const mustCloseNames = directiveNames.filter((name) => LAYOUT_DIRECTIVES[name].mustClose);

  return [
    "Critical syntax rules:",
    "- `---` separates slides ONLY at directive depth 0.",
    "- Every layout directive opened with `::name` MUST be closed with its own `::` line.",
    `- Opened-then-closed directives: ${mustCloseNames.join(", ")}.`,
    "- Never leave a directive open across a `---` boundary; an unclosed directive swallows following slides.",
    "- `---` is NOT a generic horizontal rule; a bare `---` is only a slide separator.",
    `- Directives that use internal \`---\` sections (keep the documented count): ${internalSeparatorNames.join(", ")}.`,
    "- `::notes` / `::resources` / `::script` are speaker-only sections; their closing `::` is optional and the section ends at the next slide.",
    "- Title and closing slides come from front matter (`titleSlide: true`, `closingSlide: true`); do not write extra Markdown slides for them.",
    "- Common `on-click`/`off-click` modifier reveals content one advance at a time.",
    "",
    "Supported layout directives:",
    ...directiveNames.map((name) => `- ::${name} — ${LAYOUT_DIRECTIVES[name].purpose}`),
    "",
    "Design guidance:",
    "- Keep visible copy sparse: aim for well under 65 words and at most 4 bullets per slide.",
    "- One H1 per slide; do not skip heading levels.",
    "- Give every image meaningful alt text.",
    "- Put the full argument, references, and spoken lines in `Note:` / `Resources:` / `Script:`.",
    "- Do not invent syntax the format does not define; unknown `::name` lines break slide splitting.",
  ].join("\n");
}