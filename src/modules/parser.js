function parseYamlValue(value) {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  return trimmed;
}

const LANGUAGE_NAME_TO_CODE = {
  afrikaans: "af",
  albanian: "sq",
  arabic: "ar",
  armenian: "hy",
  basque: "eu",
  belarusian: "be",
  bengali: "bn",
  bosnian: "bs",
  bulgarian: "bg",
  catalan: "ca",
  chinese: "zh",
  croatian: "hr",
  czech: "cs",
  danish: "da",
  dutch: "nl",
  english: "en",
  estonian: "et",
  finnish: "fi",
  french: "fr",
  galician: "gl",
  georgian: "ka",
  german: "de",
  greek: "el",
  gujarati: "gu",
  haitian: "ht",
  hebrew: "he",
  hindi: "hi",
  hungarian: "hu",
  icelandic: "is",
  indonesian: "id",
  irish: "ga",
  italian: "it",
  japanese: "ja",
  kannada: "kn",
  kazakh: "kk",
  korean: "ko",
  latvian: "lv",
  lithuanian: "lt",
  macedonian: "mk",
  malay: "ms",
  maltese: "mt",
  marathi: "mr",
  mongolian: "mn",
  nepali: "ne",
  norwegian: "no",
  persian: "fa",
  polish: "pl",
  portuguese: "pt",
  punjabi: "pa",
  romanian: "ro",
  russian: "ru",
  serbian: "sr",
  sinhala: "si",
  slovak: "sk",
  slovenian: "sl",
  somali: "so",
  spanish: "es",
  swahili: "sw",
  swedish: "sv",
  tagalog: "tl",
  tamil: "ta",
  telugu: "te",
  thai: "th",
  turkish: "tr",
  ukrainian: "uk",
  urdu: "ur",
  uzbek: "uz",
  vietnamese: "vi",
  welsh: "cy",
  zulu: "zu",
};

export function resolveLanguage(value) {
  if (!value || typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const lower = trimmed.toLowerCase();
  if (LANGUAGE_NAME_TO_CODE[lower]) {
    return LANGUAGE_NAME_TO_CODE[lower];
  }
  return trimmed;
}

function normalizeSource(source) {
  return String(source || "").replaceAll("\r\n", "\n");
}

function getFrontMatterContentStart(normalizedSource) {
  const frontMatterMatch = normalizedSource.match(/^---\n[\s\S]*?\n---\n?/);
  return frontMatterMatch ? frontMatterMatch[0].length : 0;
}

function toOriginalOffset(source, normalizedOffset) {
  const original = String(source || "");
  const clampedNormalizedOffset = Math.max(0, normalizedOffset);
  let normalizedIndex = 0;

  for (let originalIndex = 0; originalIndex < original.length; originalIndex += 1) {
    if (normalizedIndex >= clampedNormalizedOffset) {
      return originalIndex;
    }

    if (original[originalIndex] === "\r" && original[originalIndex + 1] === "\n") {
      normalizedIndex += 1;
      originalIndex += 1;
      continue;
    }

    normalizedIndex += 1;
  }

  return original.length;
}

function extractMetadataAndContent(source) {
  let content = normalizeSource(source).trim();
  const metadata = {};

  if (content.startsWith("---\n")) {
    const end = content.indexOf("\n---\n", 4);
    if (end !== -1) {
      const frontMatter = content.slice(4, end);
      for (const line of frontMatter.split("\n")) {
        const separator = line.indexOf(":");
        if (separator === -1) continue;
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1);
        metadata[key] = parseYamlValue(value);
      }
      content = content.slice(end + 5);
    }
  }

  if (metadata.Language !== undefined && metadata.lang === undefined) {
    const resolved = resolveLanguage(metadata.Language);
    if (resolved !== undefined) {
      metadata.lang = resolved;
    }
  }
  delete metadata.Language;

  return { metadata, content };
}

function createTitleSlide(metadata) {
  if (!metadata.titleSlide) return null;

  return {
    id: "slide-title",
    index: 0,
    raw: "",
    body: "",
    notes: "",
    kind: "title",
    title: metadata.title?.trim() || "Untitled presentation",
    subtitle: metadata.subtitle?.trim() || "",
    date: metadata.date?.trim() || "",
    location: metadata.location?.trim() || "",
    speakers: metadata.speakers?.trim() || "",
    qrUrl:
      (metadata.titleSlideQr || metadata.titleSlideQrUrl)
        ? metadata.titleSlideQrUrl?.trim() ||
          metadata.presentationUrl?.trim() ||
          metadata.publishedUrl?.trim() ||
          ""
        : "",
  };
}

