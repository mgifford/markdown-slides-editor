function parseYamlValue(value) {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  return trimmed;
}

export function parseSource(source) {
  let content = source.trim();
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

  const rawSlides = content
    .split(/\n---\n/g)
    .map((entry) => entry.trim())
    .filter(Boolean);

  const slides = rawSlides.map((raw, index) => {
    const noteSplit = raw.split(/\nNote:\s*\n/i);
    const body = noteSplit[0].trim();
    const notes = noteSplit.slice(1).join("\nNote:\n").trim();
    return {
      id: `slide-${index + 1}`,
      index,
      raw,
      body,
      notes,
    };
  });

  return {
    metadata,
    slides,
  };
}
