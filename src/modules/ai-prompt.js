function normalizeLines(value) {
  return String(value || "")
    .replaceAll("\r\n", "\n")
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function toBulletList(entries, fallback = "[add item]") {
  if (!entries.length) {
    return `- ${fallback}`;
  }

  return entries.map((entry) => `- ${entry}`).join("\n");
}

function extractResourceEntries(renderedSlides) {
  return renderedSlides
    .flatMap((slide) => normalizeLines(slide.resources || ""))
    .map((line) => line.replace(/^-\s+/, "").trim())
    .filter(Boolean);
}

export function createAiPromptDefaults(compiled) {
  const metadata = compiled?.metadata || {};
  const renderedSlides = compiled?.renderedSlides || [];
  const contentSlides = renderedSlides.filter(
    (slide) => slide.kind !== "title" && slide.kind !== "closing",
  );

  return {
    title: metadata.title || "",
    presenters: metadata.speakers || "",
    durationMinutes: metadata.durationMinutes || "20",
    audience: "",
    purpose: "",
    topics: contentSlides
      .map((slide, index) => {
        const heading = slide.headings?.find((entry) => entry.level === 1)?.text?.trim();
        return heading || `Topic ${index + 1}`;
      })
      .filter(Boolean),
    references: extractResourceEntries(compiled?.slides || []),
    tone: "",
    callToAction: "",
    includeTitleSlide: metadata.titleSlide !== false,
    includeClosingSlide: metadata.closingSlide !== false,
    includeNotes: true,
    includeResources: true,
    includeScript: true,
  };
}

function buildSchemaExample(options) {
  const lines = [
    "---",
    `title: ${options.title || "[presentation title]"}`,
    `durationMinutes: ${options.durationMinutes || "[minutes]"}`,
  ];

  if (options.includeTitleSlide) {
    lines.push("titleSlide: true");
    lines.push(`speakers: ${options.presenters || "[speaker names]"}`);
  }

  if (options.includeClosingSlide) {
    lines.push("closingSlide: true");
    lines.push("closingTitle: Questions?");
  }

  lines.push("---", "", "# Slide title", "", "Visible audience-facing content.");

  if (options.includeNotes) {
    lines.push("", "Note:", "Presenter notes.");
  }

  if (options.includeResources) {
    lines.push("", "Resources:", "- [Reference link](https://example.com)");
  }

  if (options.includeScript) {
    lines.push("", "Script:", "Optional fuller spoken script.");
  }

  lines.push("", "---", "", "# Next slide");
  return lines.join("\n");
}

export function buildAiAuthoringPrompt(options) {
  const topics = normalizeLines(options.topics);
  const references = normalizeLines(options.references);
  const requirementLines = [
    "- Return valid Markdown for this slide editor.",
    "- Include front matter.",
    `- Set \`durationMinutes: ${options.durationMinutes || "[minutes]"}\`.`,
    options.includeTitleSlide ? "- Include `titleSlide: true` and `speakers`." : "- Do not include a generated title slide unless clearly needed.",
    options.includeClosingSlide ? "- Include `closingSlide: true` for questions and follow-up." : "- Do not include a generated closing slide unless clearly needed.",
    "- Keep visible slides concise and scannable.",
    options.includeNotes ? "- Put delivery detail in `Note:`." : "- Do not add `Note:` sections unless necessary.",
    options.includeResources ? "- Include `Resources:` where references or follow-up links are helpful." : "- Do not add `Resources:` sections unless necessary.",
    options.includeScript ? "- Include `Script:` when a fuller spoken version is useful." : "- Do not add `Script:` sections unless necessary.",
    "- Use one H1 per slide.",
    "- Do not skip heading levels.",
    "- Use real Markdown lists.",
    "- Do not use layout tables.",
    "- Do not put essential meaning only in speaker notes.",
  ];

  return `# Presentation drafting request

Create a presentation in the Markdown slide format described below.

## Presentation brief

- Title: ${options.title || "[presentation title]"}
- Presenters: ${options.presenters || "[speaker names]"}
- Duration: ${options.durationMinutes || "[minutes]"} minutes
- Audience: ${options.audience || "[intended audience]"}
- Purpose: ${options.purpose || "[what the talk should achieve]"}
- Topics to cover:
${toBulletList(topics)}
- Desired tone: ${options.tone || "[tone]"}
- Call to action: ${options.callToAction || "[optional call to action]"}

## References

${toBulletList(references, "[reference]")}

## Output requirements

${requirementLines.join("\n")}

## Markdown slide format

\`\`\`md
${buildSchemaExample(options)}
\`\`\`

## Response expectations

- Return only the deck Markdown unless I ask for commentary.
- Make the deck suitable for review and revision in the editor.
- If information is missing, make reasonable assumptions and label them in notes or resources.
`;
}