function createClosingSlide(metadata) {
  if (!metadata.closingSlide) return null;

  return {
    id: "slide-closing",
    index: 0,
    raw: "",
    body: "",
    notes: "",
    kind: "closing",
    title: metadata.closingTitle?.trim() || "Questions?",
    prompt: metadata.closingPrompt?.trim() || "",
    contactEmail: metadata.contactEmail?.trim() || "",
    contactUrl: metadata.contactUrl?.trim() || "",
    socialLinks: metadata.socialLinks?.trim() || "",
    presentationUrl:
      metadata.presentationUrl?.trim() || metadata.publishedUrl?.trim() || "",
  };
}

export function parseSource(source) {
  const { metadata, content } = extractMetadataAndContent(source);

  const allParts = content.split(/\n---\n/g).map((entry) => entry.trim());
  const firstNonEmpty = allParts.findIndex(Boolean);
  const rawSlides = firstNonEmpty === -1
    ? []
    : allParts.slice(firstNonEmpty, allParts.findLastIndex(Boolean) + 1);

  const contentSlides = rawSlides.map((raw, index) => {
    const sections = {
      body: [],
      notes: [],
      resources: [],
      script: [],
    };
    let activeSection = "body";
    // Tracks nesting depth when a section was opened with a :: directive.
    // A depth > 0 means the current section was opened via ::notes/::resources/::script.
    // Inner :: directives (e.g. ::callout inside ::notes) increment the depth so that
    // their closing :: does not accidentally end the outer section.
    let sectionDirectiveDepth = 0;

    for (const line of raw.split("\n")) {
      const trimmed = line.trim();

      // Legacy colon-style section markers (backward-compatible).
      if (/^Note:\s*$/i.test(trimmed)) {
        activeSection = "notes";
        sectionDirectiveDepth = 0;
        continue;
      }
      if (/^Resources:\s*$/i.test(trimmed)) {
        activeSection = "resources";
        sectionDirectiveDepth = 0;
        continue;
      }
      if (/^Script:\s*$/i.test(trimmed)) {
        activeSection = "script";
        sectionDirectiveDepth = 0;
        continue;
      }

      // Double-colon section directives (new syntax).
      if (/^::notes?\s*$/i.test(trimmed)) {
        activeSection = "notes";
        sectionDirectiveDepth = 1;
        continue;
      }
      if (/^::(resources?|references?)\s*$/i.test(trimmed)) {
        activeSection = "resources";
        sectionDirectiveDepth = 1;
        continue;
      }
      if (/^::scripts?\s*$/i.test(trimmed)) {
        activeSection = "script";
        sectionDirectiveDepth = 1;
        continue;
      }

      // When inside a :: section directive, track nested directives so that a
      // closing :: on an inner block does not prematurely exit the section.
      if (sectionDirectiveDepth > 0) {
        if (/^::[a-z0-9%-]+(?:\s+[\w-]+)*\s*$/i.test(trimmed)) {
          sectionDirectiveDepth += 1;
        } else if (trimmed === "::") {
          sectionDirectiveDepth -= 1;
          if (sectionDirectiveDepth === 0) {
            activeSection = "body";
            continue;
          }
        }
      }

      sections[activeSection].push(line);
    }

    return {
      id: `slide-${index + 1}`,
      index,
      raw,
      body: sections.body.join("\n").trim(),
      notes: sections.notes.join("\n").trim(),
      resources: sections.resources.join("\n").trim(),
      script: sections.script.join("\n").trim(),
    };
  });

  const titleSlide = createTitleSlide(metadata);
  const closingSlide = createClosingSlide(metadata);

  const result = contentSlides.slice();

  if (titleSlide) {
    const rawNum = parseInt(metadata.titleSlideNumber);
    const titlePos = (!isNaN(rawNum) && rawNum >= 1) ? rawNum - 1 : 0;
    result.splice(Math.min(titlePos, result.length), 0, titleSlide);
  }

  if (closingSlide) {
    const rawNum = parseInt(metadata.closingSlideNumber);
    let closingPos;
    if (!isNaN(rawNum) && rawNum > 0) {
      closingPos = Math.min(rawNum - 1, result.length);
    } else if (!isNaN(rawNum) && rawNum < 0) {
      closingPos = Math.max(0, result.length + rawNum);
    } else {
      closingPos = result.length;
    }
    result.splice(closingPos, 0, closingSlide);
  }

  result.forEach((slide, i) => { slide.index = i; });

  return {
    metadata,
    slides: result,
  };
}

