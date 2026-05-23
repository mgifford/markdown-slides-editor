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

function renderInlineMarkup(escapedHtml) {
  let html = escapedHtml;
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  return html;
}

function renderInline(text, state) {
  // Handle inline progressive fragments {>...} before HTML-escaping so that
  // the > character does not get mangled to &gt; before we can match it.
  const FRAGMENT_RE = /\{>([^}]*)\}/g;
  let result = "";
  let lastIndex = 0;
  let match;
  while ((match = FRAGMENT_RE.exec(text)) !== null) {
    result += renderInlineMarkup(escapeHtml(text.slice(lastIndex, match.index)));
    result += `<span class="next">${renderInlineMarkup(escapeHtml(match[1]))}</span>`;
    if (state) state.stepCount += 1;
    lastIndex = match.index + match[0].length;
  }
  result += renderInlineMarkup(escapeHtml(text.slice(lastIndex)));
  return result;
}

const DIRECTIVE_OPEN_RE = /^::([a-z0-9%\u00ad\u2010-\u2015\u2212-]+)(?:\s+(.+?))?\s*$/i;
const DIRECTIVE_DASH_RE = /[\u00ad\u2010-\u2015\u2212]/g;

function normalizeDirectiveModifier(modifier) {
  return String(modifier).trim().toLowerCase().replace(DIRECTIVE_DASH_RE, "-");
}

function parseDirectiveOpenLine(line) {
  const directiveMatch = DIRECTIVE_OPEN_RE.exec(String(line).trim());
  if (!directiveMatch) {
    return null;
  }
  return {
    directive: normalizeDirectiveModifier(directiveMatch[1]),
    modifiers: directiveMatch[2]
      ? directiveMatch[2].trim().split(/\s+/).filter(Boolean).map(normalizeDirectiveModifier)
      : [],
  };
}

