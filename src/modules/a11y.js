const GENERIC_LINK_PATTERNS = [/^click here$/i, /^read more$/i, /^more$/i, /^link$/i];

// Returns false when a front-matter key is explicitly set to false, otherwise true.
function isHintEnabled(metadata, specificKey) {
  if (metadata.editorialHints === false) return false;
  if (metadata[specificKey] === false) return false;
  return true;
}

// Extract bullet item text from a slide's visible body.
function getBulletItems(body) {
  const items = [];
  for (const line of String(body || "").split("\n")) {
    const match = /^\s*(?:[-*]|\d+\.)\s+(.+)/.exec(line);
    if (match) items.push(match[1].trim());
  }
  return items;
}

/**
 * Returns editorial hint issues for the deck. These are opt-in/opt-out via
 * front-matter keys and have `category: "editorial"`.
 *
 * Controlled by front matter:
 * - `editorialHints: false`   — disables all editorial hints.
 * - `warnSpelledOutAnd: true` — (opt-in, default off) warns when "and" is used
 *   in visible body copy instead of "&".
 * - `warnLongHeadings: false` — (opt-out, default on) warns when an H1 or H2
 *   heading is long enough to likely wrap to a second line.
 * - `warnBulletPunctuation: false` — (opt-out, default on) warns when bullet
 *   punctuation is inconsistent within a slide.
 */
export function lintEditorialHints(deck, renderedSlides) {
  const issues = [];
  const metadata = deck.metadata || {};

  // warnSpelledOutAnd — opt-in (disabled by default)
  if (metadata.warnSpelledOutAnd === true && isHintEnabled(metadata, "warnSpelledOutAnd")) {
    deck.slides.forEach((slide, index) => {
      const body = slide.body || "";
      if (/\band\b/i.test(body)) {
        issues.push({
          level: "info",
          category: "editorial",
          slide: index + 1,
          message: `Slide ${index + 1} uses "and" — consider using "&" for brevity in presentation copy.`,
        });
      }
    });
  }

  // warnLongHeadings — opt-out (enabled by default)
  if (isHintEnabled(metadata, "warnLongHeadings")) {
    renderedSlides.forEach((slide, index) => {
      for (const heading of slide.headings || []) {
        if (heading.level !== 1 && heading.level !== 2) continue;
        const threshold = heading.level === 1 ? 45 : 60;
        if (heading.text.length > threshold) {
          issues.push({
            level: "info",
            category: "editorial",
            slide: index + 1,
            message: `Slide ${index + 1} H${heading.level} heading is ${heading.text.length} characters — long headings may wrap to a second line.`,
          });
        }
      }
    });
  }

  // warnBulletPunctuation — opt-out (enabled by default)
  if (isHintEnabled(metadata, "warnBulletPunctuation")) {
    deck.slides.forEach((slide, index) => {
      const bullets = getBulletItems(slide.body || "");
      if (bullets.length < 2) return;
      const withPeriod = bullets.filter((b) => b.endsWith(".")).length;
      const withoutPeriod = bullets.length - withPeriod;
      if (withPeriod > 0 && withoutPeriod > 0) {
        issues.push({
          level: "info",
          category: "editorial",
          slide: index + 1,
          message: `Slide ${index + 1} has inconsistent bullet punctuation — some items end with a period and some don't.`,
        });
      }
    });
  }

  return issues;
}

function countWords(value) {
  return String(value)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, " ")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/[`*_>#]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function countMatches(value, pattern) {
  return (String(value).match(pattern) || []).length;
}

export function assessSlideDensity(sourceSlide = {}) {
  const body = sourceSlide.body || "";
  const wordCount = countWords(body);
  const bulletCount = countMatches(body, /^\s*(?:-|\d+\.)\s+/gm);
  const paragraphCount = countMatches(body, /^(?!#|\s*(?:-|\d+\.)\s+|Note:|Resources:|Script:).+\S.*$/gm);

  if (wordCount > 90 || bulletCount > 6 || paragraphCount > 4) {
    return {
      level: "dense",
      label: "Dense",
      wordCount,
      bulletCount,
      paragraphCount,
    };
  }

  if (wordCount > 65 || bulletCount > 4 || paragraphCount > 3) {
    return {
      level: "full",
      label: "Full",
      wordCount,
      bulletCount,
      paragraphCount,
    };
  }

  return {
    level: "comfortable",
    label: "",
    wordCount,
    bulletCount,
    paragraphCount,
  };
}

export function lintDeck(deck, renderedSlides) {
  const issues = [];
  issues.push(...lintEditorialHints(deck, renderedSlides));

  renderedSlides.forEach((slide, index) => {
    const slideNumber = index + 1;
    const h1Count = slide.headings.filter((heading) => heading.level === 1).length;

    if (h1Count !== 1) {
      issues.push({
        level: "error",
        slide: slideNumber,
        message: `Slide ${slideNumber} must contain exactly one H1 heading.`,
      });
    }

    for (let i = 1; i < slide.headings.length; i += 1) {
      const previous = slide.headings[i - 1].level;
      const current = slide.headings[i].level;
      if (current > previous + 1) {
        issues.push({
          level: "error",
          slide: slideNumber,
          message: `Slide ${slideNumber} skips heading levels from H${previous} to H${current}.`,
        });
      }
    }

    const linkMatches = [...slide.html.matchAll(/<a [^>]*>(.*?)<\/a>/g)];
    for (const match of linkMatches) {
      const text = match[1].replace(/<[^>]+>/g, "").trim();
      if (GENERIC_LINK_PATTERNS.some((pattern) => pattern.test(text))) {
        issues.push({
          level: "warning",
          slide: slideNumber,
          message: `Slide ${slideNumber} has a non-descriptive link: "${text}".`,
        });
      }
    }

    const imageMatches = [...slide.html.matchAll(/<img [^>]*alt="([^"]*)"[^>]*>/g)];
    for (const match of imageMatches) {
      const alt = match[1].trim();
      if (!alt) {
        issues.push({
          level: "error",
          slide: slideNumber,
          message: `Slide ${slideNumber} includes an image without alt text.`,
        });
      }
    }

    const heroOverlayMatches = [
      ...slide.html.matchAll(/<div class="layout-image-hero__overlay"[^>]*data-overlay-text-length="(\d+)"[^>]*>/g),
    ];
    for (const match of heroOverlayMatches) {
      const textLength = Number(match[1]);
      if (textLength > 25) {
        issues.push({
          level: "warning",
          slide: slideNumber,
          message: `Slide ${slideNumber} image-hero overlay text is ${textLength} characters (recommended maximum is 25).`,
        });
      }
    }

    if (!deck.slides[index].notes) {
      issues.push({
        level: "info",
        slide: slideNumber,
        message: `Slide ${slideNumber} has no speaker notes.`,
      });
    }

    const sourceSlide = deck.slides[index];
    const density = assessSlideDensity(sourceSlide);

    if (density.level === "dense") {
      issues.push({
        level: "warning",
        slide: slideNumber,
        category: "layout",
        message: `Slide ${slideNumber} may contain too much text for a presentation slide. Aim for fewer bullets and shorter visible copy.`,
      });
    }
  });

  return issues;
}
