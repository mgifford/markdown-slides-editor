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
  let listType = null;
  let stepCount = 0;

  function flushList() {
    if (listItems.length === 0) return;
    htmlParts.push(`<${listType}>`);
    for (const item of listItems) {
      const classes = item.isProgressive ? ' class="next"' : "";
      htmlParts.push(`<li${classes}>${renderInline(item.text)}</li>`);
    }
    htmlParts.push(`</${listType}>`);
    listItems = [];
    listType = null;
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

    const unorderedListMatch = /^-\s+(.+)$/.exec(line);
    if (unorderedListMatch) {
      const text = unorderedListMatch[1].trim();
      const isProgressive = text.startsWith("[>] ");
      if (!listType) listType = "ul";
      if (listType !== "ul") flushList();
      listType = "ul";
      listItems.push({
        text: isProgressive ? text.slice(4).trim() : text,
        isProgressive,
      });
      if (isProgressive) stepCount += 1;
      continue;
    }

    const orderedListMatch = /^(\d+)\.\s+(.+)$/.exec(line);
    if (orderedListMatch) {
      const text = orderedListMatch[2].trim();
      const isProgressive = text.startsWith("[>] ");
      if (!listType) listType = "ol";
      if (listType !== "ol") flushList();
      listType = "ol";
      listItems.push({
        text: isProgressive ? text.slice(4).trim() : text,
        isProgressive,
      });
      if (isProgressive) stepCount += 1;
      continue;
    }

    flushList();
    htmlParts.push(`<p>${renderInline(line)}</p>`);
  }

  flushList();

  return {
    html: htmlParts.join(""),
    headings,
    stepCount,
  };
}
