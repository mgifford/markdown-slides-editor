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

function sanitizeSvgMarkup(markup) {
  return String(markup)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/\s+(href|xlink:href)\s*=\s*"\s*javascript:[^"]*"/gi, "")
    .replace(/\s+(href|xlink:href)\s*=\s*'\s*javascript:[^']*'/gi, "");
}

const SAFE_IMG_ATTRS = new Set([
  "src", "alt", "width", "height", "class", "id", "loading", "decoding", "crossorigin",
]);

function sanitizeImgMarkup(markup) {
  // Rebuild the <img> tag using only allowlisted attributes to prevent injection.
  // Handles quoted ("..." or '...') and unquoted attribute values.
  const attrPattern = /\s+([a-z][a-z0-9-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let safeAttrs = "";
  let match;
  while ((match = attrPattern.exec(markup)) !== null) {
    const name = match[1].toLowerCase();
    const value = match[2] !== undefined ? match[2] : match[3] !== undefined ? match[3] : match[4];
    if (!SAFE_IMG_ATTRS.has(name)) continue;
    if (name === "src") {
      // Only allow http/https absolute URLs and relative paths; block all other protocols.
      const trimmedVal = String(value).trim();
      if (/^[a-z][a-z0-9+.-]*:/i.test(trimmedVal) && !/^https?:/i.test(trimmedVal)) continue;
    }
    safeAttrs += ` ${name}="${escapeAttribute(value)}"`;
  }
  return `<img${safeAttrs}>`;
}

function collectInlineSvgBlock(lines, startIndex) {
  const firstLine = String(lines[startIndex] || "").trimStart();
  if (!/^<svg\b/i.test(firstLine)) return null;

  const content = [lines[startIndex]];
  if (/<\/svg>\s*$/i.test(firstLine) || /<\/svg>/i.test(firstLine)) {
    return {
      markup: content.join("\n"),
      endIndex: startIndex,
    };
  }

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    content.push(lines[index]);
    if (/<\/svg>/i.test(lines[index])) {
      return {
        markup: content.join("\n"),
        endIndex: index,
      };
    }
  }

  return {
    markup: content.join("\n"),
    endIndex: lines.length - 1,
  };
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
  const directiveMatch = /^::([a-z0-9%-]+)((?:\s+[\w-]+)*)\s*$/i.exec(lines[startIndex].trim());
  if (!directiveMatch) {
    return null;
  }

  const modifiers = directiveMatch[2]
    ? directiveMatch[2].trim().toLowerCase().split(/\s+/)
    : [];

  let depth = 1;
  const content = [];

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (/^::[a-z0-9%-]+(?:\s+[\w-]+)*\s*$/i.test(trimmed)) {
      depth += 1;
      content.push(lines[index]);
      continue;
    }

    if (trimmed === "::") {
      depth -= 1;
      if (depth === 0) {
        return {
          directive: directiveMatch[1].toLowerCase(),
          modifiers,
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
    modifiers,
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

    const isProgressive = block.modifiers && block.modifiers.includes("on-click");
    const innerHtml = renderLines(block.content, state);
    const style = column.width ? ` style="--column-basis:${escapeAttribute(column.width)}"` : "";
    const progressiveClass = isProgressive ? " next" : "";
    columns.push(
      `<section class="layout-columns__column layout-columns__column--${column.side}${progressiveClass}"${style}>${innerHtml}</section>`,
    );
    if (isProgressive) state.stepCount += 1;

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
  const isProgressive = block.modifiers && block.modifiers.includes("on-click");
  const progressiveClass = isProgressive ? " next" : "";

  if (block.directive === "center") {
    if (isProgressive) state.stepCount += 1;
    return `<div class="layout-center${progressiveClass}">${renderLines(block.content, state)}</div>`;
  }

  if (block.directive === "svg") {
    if (isProgressive) state.stepCount += 1;
    const rawSvg = collectInlineSvgBlock(block.content, 0);
    if (rawSvg) {
      return `<figure class="layout-svg${progressiveClass}">${sanitizeSvgMarkup(rawSvg.markup)}</figure>`;
    }
    // Support a bare <img> tag referencing an external SVG file.
    const firstNonEmpty = block.content.find((l) => l.trim());
    if (firstNonEmpty && /^<img\b/i.test(firstNonEmpty.trim())) {
      return `<figure class="layout-svg${progressiveClass}">${sanitizeImgMarkup(firstNonEmpty.trim())}</figure>`;
    }
    return `<figure class="layout-svg${progressiveClass}">${renderLines(block.content, state)}</figure>`;
  }

  if (block.directive === "mermaid") {
    if (isProgressive) state.stepCount += 1;
    const source = block.content.join("\n").trim();
    if (!source) {
      return `<figure class="layout-mermaid${progressiveClass}"><p>Mermaid diagram source is empty.</p></figure>`;
    }
    state.mermaidCount += 1;
    return `
      <figure class="layout-mermaid${progressiveClass}">
        <div class="mermaid" data-mermaid-id="mermaid-${state.mermaidCount}">${escapeHtml(source)}</div>
      </figure>
    `;
  }

  if (block.directive === "callout") {
    if (isProgressive) state.stepCount += 1;
    return `<aside class="layout-callout${progressiveClass}">${renderLines(block.content, state)}</aside>`;
  }

  if (block.directive === "quote") {
    if (isProgressive) state.stepCount += 1;
    return `<blockquote class="layout-quote${progressiveClass}">${renderLines(block.content, state)}</blockquote>`;
  }

  if (block.directive === "media-left" || block.directive === "media-right") {
    if (isProgressive) state.stepCount += 1;
    const { first, second } = splitOnDivider(block.content);
    const mediaHtml = renderLines(first, state);
    const bodyHtml = renderLines(second, state);
    return `
      <div class="layout-media layout-media--${block.directive === "media-left" ? "left" : "right"}${progressiveClass}">
        <div class="layout-media__visual">${mediaHtml}</div>
        <div class="layout-media__body">${bodyHtml}</div>
      </div>
    `;
  }

  return null;
}

function buildNestedListHtml(items, type, currentDepth) {
  const parts = [];
  parts.push(`<${type}>`);

  let i = 0;
  while (i < items.length) {
    const item = items[i];
    let j = i + 1;
    while (j < items.length && items[j].depth > currentDepth) {
      j += 1;
    }
    const children = items.slice(i + 1, j);
    const classes = item.isProgressive ? ' class="next"' : "";
    if (children.length > 0) {
      parts.push(
        `<li${classes}>${renderInline(item.text)}${buildNestedListHtml(children, type, currentDepth + 1)}</li>`,
      );
    } else {
      parts.push(`<li${classes}>${renderInline(item.text)}</li>`);
    }
    i = j;
  }

  parts.push(`</${type}>`);
  return parts.join("");
}

function renderLines(lines, state) {
  const htmlParts = [];
  let listItems = [];
  let listType = null;

  function flushList() {
    if (listItems.length === 0) return;
    htmlParts.push(buildNestedListHtml(listItems, listType, 0));
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

    if (/^::column-(left|right)(?:-[0-9.]+(?:px|%|rem|vw)?)?(?:\s+[\w-]+)*\s*$/i.test(trimmed)) {
      flushList();
      const renderedColumns = renderColumns(lines, index, state);
      htmlParts.push(renderedColumns.html);
      index = renderedColumns.nextIndex;
      continue;
    }

    if (/^::[a-z0-9%-]+(?:\s+[\w-]+)*\s*$/i.test(trimmed)) {
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

    const rawSvg = collectInlineSvgBlock(lines, index);
    if (rawSvg) {
      flushList();
      htmlParts.push(`<figure class="layout-svg">${sanitizeSvgMarkup(rawSvg.markup)}</figure>`);
      index = rawSvg.endIndex + 1;
      continue;
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

    const unorderedListMatch = /^(\s*)-\s+(.+)$/.exec(line);
    if (unorderedListMatch) {
      const depth = Math.min(Math.floor(unorderedListMatch[1].length / 2), 2);
      const text = unorderedListMatch[2].trim();
      const isProgressive = text.startsWith("[>] ");
      if (!listType) listType = "ul";
      if (listType !== "ul") flushList();
      listType = "ul";
      listItems.push({
        text: isProgressive ? text.slice(4).trim() : text,
        isProgressive,
        depth,
      });
      if (isProgressive) state.stepCount += 1;
      index += 1;
      continue;
    }

    const orderedListMatch = /^(\s*)(\d+)\.\s+(.+)$/.exec(line);
    if (orderedListMatch) {
      const depth = Math.min(Math.floor(orderedListMatch[1].length / 2), 2);
      const text = orderedListMatch[3].trim();
      const isProgressive = text.startsWith("[>] ");
      if (!listType) listType = "ol";
      if (listType !== "ol") flushList();
      listType = "ol";
      listItems.push({
        text: isProgressive ? text.slice(4).trim() : text,
        isProgressive,
        depth,
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