function collectDirectiveBlock(lines, startIndex) {
  const opening = parseDirectiveOpenLine(lines[startIndex]);
  if (!opening) {
    return null;
  }

  let depth = 1;
  const content = [];

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (parseDirectiveOpenLine(trimmed)) {
      depth += 1;
      content.push(lines[index]);
      continue;
    }

    if (trimmed === "::") {
      depth -= 1;
      if (depth === 0) {
        return {
          directive: opening.directive,
          modifiers: opening.modifiers,
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
    directive: opening.directive,
    modifiers: opening.modifiers,
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

function splitOnDividers(lines) {
  const sections = [];
  let current = [];
  for (const line of lines) {
    if (line.trim() === "---") {
      sections.push(current);
      current = [];
    } else {
      current.push(line);
    }
  }
  sections.push(current);
  return sections;
}

function resolveHeroPosition(modifiers, options) {
  const {
    prefix,
    defaultVertical,
    defaultHorizontal,
    allowCenter = false,
  } = options;
  const canonical = new Set([
    `${prefix}-top-left`,
    `${prefix}-top-right`,
    `${prefix}-bottom-left`,
    `${prefix}-bottom-right`,
    ...(allowCenter ? [`${prefix}-center`] : []),
  ]);

  for (const modifier of modifiers) {
    if (!modifier.startsWith(`${prefix}-`)) continue;
    if (canonical.has(modifier)) return modifier;

    const parts = modifier.slice(prefix.length + 1).split("-").filter(Boolean);
    if (allowCenter && parts.includes("center")) return `${prefix}-center`;

    let vertical = defaultVertical;
    let horizontal = defaultHorizontal;
    let sawAxisToken = false;
    for (const part of parts) {
      if (part === "top" || part === "bottom") {
        vertical = part;
        sawAxisToken = true;
        continue;
      }
      if (part === "left" || part === "right") {
        horizontal = part;
        sawAxisToken = true;
      }
    }

    if (sawAxisToken) return `${prefix}-${vertical}-${horizontal}`;
  }

  return `${prefix}-${defaultVertical}-${defaultHorizontal}`;
}

/**
 * Count approximate visible character length for short overlay copy authored in Markdown.
 * Strips inline markdown syntax so linting can reflect what appears onscreen to the audience.
 * This intentionally handles only this project's lightweight inline markdown subset.
 *
 * @param {string} markdownText
 * @returns {number}
 */
function getPlainTextLength(markdownText) {
  return String(markdownText)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim().length;
}

function parseTableRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|")) return null;
  const cells = trimmed.split("|").slice(1);
  if (cells.length > 0 && cells[cells.length - 1].trim() === "") cells.pop();
  return cells.map((c) => c.trim());
}

function isTableSeparatorRow(cells) {
  return cells.length > 0 && cells.every((c) => /^:?-+:?$/.test(c));
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

  if (block.directive === "big-stat") {
    if (isProgressive) state.stepCount += 1;
    const sections = splitOnDividers(block.content);
    if (sections.length >= 3) {
      // 3+ sections: visual / stat-number / body
      const visualHtml = renderLines(sections[0], state);
      const statHtml = renderLines(sections[1], state);
      const bodyHtml = renderLines(sections[2], state);
      return `
        <div class="layout-big-stat${progressiveClass}">
          <div class="big-stat__visual">${visualHtml}</div>
          <div class="big-stat__number">${statHtml}</div>
          <div class="big-stat__body">${bodyHtml}</div>
        </div>
      `;
    }
    if (sections.length === 2) {
      // 2 sections: stat-number / body
      const statHtml = renderLines(sections[0], state);
      const bodyHtml = renderLines(sections[1], state);
      return `
        <div class="layout-big-stat${progressiveClass}">
          <div class="big-stat__number">${statHtml}</div>
          <div class="big-stat__body">${bodyHtml}</div>
        </div>
      `;
    }
    // Fallback: single section, render all content centred
    return `<div class="layout-big-stat${progressiveClass}">${renderLines(block.content, state)}</div>`;
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

  if (block.directive === "code") {
    if (isProgressive) state.stepCount += 1;
    const lang = block.modifiers.find((m) => m !== "on-click") || "";
    const langAttr = lang ? ` class="language-${escapeAttribute(lang)}"` : "";
    const source = block.content.join("\n");
    return `<figure class="layout-code${progressiveClass}"><pre><code${langAttr}>${escapeHtml(source)}</code></pre></figure>`;
  }

  if (block.directive === "table") {
    if (isProgressive) state.stepCount += 1;
    const rows = block.content.map(parseTableRow).filter(Boolean);
    if (rows.length === 0) {
      return `<figure class="layout-table${progressiveClass}"></figure>`;
    }
    const headerCells = rows[0];
    const hasSeparator = rows.length > 1 && isTableSeparatorRow(rows[1]);
    const dataRows = hasSeparator ? rows.slice(2) : rows.slice(1);
    const rawDataLines = block.content
      .filter((l) => l.trim().startsWith("|"))
      .slice(hasSeparator ? 2 : 1);
    const theadHtml = `<thead><tr>${headerCells.map((c) => `<th>${renderInline(c, state)}</th>`).join("")}</tr></thead>`;
    const tbodyRows = dataRows.map((cells, rowIndex) => {
      const rawLine = rawDataLines[rowIndex] || "";
      const isRowProgressive = rawLine.trim().startsWith("| [>] ");
      const rowCells = isRowProgressive
        ? [cells[0].replace(/^\[>\]\s*/, ""), ...cells.slice(1)]
        : cells;
      if (isRowProgressive) state.stepCount += 1;
      const rowClass = isRowProgressive ? ' class="next"' : "";
      return `<tr${rowClass}>${rowCells.map((c) => `<td>${renderInline(c, state)}</td>`).join("")}</tr>`;
    });
    const tbodyHtml = `<tbody>${tbodyRows.join("")}</tbody>`;
    return `<figure class="layout-table${progressiveClass}"><table>${theadHtml}${tbodyHtml}</table></figure>`;
  }

  if (block.directive === "figure") {
    if (isProgressive) state.stepCount += 1;
    const { first, second } = splitOnDivider(block.content);
    const mediaHtml = renderLines(first, state);
    const captionText = second.join("\n").trim();
    const captionHtml = captionText
      ? `<figcaption>${renderInline(captionText, state)}</figcaption>`
      : "";
    return `<figure class="layout-figure${progressiveClass}">${mediaHtml}${captionHtml}</figure>`;
  }

  if (block.directive === "step") {
    if (isProgressive) state.stepCount += 1;
    return `<div class="layout-step${progressiveClass}">${renderLines(block.content, state)}</div>`;
  }

  if (block.directive === "image-hero") {
    if (isProgressive) state.stepCount += 1;
    state.hasImageHero = true;
    if (block.modifiers.includes("show-title")) state.imageHeroShowTitle = true;
    if (block.modifiers.includes("show-subtitle")) state.imageHeroShowSubtitle = true;

    const textPos = resolveHeroPosition(block.modifiers, {
      prefix: "text",
      defaultVertical: "bottom",
      defaultHorizontal: "left",
      allowCenter: true,
    });
    const logoPos = resolveHeroPosition(block.modifiers, {
      prefix: "logo",
      defaultVertical: "top",
      defaultHorizontal: "right",
    });

    // Parse optional timing/visual modifiers:
    // stay-N (seconds image is full), transition-N (seconds of reveal),
    // final-N (final image opacity), pan-{left|right|up|down},
    // blur-Npx, saturation-N.
    let staySeconds = 0;
    let transSeconds = 2;
    let finalOpacity = 0.3;
    let panDirection = "none";
    let blurAmount = "0px";
    let saturationLevel = 1;
    let hasTimedModifiers = false;
    for (const mod of block.modifiers) {
      const stayMatch = /^stay-(\d+(?:\.\d+)?)$/.exec(mod);
      if (stayMatch) {
        staySeconds = parseFloat(stayMatch[1]);
        hasTimedModifiers = true;
        continue;
      }
      const transMatch = /^transition-(\d+(?:\.\d+)?)$/.exec(mod);
      if (transMatch) {
        transSeconds = parseFloat(transMatch[1]);
        hasTimedModifiers = true;
        continue;
      }
      const finalMatch = /^final-(\d+(?:\.\d+)?)$/.exec(mod);
      if (finalMatch) {
        finalOpacity = Math.min(1, Math.max(0, parseFloat(finalMatch[1])));
        hasTimedModifiers = true;
        continue;
      }
      const panMatch = /^pan-(left|right|up|down)$/.exec(mod);
      if (panMatch) {
        panDirection = panMatch[1];
        continue;
      }
      const blurMatch = /^blur-(\d+(?:\.\d+)?px)$/.exec(mod);
      if (blurMatch) {
        blurAmount = blurMatch[1];
        continue;
      }
      const saturationMatch = /^saturation-(\d+(?:\.\d+)?)$/.exec(mod);
      if (saturationMatch) {
        saturationLevel = Math.min(1, Math.max(0, parseFloat(saturationMatch[1])));
      }
    }
    const hasVisualTransitionModifiers =
      panDirection !== "none" || blurAmount !== "0px" || saturationLevel !== 1;
    const isTimed = hasTimedModifiers || hasVisualTransitionModifiers;
    const effectiveStay = staySeconds;
    const effectiveTrans = transSeconds;
    const effectiveFinal = finalOpacity;
    const panX = panDirection === "left" ? "-2%" : panDirection === "right" ? "2%" : "0%";
    const panY = panDirection === "up" ? "-2%" : panDirection === "down" ? "2%" : "0%";

    const sections = splitOnDividers(block.content);
    const imageLines = sections[0] || [];
    const overlayLines = sections[1] || [];
    const logoLines = sections[2] || [];

    // Render background image
    const firstImageLine = imageLines.map((l) => l.trim()).find(Boolean) || "";
    let imageHtml = "";
    const mdImgMatch = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(firstImageLine);
    if (mdImgMatch) {
      const alt = escapeAttribute(mdImgMatch[1]);
      const src = escapeAttribute(mdImgMatch[2]);
      imageHtml = `<img class="layout-image-hero__image" src="${src}" alt="${alt}">`;
    } else if (/^<img\b/i.test(firstImageLine)) {
      const safe = sanitizeImgMarkup(firstImageLine);
      imageHtml = safe.replace(/^<img/, `<img class="layout-image-hero__image"`);
    }

    // Render overlay text (supports inline markdown emphasis/links)
    const overlayText = overlayLines.join("\n").trim();
    const overlayTextLength = getPlainTextLength(overlayText);
    const overlayHtml = overlayText
      ? `<div class="layout-image-hero__overlay" data-overlay-text-length="${overlayTextLength}">${renderInline(overlayText, state)}</div>`
      : "";

    // Render optional corner logo (SVG or img)
    let logoHtml = "";
    const firstLogoLine = logoLines.map((l) => l.trim()).find(Boolean) || "";
    if (firstLogoLine) {
      const rawSvg = collectInlineSvgBlock(
        logoLines.filter((l) => l.trim()),
        0,
      );
      if (rawSvg) {
        logoHtml = `<figure class="layout-image-hero__logo" aria-hidden="true">${sanitizeSvgMarkup(rawSvg.markup)}</figure>`;
      } else if (/^<img\b/i.test(firstLogoLine)) {
        logoHtml = `<figure class="layout-image-hero__logo" aria-hidden="true">${sanitizeImgMarkup(firstLogoLine)}</figure>`;
      }
    }

    const classNames = [
      "layout-image-hero",
      "image-hero-slide",
      isTimed ? "layout-image-hero--timed" : "",
      `layout-image-hero--${textPos}`,
      logoHtml ? `layout-image-hero--${logoPos}` : "",
      progressiveClass,
    ]
      .filter(Boolean)
      .join(" ");

    const figureStyle =
      ` style="--hero-stay:${effectiveStay}s;--hero-transition:${effectiveTrans}s;--hero-opacity:${effectiveFinal};--hero-final:${effectiveFinal};--hero-pan:${panDirection};--hero-pan-x:${panX};--hero-pan-y:${panY};--hero-blur:${blurAmount};--hero-saturation:${saturationLevel}"`;

    return `<figure class="${classNames}"${figureStyle}>${imageHtml}${overlayHtml}${logoHtml}</figure>`;
  }

  return null;
}

function buildNestedListHtml(items, type, currentDepth, state) {
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
        `<li${classes}>${renderInline(item.text, state)}${buildNestedListHtml(children, type, currentDepth + 1, state)}</li>`,
      );
    } else {
      parts.push(`<li${classes}>${renderInline(item.text, state)}</li>`);
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
    htmlParts.push(buildNestedListHtml(listItems, listType, 0, state));
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

    if (/^::column-(left|right)(?:-[0-9.]+(?:px|%|rem|vw)?)?(?:\s+[\w.-]+)*\s*$/i.test(trimmed)) {
      flushList();
      const renderedColumns = renderColumns(lines, index, state);
      htmlParts.push(renderedColumns.html);
      index = renderedColumns.nextIndex;
      continue;
    }

    if (parseDirectiveOpenLine(trimmed)) {
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
      htmlParts.push(`<h${level}>${renderInline(text, state)}</h${level}>`);
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
    htmlParts.push(`<p>${renderInline(line, state)}</p>`);
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
    hasImageHero: false,
    imageHeroShowTitle: false,
    imageHeroShowSubtitle: false,
  };

  return {
    html: renderLines(String(markdown || "").split("\n"), state),
    headings: state.headings,
    stepCount: state.stepCount,
    hasImageHero: state.hasImageHero,
    imageHeroShowTitle: state.imageHeroShowTitle,
    imageHeroShowSubtitle: state.imageHeroShowSubtitle,
  };
}
