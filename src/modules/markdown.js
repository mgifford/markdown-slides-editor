function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderInline(text) {
  let html = escapeHtml(text);
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  return html;
}

export function renderMarkdown(markdown) {
  const lines = markdown.split("\n");
  const htmlParts = [];
  const headings = [];
  let listItems = [];

  function flushList() {
    if (listItems.length === 0) return;
    htmlParts.push("<ul>");
    for (const item of listItems) {
      htmlParts.push(`<li>${renderInline(item)}</li>`);
    }
    htmlParts.push("</ul>");
    listItems = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      flushList();
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      headings.push({ level, text });
      htmlParts.push(`<h${level}>${renderInline(text)}</h${level}>`);
      continue;
    }

    const listMatch = /^-\s+(.+)$/.exec(line);
    if (listMatch) {
      listItems.push(listMatch[1].trim());
      continue;
    }

    flushList();
    htmlParts.push(`<p>${renderInline(line)}</p>`);
  }

  flushList();

  return {
    html: htmlParts.join(""),
    headings,
  };
}
