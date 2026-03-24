function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttribute(value) {
  return escapeHtml(String(value));
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

function collectDirectiveBlock(lines, startIndex) {
  const directiveMatch = /^::([a-z0-9%-]+)\s*$/i.exec(lines[startIndex].trim());
  if (!directiveMatch) {
    return null;
  }

  let depth = 1;
  const content = [];

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (/^::[a-z0-9%-]+\s*$/i.test(trimmed)) {
      depth += 1;
      content.push(lines[index]);
      continue;
    }

    if (trimmed === "::") {
      depth -= 1;
      if (depth === 0) {
        return {
          directive: directiveMatch[1].toLowerCase(),
          content,
          endIndex: index,
        };
      }
      content.push(lines[index]);
      continue;
    }

    content.push(lines[index]);
  }

  return {
    directive: directiveMatch[1].toLowerCase(),
    content,
    endIndex: lines.length - 1,
  };
}

function parseColumnDirective(directive) {
  const match = /^column-(left|right)(?:-([0-9.]+(?:px|%|rem|vw)?))?$/i.exec(directive);
  if (!match) return null;
  return {
    side: match[1].toLowerCase(),
    width: match[2] || "",
  };
}

function renderColumns(lines, startIndex, state) {
  const columns = [];
  let index = startIndex;

  while (index < lines.length) {
    const block = collectDirectiveBlock(lines, index);
    if (!block) break;
    const column = parseColumnDirective(block.directive);
    if (!column) break;

    const innerHtml = renderLines(block.content, state);
    const style = column.width ? ` style="--column-basis:${escapeAttribute(column.width)}"` : "";
    columns.push(
      `<section class="layout-columns__column layout-columns__column--${column.side}"${style}>${innerHtml}</section>`,
    );

    index = block.endIndex + 1;
    while (index < lines.length && !lines[index].trim()) {
      index += 1;
    }
  }

  return {
    html: `<div class="layout-columns">${columns.join("")}</div>`,
    nextIndex: index,
  };
}

function splitOnDivider(lines) {
  const dividerIndex = lines.findIndex((line) => line.trim() === "---");
  if (dividerIndex === -1) {
    return {
      first: lines,
      second: [],
    };
  }

  return {
    first: lines.slice(0, dividerIndex),
    second: lines.slice(dividerIndex + 1),
  };
}

function renderSpecialDirective(block, state) {
  if (block.directive === "center") {
    return `<div class="layout-center">${renderLines(block.content, state)}</div>`;
  }

  if (block.directive === "svg") {
    return `<figure class="layout-svg">${renderLines(block.content, state)}</figure>`;
  }

  if (block.directive === "mermaid") {
    const source = block.content.join("\n").trim();
    if (!source) {
      return `<figure class="layout-mermaid"><p>Mermaid diagram source is empty.</p></figure>`;
    }
    state.mermaidCount += 1;
    return `
      <figure class="layout-mermaid">
        <div class="mermaid" data-mermaid-id="mermaid-${state.mermaidCount}">${escapeHtml(source)}</div>
      </figure>
    `;
  }

  if (block.directive === "callout") {
    return `<aside class="layout-callout">${renderLines(block.content, state)}</aside>`;
  }

  if (block.directive === "quote") {
    return `<blockquote class="layout-quote">${renderLines(block.content, state)}</blockquote>`;
  }

  if (block.directive === "media-left" || block.directive === "media-right") {
    const { first, second } = splitOnDivider(block.content);
    const mediaHtml = renderLines(first, state);
    const bodyHtml = renderLines(second, state);
    return `
      <div class="layout-media layout-media--${block.directive === "media-left" ? "left" : "right"}">
        <div class="layout-media__visual">${mediaHtml}</div>
        <div class="layout-media__body">${bodyHtml}</div>
      </div>
    `;
  }

  return null;
}

function renderLines(lines, state) {
  const htmlParts = [];
  let listItems = [];
  let listType = null;

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

  let index = 0;
  while (index < lines.length) {
    const rawLine = lines[index];
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      index += 1;
      continue;
    }

    if (/^::column-(left|right)(?:-[0-9.]+(?:px|%|rem|vw)?)?\s*$/i.test(trimmed)) {
      flushList();
      const renderedColumns = renderColumns(lines, index, state);
      htmlParts.push(renderedColumns.html);
      index = renderedColumns.nextIndex;
      continue;
    }

    if (/^::[a-z0-9%-]+\s*$/i.test(trimmed)) {
      flushList();
      const block = collectDirectiveBlock(lines, index);
      if (block) {
        const specialHtml = renderSpecialDirective(block, state);
        if (specialHtml) {
          htmlParts.push(specialHtml);
          index = block.endIndex + 1;
          continue;
        }
      }
    }

    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      state.headings.push({ level, text });
      htmlParts.push(`<h${level}>${renderInline(text)}</h${level}>`);
      index += 1;
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
      if (isProgressive) state.stepCount += 1;
      index += 1;
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
      if (isProgressive) state.stepCount += 1;
      index += 1;
      continue;
    }

    flushList();
    htmlParts.push(`<p>${renderInline(line)}</p>`);
    index += 1;
  }

  flushList();
  return htmlParts.join("");
}

export function renderMarkdown(markdown) {
  const state = {
    headings: [],
    stepCount: 0,
    mermaidCount: 0,
  };

  return {
    html: renderLines(String(markdown || "").split("\n"), state),
    headings: state.headings,
    stepCount: state.stepCount,
  };
}
