function normalizeSource(source) {
  return source.replaceAll("\r\n", "\n");
}

export function updateFrontMatterValue(source, key, value) {
  const normalized = normalizeSource(source);
  const stringValue = String(value ?? "").trim();
  const hasFrontMatter = normalized.startsWith("---\n");

  if (!hasFrontMatter) {
    return `---\n${key}: ${stringValue}\n---\n\n${normalized}`;
  }

  const end = normalized.indexOf("\n---\n", 4);
  if (end === -1) {
    return normalized;
  }

  const frontMatter = normalized.slice(4, end);
  const body = normalized.slice(end + 5);
  const lines = frontMatter.split("\n");
  let updated = false;

  const nextLines = lines
    .map((line) => {
      const separator = line.indexOf(":");
      if (separator === -1) return line;
      const existingKey = line.slice(0, separator).trim();
      if (existingKey !== key) return line;
      updated = true;
      return `${key}: ${stringValue}`;
    })
    .filter((line) => line.trim() !== "");

  if (!updated) {
    nextLines.push(`${key}: ${stringValue}`);
  }

  return `---\n${nextLines.join("\n")}\n---\n${body.startsWith("\n") ? body : `\n${body}`}`;
}

export function removeFrontMatterValue(source, key) {
  const normalized = normalizeSource(source);
  if (!normalized.startsWith("---\n")) {
    return normalized;
  }

  const end = normalized.indexOf("\n---\n", 4);
  if (end === -1) {
    return normalized;
  }

  const frontMatter = normalized.slice(4, end);
  const body = normalized.slice(end + 5);
  const nextLines = frontMatter
    .split("\n")
    .filter((line) => {
      const separator = line.indexOf(":");
      if (separator === -1) return line.trim() !== "";
      const existingKey = line.slice(0, separator).trim();
      return existingKey !== key;
    });

  return `---\n${nextLines.join("\n")}\n---\n${body.startsWith("\n") ? body : `\n${body}`}`;
}
