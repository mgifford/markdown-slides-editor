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

  const rawSlides = content
    .split(/\n---\n/g)
    .map((entry) => entry.trim())
    .filter(Boolean);

  const contentSlides = rawSlides.map((raw, index) => {
    const sections = {
      body: [],
      notes: [],
      resources: [],
      script: [],
    };
    let activeSection = "body";

    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (/^Note:\s*$/i.test(trimmed)) {
        activeSection = "notes";
        continue;
      }
      if (/^Resources:\s*$/i.test(trimmed)) {
        activeSection = "resources";
        continue;
      }
      if (/^Script:\s*$/i.test(trimmed)) {
        activeSection = "script";
        continue;
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

  const slides = [];
  const titleSlide = createTitleSlide(metadata);
  if (titleSlide) slides.push(titleSlide);
  slides.push(...contentSlides.map((slide, index) => ({
    ...slide,
    index: slides.length + index,
  })));
  const closingSlide = createClosingSlide(metadata);
  if (closingSlide) {
    closingSlide.index = slides.length;
    slides.push(closingSlide);
  }

  return {
    metadata,
    slides,
  };
}

export function getSlideIndexForSourceOffset(source, offset = 0) {
  const normalized = normalizeSource(source);
  const safeOffset = Math.max(0, Math.min(offset, normalized.length));
  const titleSlideOffset = /^\s*---\n[\s\S]*?\n---\n?/m.test(normalized) && /\btitleSlide:\s*true\b/i.test(normalized) ? 1 : 0;

  const contentStart = getFrontMatterContentStart(normalized);
  const content = normalized.slice(contentStart);
  const relativeOffset = Math.max(0, safeOffset - contentStart);

  if (!content.trim()) {
    return titleSlideOffset;
  }

  const separatorPattern = /\n---\n/g;
  let slideIndex = 0;
  let match;
  while ((match = separatorPattern.exec(content)) && match.index < relativeOffset) {
    slideIndex += 1;
  }

  return titleSlideOffset + slideIndex;
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

  const hasTitleSlide = compiledDeck.slides[0]?.kind === "title";
  const contentSlideIndex = Math.max(0, safeSlideIndex - (hasTitleSlide ? 1 : 0));
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
