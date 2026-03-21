const GENERIC_LINK_PATTERNS = [/^click here$/i, /^read more$/i, /^more$/i, /^link$/i];

export function lintDeck(deck, renderedSlides) {
  const issues = [];

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

    if (!deck.slides[index].notes) {
      issues.push({
        level: "info",
        slide: slideNumber,
        message: `Slide ${slideNumber} has no speaker notes.`,
      });
    }
  });

  return issues;
}