export function getSlideIndexForSourceOffset(source, offset = 0) {
  const normalized = normalizeSource(source);
  const safeOffset = Math.max(0, Math.min(offset, normalized.length));

  const contentStart = getFrontMatterContentStart(normalized);
  const frontMatter = normalized.slice(0, contentStart);
  const content = normalized.slice(contentStart);
  const relativeOffset = Math.max(0, safeOffset - contentStart);

  const hasTitleSlide = contentStart > 0 && /\btitleSlide:\s*true\b/i.test(frontMatter);
  const hasClosingSlide = contentStart > 0 && /\bclosingSlide:\s*true\b/i.test(frontMatter);

  if (!content.trim()) {
    return hasTitleSlide ? 1 : 0;
  }

  const separatorPattern = /\n---\n/g;
  let contentSlideIndex = 0;
  let match;
  while ((match = separatorPattern.exec(content)) && match.index < relativeOffset) {
    contentSlideIndex += 1;
  }

  if (!hasTitleSlide && !hasClosingSlide) {
    return contentSlideIndex;
  }

  // Count total separators by continuing the scan from where the loop stopped.
  // If match is non-null, it is the first separator after the cursor (found but not counted).
  let totalSeparators = contentSlideIndex;
  if (match !== null) {
    totalSeparators += 1;
    while (separatorPattern.exec(content) !== null) {
      totalSeparators += 1;
    }
  }
  const totalContentSlides = totalSeparators + 1;

  // Determine where the title slide is inserted (0-indexed position in content array).
  let titlePos = -1;
  if (hasTitleSlide) {
    const m = frontMatter.match(/\btitleSlideNumber:\s*(\d+)/i);
    const titleNum = m ? (parseInt(m[1]) || 1) : 1;
    titlePos = Math.min(titleNum - 1, totalContentSlides);
  }

  // Title is before content slide contentSlideIndex when its insertion point <= contentSlideIndex.
  const titleBefore = titlePos >= 0 && titlePos <= contentSlideIndex;
  const posAfterTitle = contentSlideIndex + (titleBefore ? 1 : 0);

  // Determine where the closing slide is inserted in the intermediate array (after title).
  let closingBefore = false;
  if (hasClosingSlide) {
    const totalAfterTitle = totalContentSlides + (hasTitleSlide ? 1 : 0);
    const m = frontMatter.match(/\bclosingSlideNumber:\s*(-?\d+)/i);
    const closingNum = m ? (parseInt(m[1]) || 0) : 0;
    let closingInsertPos;
    if (closingNum > 0) {
      closingInsertPos = Math.min(closingNum - 1, totalAfterTitle);
    } else if (closingNum < 0) {
      closingInsertPos = Math.max(0, totalAfterTitle + closingNum);
    } else {
      closingInsertPos = totalAfterTitle;
    }
    closingBefore = closingInsertPos <= posAfterTitle;
  }

  return posAfterTitle + (closingBefore ? 1 : 0);
}

export function getSourceOffsetForSlideIndex(source, slideIndex, deck = null) {
  const normalizedSource = normalizeSource(source);
  const compiledDeck = deck || parseSource(normalizedSource);
  const totalSlides = compiledDeck?.slides?.length || 0;

  if (!totalSlides) {
    const normalizedOffset = Math.min(normalizedSource.length, getFrontMatterContentStart(normalizedSource));
    return toOriginalOffset(source, normalizedOffset);
  }

  const safeSlideIndex = Math.max(0, Math.min(slideIndex, totalSlides - 1));
  const currentSlide = compiledDeck.slides[safeSlideIndex];

  if (!currentSlide) {
    return 0;
  }

  // Generated title/closing slides are configured in front matter.
  if (currentSlide.kind === "title" || currentSlide.kind === "closing") {
    return 0;
  }

  const contentStart = getFrontMatterContentStart(normalizedSource);
  const content = normalizedSource.slice(contentStart);

  if (!content.trim()) {
    return toOriginalOffset(source, contentStart);
  }

  const contentSlideStarts = [0];
  const separatorPattern = /\n---\n/g;
  let match;
  while ((match = separatorPattern.exec(content))) {
    contentSlideStarts.push(match.index + 5);
  }

  const generatedSlidesBefore = compiledDeck.slides
    .slice(0, safeSlideIndex)
    .filter(s => s.kind === "title" || s.kind === "closing")
    .length;
  const contentSlideIndex = Math.max(0, safeSlideIndex - generatedSlidesBefore);
  const rawStart = contentSlideStarts[Math.min(contentSlideIndex, contentSlideStarts.length - 1)] || 0;
  const nextRawStart = contentSlideStarts[contentSlideIndex + 1] ?? content.length;
  const segment = content.slice(rawStart, nextRawStart);

  const headingMatch = segment.match(/(?:^|\n)[ \t]{0,3}#{1,6}\s+\S/);
  if (headingMatch) {
    const headingOffset = rawStart + headingMatch.index + (headingMatch[0].startsWith("\n") ? 1 : 0);
    const normalizedOffset = Math.min(normalizedSource.length, contentStart + headingOffset);
    return toOriginalOffset(source, normalizedOffset);
  }

  const firstVisibleCharacter = segment.search(/\S/);
  const startWithinSlide = firstVisibleCharacter === -1 ? 0 : firstVisibleCharacter;
  const normalizedOffset = Math.min(normalizedSource.length, contentStart + rawStart + startWithinSlide);
  return toOriginalOffset(source, normalizedOffset);
}
