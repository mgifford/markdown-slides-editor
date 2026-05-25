import { buildDeckStyleAttribute, buildThemeLinkTag } from "./theme.js";
import { stripProtocol } from "./utils.js";

const textEncoder = new TextEncoder();
const ODP_MIMETYPE = "application/vnd.oasis.opendocument.presentation";

/** Return the CSS class string for a rendered slide's outermost article element. */
function getSlideCardClass(slide) {
  if (slide.kind === "title" || slide.kind === "closing") return "slide-card slide-card--title";
  if (slide.isImageHero) return "slide-card slide-card--image-hero";
  return "slide-card";
}


function escapeScriptText(value) {
  // The HTML parser closes <script> elements at </script (case-insensitive), regardless of the
  // type attribute. Escape ALL case variants to prevent premature element closure, while
  // preserving the original casing so the stored value round-trips correctly.
  return value.replace(/<\/script/gi, (match) => "<\\/" + match.slice(2));
}

function escapeStyleText(value) {
  // <style> is a raw text element: the HTML parser closes it at the first </style token
  // (case-insensitive). Escape any such sequence to prevent premature closure when CSS
  // content from an external theme stylesheet contains it (e.g. in a comment).
  return value.replace(/<\/style/gi, (match) => "<\\/" + match.slice(2));
}

function escapeHtmlAttr(value) {
  // Minimal HTML escaping for attribute values and text nodes in the generated HTML templates.
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Returns a self-contained `<style>` block when `themeStylesheetCss` is provided
 * (so the exported file works offline), or falls back to an external `<link>` tag
 * when only the URL is available in metadata.
 *
 * @param {string} themeStylesheetCss - Pre-fetched theme CSS text (may be empty/undefined).
 * @param {object} metadata - Deck metadata containing optional `themeStylesheet` URL for fallback link tag.
 */
function buildThemeHeadTag(themeStylesheetCss, metadata) {
  if (themeStylesheetCss) {
    return `<style>${escapeStyleText(themeStylesheetCss)}</style>`;
  }
  return buildThemeLinkTag(metadata);
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function downloadFile(filename, contents, type) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function openHtmlInNewWindow(contents) {
  const blob = new Blob([contents], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  return opened;
}

function slugifyFilenamePart(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, " ")
    .replace(/_/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatCompactDate(value) {
  let date;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "string") {
    const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    } else {
      date = new Date(value);
    }
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-CA", { month: "short" });
  const year = date.getFullYear();
  return `${day}${month}${year}`;
}

export function buildExportFilename(title, dateValue) {
  const safeTitle = slugifyFilenamePart(title || "");
  const safeDate = formatCompactDate(dateValue || new Date());

  if (!safeTitle && !safeDate) {
    return "deck-export.zip";
  }

  if (!safeTitle) {
    return `${safeDate}.zip`;
  }

  if (!safeDate) {
    return `${safeTitle}.zip`;
  }

  return `${safeTitle}_${safeDate}.zip`;
}

/**
 * Like `buildExportFilename` but truncates the title slug to the first
 * `maxWords` dash-separated words, producing a shorter filename that still
 * captures the topic without including every word from a long title.
 *
 * @param {string} title - The deck title from front matter.
 * @param {string|Date} dateValue - The deck date (ISO string or Date object).
 * @param {number} [maxWords=5] - Maximum number of slug words to keep.
 * @returns {string} A `.zip` filename with a shortened title slug.
 */
export function buildShortExportFilename(title, dateValue, maxWords = 5) {
  const safeTitle = slugifyFilenamePart(title || "");
  const safeDate = formatCompactDate(dateValue || new Date());
  const shortTitle = safeTitle.split("-").slice(0, maxWords).join("-");

  if (!shortTitle && !safeDate) {
    return "deck-export.zip";
  }

  if (!shortTitle) {
    return `${safeDate}.zip`;
  }

  if (!safeDate) {
    return `${shortTitle}.zip`;
  }

  return `${shortTitle}_${safeDate}.zip`;
}

function encodeText(value) {
  return textEncoder.encode(value);
}

function encodeContents(value) {
  return value instanceof Uint8Array ? value : encodeText(value);
}

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let c = index;
    for (let bit = 0; bit < 8; bit += 1) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[index] = c >>> 0;
  }
  return table;
}

const crcTable = createCrcTable();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value) {
  return Uint8Array.of(value & 0xff, (value >>> 8) & 0xff);
}

function u32(value) {
  return Uint8Array.of(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function concatUint8Arrays(chunks) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

export function buildZipArchive(files) {
  const localChunks = [];
  const centralChunks = [];
  let offset = 0;

  for (const file of files) {
    const filenameBytes = encodeText(file.name);
    const contentBytes = encodeContents(file.contents);
    const checksum = crc32(contentBytes);

    const localHeader = concatUint8Arrays([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(checksum),
      u32(contentBytes.length),
      u32(contentBytes.length),
      u16(filenameBytes.length),
      u16(0),
      filenameBytes,
      contentBytes,
    ]);
    localChunks.push(localHeader);

    const centralHeader = concatUint8Arrays([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(checksum),
      u32(contentBytes.length),
      u32(contentBytes.length),
      u16(filenameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      filenameBytes,
    ]);
    centralChunks.push(centralHeader);
    offset += localHeader.length;
  }

  const centralDirectory = concatUint8Arrays(centralChunks);
  const localSection = concatUint8Arrays(localChunks);
  const endOfCentralDirectory = concatUint8Arrays([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralDirectory.length),
    u32(localSection.length),
    u16(0),
  ]);

  return concatUint8Arrays([localSection, centralDirectory, endOfCentralDirectory]);
}

function base64Encode(value) {
  const bytes = encodeText(value);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function decodeHtmlEntities(value) {
  return String(value)
    .replaceAll("&nbsp;", " ")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function htmlToTextLines(value) {
  return decodeHtmlEntities(
    String(value)
      .replace(/<li[^>]*>/gi, "\n• ")
      .replace(/<(?:br|br\/)\s*>/gi, "\n")
      .replace(/<\/(?:p|div|section|article|blockquote|ul|ol|li|h1|h2|h3|h4|h5|h6|dt|dd|th|td|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Convert slide body HTML into an array of `{ text, style }` objects suitable
 * for ODP `<text:p>` elements.  H2 and H3 headings are tagged with distinct
 * style names (`PH2` / `PH3`) so they render at the right size in Impress.
 */
// Sentinel prefixes written into the plain-text conversion to mark heading levels.
// They must be unique strings that cannot appear in normal slide content.
const ODP_H2_MARKER = "__H2__";
const ODP_H3_MARKER = "__H3__";

function htmlToOdpParagraphs(html) {
  // Capture H2/H3 inner text before all other tags are stripped so we can
  // assign the correct paragraph style.  Any residual tags inside the heading
  // are removed by stripTags, which also strips bare `<` characters to ensure
  // no angle-bracket sequences survive.  The overall normalized string receives
  // the same treatment at the end of the chain.  All text values are
  // additionally passed through escapeXml() at every call site before being
  // written into the ODP XML.
  const stripTags = (s) => s.replace(/<[^>]+>/g, "").replace(/</g, "");
  const normalized = String(html)
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, inner) => "\n" + ODP_H2_MARKER + stripTags(inner) + "\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, inner) => "\n" + ODP_H3_MARKER + stripTags(inner) + "\n")
    // Preserve alt text from <img> tags (including external SVG references) as
    // a bracketed description so the content is not silently lost in the export.
    .replace(/<img\b[^>]*>/gi, (imgTag) => {
      const altMatch = /\balt\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(imgTag);
      if (altMatch) {
        const altText = altMatch[1] !== undefined ? altMatch[1] : altMatch[2];
        if (altText) return `\n[Image: ${altText}]\n`;
      }
      return "";
    })
    // Replace inline SVG blocks with a short placeholder so the reader knows
    // an SVG diagram was present at that point in the slide.
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, "\n[SVG diagram]\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<(?:br|br\/)\s*>/gi, "\n")
    .replace(/<\/(?:p|div|section|article|blockquote|ul|ol|li|h4|h5|h6|dt|dd|th|td|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/</g, "");

  const paragraphs = [];
  for (const line of decodeHtmlEntities(normalized).split(/\n+/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith(ODP_H2_MARKER)) {
      paragraphs.push({ text: trimmed.slice(ODP_H2_MARKER.length).trim(), style: "PH2" });
    } else if (trimmed.startsWith(ODP_H3_MARKER)) {
      paragraphs.push({ text: trimmed.slice(ODP_H3_MARKER.length).trim(), style: "PH3" });
    } else {
      paragraphs.push({ text: trimmed, style: "PBody" });
    }
  }
  return paragraphs;
}

// CSS class fragments used to identify the left/right column sections in rendered HTML.
const LEFT_COLUMN_CLASS = "layout-columns__column--left";
const RIGHT_COLUMN_CLASS = "layout-columns__column--right";
const LEFT_COLUMN_RE = /<section[^>]*layout-columns__column--left[^>]*>([\s\S]*?)<\/section>/i;
const RIGHT_COLUMN_RE = /<section[^>]*layout-columns__column--right[^>]*>([\s\S]*?)<\/section>/i;
// Horizontal gap in centimetres between the two columns of a two-column slide.
const COLUMN_GAP_CM = 0.4;

/**
 * Find the `<div class="layout-columns">…</div>` wrapper in `html` by tracking
 * div nesting depth so that nested `<div>` elements inside the columns do not
 * cause a premature match.  Returns `{ pre, post }` HTML strings for the
 * content before and after the columns wrapper, or `null` when no wrapper is
 * found.
 */
function findColumnsBlock(html) {
  const openRe = /<div\b[^>]*\blayout-columns\b[^>]*>/i;
  const openMatch = openRe.exec(html);
  if (!openMatch) return null;

  let depth = 1;
  let pos = openMatch.index + openMatch[0].length;

  while (pos < html.length && depth > 0) {
    const sub = html.slice(pos);
    const openTag = /<div\b/i.exec(sub);
    const closeTag = /<\/div>/i.exec(sub);

    if (!closeTag) break;

    if (openTag && openTag.index < closeTag.index) {
      depth += 1;
      pos += openTag.index + openTag[0].length;
    } else {
      depth -= 1;
      if (depth === 0) {
        return {
          pre: html.slice(0, openMatch.index),
          post: html.slice(pos + closeTag.index + closeTag[0].length),
        };
      }
      pos += closeTag.index + closeTag[0].length;
    }
  }

  // Fallback: return everything before the opening tag; post is unknown.
  return { pre: html.slice(0, openMatch.index), post: "" };
}

/**
 * Return `{ left, right, pre, post }` arrays of `{ text, style }` objects when
 * the HTML contains a two-column `layout-columns` layout; returns `null`
 * otherwise.  `pre` / `post` contain paragraphs extracted from content that
 * appears before / after the columns wrapper so that H2 sub-headings and
 * trailing text are not silently discarded.
 */
function extractColumnsFromHtml(bodyHtml) {
  if (!bodyHtml.includes(LEFT_COLUMN_CLASS) && !bodyHtml.includes(RIGHT_COLUMN_CLASS)) {
    return null;
  }

  const leftMatch = LEFT_COLUMN_RE.exec(bodyHtml);
  const rightMatch = RIGHT_COLUMN_RE.exec(bodyHtml);

  if (!leftMatch && !rightMatch) return null;

  const outer = findColumnsBlock(bodyHtml);

  return {
    left: leftMatch ? htmlToOdpParagraphs(leftMatch[1]) : [],
    right: rightMatch ? htmlToOdpParagraphs(rightMatch[1]) : [],
    pre: outer ? htmlToOdpParagraphs(outer.pre) : [],
    post: outer ? htmlToOdpParagraphs(outer.post) : [],
  };
}

function getDeckPageSize(metadata = {}) {
  const width = Number(metadata.slideWidth) > 0 ? Number(metadata.slideWidth) : 1280;
  const height = Number(metadata.slideHeight) > 0 ? Number(metadata.slideHeight) : 720;
  const pageWidthCm = 28;
  const pageHeightCm = Number((pageWidthCm * (height / width)).toFixed(2));
  return {
    widthCm: pageWidthCm,
    heightCm: pageHeightCm,
  };
}

function buildOdpStylesXml(metadata = {}) {
  const { widthCm, heightCm } = getDeckPageSize(metadata);

  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
  xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"
  xmlns:number="urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0"
  xmlns:presentation="urn:oasis:names:tc:opendocument:xmlns:presentation:1.0"
  xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"
  office:version="1.2">
  <office:styles>
    <style:default-style style:family="graphic">
      <style:graphic-properties draw:stroke="none" draw:fill="none"/>
    </style:default-style>
    <style:default-style style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0cm" fo:margin-bottom="0.2cm"/>
      <style:text-properties fo:font-size="16pt"/>
    </style:default-style>
    <style:style style:name="dp1" style:family="drawing-page">
      <style:drawing-page-properties presentation:background-visible="true" presentation:background-objects-visible="true"/>
    </style:style>
  </office:styles>
  <office:automatic-styles>
    <style:page-layout style:name="PM1">
      <style:page-layout-properties fo:page-width="${widthCm}cm" fo:page-height="${heightCm}cm" style:print-orientation="landscape" presentation:display-header="false" presentation:display-footer="false" presentation:display-page-number="false" presentation:display-date-time="false"/>
    </style:page-layout>
    <style:presentation-page-layout style:name="AL1T0">
      <presentation:placeholder presentation:object="title" svg:x="1cm" svg:y="0.9cm" svg:width="${Number((widthCm - 2).toFixed(2))}cm" svg:height="2.8cm"/>
      <presentation:placeholder presentation:object="outline" svg:x="1cm" svg:y="4.2cm" svg:width="${Number((widthCm - 2).toFixed(2))}cm" svg:height="${Number((heightCm - 5.2).toFixed(2))}cm"/>
    </style:presentation-page-layout>
  </office:automatic-styles>
  <office:master-styles>
    <style:master-page style:name="Default" style:page-layout-name="PM1" draw:style-name="dp1" presentation:presentation-page-layout-name="AL1T0"/>
  </office:master-styles>
</office:document-styles>`;
}

function buildOdpContentXml({ title, renderedSlides, metadata = {} }) {
  const { widthCm, heightCm } = getDeckPageSize(metadata);
  const marginCm = 1;
  const titleX = marginCm;
  const titleY = 0.9;
  const titleHeight = 2.8;
  const titleWidth = Number((widthCm - 2 * marginCm).toFixed(2));
  const bodyX = marginCm;
  const bodyY = Number((titleY + titleHeight + 0.5).toFixed(2));
  const bodyWidth = titleWidth;
  const bodyHeight = Number((heightCm - bodyY - marginCm).toFixed(2));

  const pagesMarkup = renderedSlides
    .map((slide, index) => {
      let titleText;
      let bodyFramesXml;

      if (slide.kind === "title") {
        titleText = slide.title || `Slide ${index + 1}`;
        const paragraphs = [];
        if (slide.subtitle) paragraphs.push({ text: slide.subtitle, style: "PSubtitle" });
        if (slide.date) paragraphs.push({ text: `Date: ${slide.date}`, style: "PMeta" });
        if (slide.location) paragraphs.push({ text: `Location: ${slide.location}`, style: "PMeta" });
        if (slide.speakers) paragraphs.push({ text: `Speakers: ${slide.speakers}`, style: "PMeta" });
        const bodyXml = paragraphs.length
          ? paragraphs.map(({ text, style }) => `<text:p text:style-name="${style}">${escapeXml(text)}</text:p>`).join("")
          : '<text:p text:style-name="PMeta"></text:p>';
        bodyFramesXml = `
      <draw:frame draw:style-name="gr-body" presentation:class="outline" svg:x="${bodyX}cm" svg:y="${bodyY}cm" svg:width="${bodyWidth}cm" svg:height="${bodyHeight}cm">
        <draw:text-box>
          ${bodyXml}
        </draw:text-box>
      </draw:frame>`;
      } else if (slide.kind === "closing") {
        titleText = slide.title || `Slide ${index + 1}`;
        const paragraphs = [];
        if (slide.prompt) paragraphs.push({ text: slide.prompt, style: "PSubtitle" });
        if (slide.contactEmail) paragraphs.push({ text: `Email: ${slide.contactEmail}`, style: "PMeta" });
        if (slide.contactUrl) paragraphs.push({ text: `Website: ${stripProtocol(slide.contactUrl)}`, style: "PMeta" });
        if (slide.socialLinks) paragraphs.push({ text: `Social: ${slide.socialLinks}`, style: "PMeta" });
        if (slide.presentationUrl) paragraphs.push({ text: `Slides: ${stripProtocol(slide.presentationUrl)}`, style: "PMeta" });
        const bodyXml = paragraphs.length
          ? paragraphs.map(({ text, style }) => `<text:p text:style-name="${style}">${escapeXml(text)}</text:p>`).join("")
          : '<text:p text:style-name="PMeta"></text:p>';
        bodyFramesXml = `
      <draw:frame draw:style-name="gr-body" presentation:class="outline" svg:x="${bodyX}cm" svg:y="${bodyY}cm" svg:width="${bodyWidth}cm" svg:height="${bodyHeight}cm">
        <draw:text-box>
          ${bodyXml}
        </draw:text-box>
      </draw:frame>`;
      } else {
        titleText = slide.headings?.find((heading) => heading.level === 1)?.text || `Slide ${index + 1}`;
        const bodyHtml = slide.html.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, "");

        const columns = extractColumnsFromHtml(bodyHtml);
        if (columns) {
          // Two-column layout: place left and right content in side-by-side frames.
          // Content that appears before the columns wrapper (e.g. H2 sub-headings)
          // is prepended to the left column; content after the wrapper is appended
          // to the right column so that no text is silently discarded.
          const colWidth = Number(((bodyWidth - COLUMN_GAP_CM) / 2).toFixed(2));
          const rightColX = Number((bodyX + colWidth + COLUMN_GAP_CM).toFixed(2));

          const leftParas = [...columns.pre, ...columns.left];
          const rightParas = [...columns.right, ...columns.post];

          const leftXml = leftParas.length
            ? leftParas.map(({ text, style }) => `<text:p text:style-name="${style}">${escapeXml(text)}</text:p>`).join("")
            : '<text:p text:style-name="PBody"></text:p>';
          const rightXml = rightParas.length
            ? rightParas.map(({ text, style }) => `<text:p text:style-name="${style}">${escapeXml(text)}</text:p>`).join("")
            : '<text:p text:style-name="PBody"></text:p>';

          bodyFramesXml = `
      <draw:frame draw:style-name="gr-body" presentation:class="outline" svg:x="${bodyX}cm" svg:y="${bodyY}cm" svg:width="${colWidth}cm" svg:height="${bodyHeight}cm">
        <draw:text-box>
          ${leftXml}
        </draw:text-box>
      </draw:frame>
      <draw:frame draw:style-name="gr-body" presentation:class="outline" svg:x="${rightColX}cm" svg:y="${bodyY}cm" svg:width="${colWidth}cm" svg:height="${bodyHeight}cm">
        <draw:text-box>
          ${rightXml}
        </draw:text-box>
      </draw:frame>`;
        } else {
          const paragraphs = htmlToOdpParagraphs(bodyHtml);
          const bodyXml = paragraphs.length
            ? paragraphs.map(({ text, style }) => `<text:p text:style-name="${style}">${escapeXml(text)}</text:p>`).join("")
            : '<text:p text:style-name="PBody"></text:p>';
          bodyFramesXml = `
      <draw:frame draw:style-name="gr-body" presentation:class="outline" svg:x="${bodyX}cm" svg:y="${bodyY}cm" svg:width="${bodyWidth}cm" svg:height="${bodyHeight}cm">
        <draw:text-box>
          ${bodyXml}
        </draw:text-box>
      </draw:frame>`;
        }
      }

      const titleStyleName = slide.kind === "title" ? "PTitleLarge" : "PTitle";

      return `
    <draw:page draw:name="page${index + 1}" draw:style-name="dp1" draw:master-page-name="Default" presentation:presentation-page-layout-name="AL1T0">
      <draw:frame draw:style-name="gr-title" presentation:class="title" svg:x="${titleX}cm" svg:y="${titleY}cm" svg:width="${titleWidth}cm" svg:height="${titleHeight}cm">
        <draw:text-box>
          <text:p text:style-name="${titleStyleName}">${escapeXml(titleText)}</text:p>
        </draw:text-box>
      </draw:frame>
      ${bodyFramesXml}
    </draw:page>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
  xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"
  xmlns:number="urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0"
  xmlns:presentation="urn:oasis:names:tc:opendocument:xmlns:presentation:1.0"
  xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"
  office:version="1.2">
  <office:scripts/>
  <office:automatic-styles>
    <style:style style:name="gr-title" style:family="graphic">
      <style:graphic-properties draw:stroke="none" draw:fill="none" draw:auto-grow-height="true" draw:auto-grow-width="false"/>
    </style:style>
    <style:style style:name="gr-body" style:family="graphic">
      <style:graphic-properties draw:stroke="none" draw:fill="none" draw:auto-grow-height="true" draw:auto-grow-width="false"/>
    </style:style>
    <style:style style:name="PTitleLarge" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center" fo:margin-bottom="0.3cm"/>
      <style:text-properties fo:font-size="32pt" fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="PTitle" style:family="paragraph">
      <style:text-properties fo:font-size="28pt" fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="PSubtitle" style:family="paragraph">
      <style:paragraph-properties fo:margin-bottom="0.35cm"/>
      <style:text-properties fo:font-size="20pt" fo:font-style="italic"/>
    </style:style>
    <style:style style:name="PMeta" style:family="paragraph">
      <style:paragraph-properties fo:margin-bottom="0.2cm"/>
      <style:text-properties fo:font-size="16pt"/>
    </style:style>
    <style:style style:name="PH2" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.3cm" fo:margin-bottom="0.2cm"/>
      <style:text-properties fo:font-size="22pt" fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="PH3" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.2cm" fo:margin-bottom="0.15cm"/>
      <style:text-properties fo:font-size="19pt" fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="PBody" style:family="paragraph">
      <style:paragraph-properties fo:margin-bottom="0.22cm"/>
      <style:text-properties fo:font-size="18pt"/>
    </style:style>
  </office:automatic-styles>
  <office:body>
    <office:presentation>
      <presentation:settings presentation:show="true" presentation:pause="PT0S"/>
      ${pagesMarkup}
    </office:presentation>
  </office:body>
</office:document-content>`;
}

function buildOdpMetaXml(title) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-meta
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"
  office:version="1.2">
  <office:meta>
    <dc:title>${escapeXml(title)}</dc:title>
    <meta:generator>Markdown Slides Editor</meta:generator>
  </office:meta>
</office:document-meta>`;
}

function buildOdpSettingsXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-settings
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0"
  office:version="1.2">
  <office:settings>
    <config:config-item-set config:name="ooo:view-settings"/>
  </office:settings>
</office:document-settings>`;
}

function buildOdpManifestXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest
  xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0"
  manifest:version="1.2">
  <manifest:file-entry manifest:media-type="${ODP_MIMETYPE}" manifest:full-path="/"/>
  <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="content.xml"/>
  <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="meta.xml"/>
  <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="settings.xml"/>
  <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="styles.xml"/>
</manifest:manifest>`;
}

export function buildOdpPresentation({ title, renderedSlides, metadata }) {
  return buildZipArchive([
    { name: "mimetype", contents: ODP_MIMETYPE },
    { name: "content.xml", contents: buildOdpContentXml({ title, renderedSlides, metadata }) },
    { name: "meta.xml", contents: buildOdpMetaXml(title) },
    { name: "settings.xml", contents: buildOdpSettingsXml() },
    { name: "styles.xml", contents: buildOdpStylesXml(metadata) },
    { name: "META-INF/manifest.xml", contents: buildOdpManifestXml() },
  ]);
}

export function buildMhtmlDocument({ title, html }) {
  const boundary = `----=_NextPart_${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 10)}`;
  const encodedHtml = base64Encode(html);

  return [
    "From: <Saved by Markdown Slides Editor>",
    `Subject: ${title}`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/related; type=\"text/html\"; boundary=\"${boundary}\"`,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=\"utf-8\"",
    "Content-Transfer-Encoding: base64",
    "Content-Location: file:///index.html",
    "",
    encodedHtml,
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

export function buildExportBundle({ markdownSource, snapshotHtml, deckJson, odpBytes, onePageHtml, filePrefix }) {
  const prefix = filePrefix || "presentation";
  return buildZipArchive([
    { name: "deck.md", contents: markdownSource },
    { name: "deck.json", contents: deckJson },
    { name: `${prefix}.html`, contents: snapshotHtml },
    { name: `${prefix}.odp`, contents: odpBytes },
    { name: `${prefix}-one-page.html`, contents: onePageHtml },
  ]);
}


function buildOnePageSupportMarkup(slide) {
  const sections = [
    slide.notesHtml
      ? `<section class="one-page-support__card one-page-support__card--notes" aria-label="Speaker notes">
          <h2>Speaker notes</h2>
          <div class="one-page-support__content">${slide.notesHtml}</div>
        </section>`
      : "",
    slide.resourcesHtml
      ? `<section class="one-page-support__card one-page-support__card--references" aria-label="References and resources">
          <h2>References</h2>
          <div class="one-page-support__content">${slide.resourcesHtml}</div>
        </section>`
      : "",
    slide.scriptHtml
      ? `<section class="one-page-support__card one-page-support__card--script" aria-label="Presentation script">
          <h2>Script</h2>
          <div class="one-page-support__content">${slide.scriptHtml}</div>
        </section>`
      : "",
  ].filter(Boolean);

  if (!sections.length) {
    return "";
  }

  return `<div class="one-page-support" aria-label="Supporting material">${sections.join("")}</div>`;
}

export function buildOnePageHtml({ title, cssText, themeStylesheetCss, renderedSlides, metadata }) {
  const slidesMarkup = renderedSlides
    .map(
      (slide, index) => {
        const slideCardClass = getSlideCardClass(slide);
        return `
        <section class="one-page-slide-card" aria-label="Slide ${index + 1}">
          <header class="one-page-slide-card__header">
            <p class="one-page-slide-card__eyebrow">Slide ${index + 1}</p>
          </header>
          <article class="slide" data-slide-index="${index}" data-kind="${slide.kind || "content"}" aria-label="Slide ${index + 1}">
            <div class="slide__content">
              <article class="${slideCardClass}">
                <div class="slide-card__content">
                  ${slide.html}
                </div>
              </article>
            </div>
          </article>
          ${buildOnePageSupportMarkup(slide)}
        </section>`;
      },
    )
    .join("");

  const safeOnePageLang = escapeHtmlAttr(metadata.lang || "en");
  const safeOnePageTheme = escapeHtmlAttr(metadata.theme || "default-high-contrast");
  const safeOnePageDeckStyle = escapeHtmlAttr(buildDeckStyleAttribute(metadata));

  const presentationUrl = (metadata.presentationUrl || metadata.publishedUrl || "").trim();
  const safePresUrl = escapeHtmlAttr(presentationUrl);
  const footerHtml = presentationUrl
    ? `<footer class="one-page-footer">
      <p>Slides: <a href="${safePresUrl}">${safePresUrl}</a></p>
    </footer>`
    : "";

  return `<!doctype html>
<html lang="${safeOnePageLang}" data-theme="${safeOnePageTheme}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    ${buildThemeHeadTag(themeStylesheetCss, metadata)}
    <style>${escapeStyleText(cssText)}</style>
    <style>
      .one-page-body .slide {
        display: grid !important;
        visibility: visible !important;
      }
    </style>
  </head>
  <body class="snapshot-body one-page-body" style="${safeOnePageDeckStyle}">
    <nav class="snapshot-controls one-page-controls" aria-label="One-page view controls">
      <button type="button" data-action="save-html">Save HTML</button>
      <button type="button" data-action="print">Print / Save PDF</button>
      <fieldset class="one-page-controls__fieldset">
        <legend class="one-page-controls__legend">Slides per page</legend>
        <label class="one-page-controls__radio"><input type="radio" name="slides-per-page" value="1" checked> 1</label>
        <label class="one-page-controls__radio"><input type="radio" name="slides-per-page" value="4"> 4</label>
      </fieldset>
      <label class="one-page-controls__check"><input type="checkbox" id="one-page-show-notes" checked> Notes</label>
      <label class="one-page-controls__check"><input type="checkbox" id="one-page-show-references" checked> References</label>
    </nav>
    <main class="presentation-shell" aria-label="All slides and supporting material">
      ${slidesMarkup}
    </main>
    ${footerHtml}
    <script>
      async function renderMermaidBlocks(root = document) {
        const blocks = [...root.querySelectorAll(".mermaid:not([data-mermaid-rendered])")];
        if (!blocks.length) return;
        try {
          const module = await import("https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs");
          const mermaid = module.default || module;
          if (!window.__deckMermaidInitialized) {
            mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });
            window.__deckMermaidInitialized = true;
          }
          for (const block of blocks) {
            const source = block.textContent.trim();
            if (!source) continue;
            const result = await mermaid.render(block.dataset.mermaidId || \`mermaid-one-page-\${Date.now()}-\${Math.random().toString(16).slice(2)}\`, source);
            block.innerHTML = result.svg;
            block.dataset.mermaidRendered = "true";
          }
        } catch (error) {
          console.warn("Mermaid diagrams could not be rendered in the one-page view.", error);
        }
      }

      function saveHtmlDocument() {
        const html = "<!doctype html>\\n" + document.documentElement.outerHTML;
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "deck-one-page.html";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }

      function computeSlide4upScale() {
        const root = document.documentElement;
        const slideWidthPx = parseFloat(getComputedStyle(root).getPropertyValue("--slide-width-px").trim()) || 1280;
        const card = document.querySelector(".slide-card");
        if (!card) return;
        const containerWidth = card.clientWidth;
        if (containerWidth > 0) {
          root.style.setProperty("--slide-4up-scale", String(containerWidth / slideWidthPx));
        }
      }

      window.addEventListener("resize", () => {
        if (document.body.dataset.printLayout === "4up") computeSlide4upScale();
      });

      document.querySelector('[data-action="save-html"]')?.addEventListener("click", saveHtmlDocument);
      document.querySelector('[data-action="print"]')?.addEventListener("click", () => window.print());

      document.querySelectorAll('input[name="slides-per-page"]').forEach(function(radio) {
        radio.addEventListener("change", function() {
          if (this.value === "4") {
            document.body.dataset.printLayout = "4up";
            computeSlide4upScale();
          } else {
            delete document.body.dataset.printLayout;
          }
        });
      });

      document.getElementById("one-page-show-notes")?.addEventListener("change", function() {
        document.body.classList.toggle("hide-notes", !this.checked);
      });

      document.getElementById("one-page-show-references")?.addEventListener("change", function() {
        document.body.classList.toggle("hide-references", !this.checked);
      });

      renderMermaidBlocks();
    </script>
  </body>
</html>`;
}

export function buildSnapshotHtml({ title, cssText, themeStylesheetCss, renderedSlides, metadata, source }) {
  const slidesMarkup = renderedSlides
    .map(
      (slide, index) => {
        const slideCardClass = getSlideCardClass(slide);
        return `
        <section class="slide${index === 0 ? " is-active" : ""}" data-slide-index="${index}" data-step-count="${slide.stepCount || 0}" data-kind="${slide.kind || "content"}" aria-label="Slide ${index + 1}">
          <div class="slide__content">
            <article class="${slideCardClass}">
              <div class="slide-card__content">
                ${slide.html}
              </div>
            </article>
          </div>
        </section>`;
      },
    )
    .join("");

  const payload = escapeScriptText(
    JSON.stringify({
      metadata,
      source,
      slideCount: renderedSlides.length,
    }),
  );

  const safeSnapshotLang = escapeHtmlAttr(metadata.lang || "en");
  const safeSnapshotTheme = escapeHtmlAttr(metadata.theme || "default-high-contrast");
  const safeSnapshotDeckStyle = escapeHtmlAttr(buildDeckStyleAttribute(metadata));

  return `<!doctype html>
<html lang="${safeSnapshotLang}" data-theme="${safeSnapshotTheme}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    ${buildThemeHeadTag(themeStylesheetCss, metadata)}
    <style>${escapeStyleText(cssText)}</style>
    <style>
      .snapshot-viewer .slide__content {
        overflow: hidden;
      }
      .snapshot-viewer .slide {
        padding-bottom: 3rem;
      }
      .snapshot-viewer .slide-card {
        max-height: calc(100vh - 3rem);
        border-radius: 0;
      }
      @supports (height: 100dvh) {
        .snapshot-viewer .slide-card {
          max-height: calc(100dvh - 3rem);
          width: min(100%, calc((100dvh - 3rem) * var(--slide-aspect-ratio, 1.7778)));
        }
      }
      .snapshot-controls {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        margin: 0;
        padding: 0.5rem 1rem;
        background: color-mix(in srgb, var(--panel-strong, #1e1e2e) 90%, transparent);
        backdrop-filter: blur(8px);
        border-top: 1px solid var(--border, #333);
        z-index: 100;
      }
      /* Mobile portrait: let slide content flow at natural height */
      @media screen and (orientation: portrait) and (max-width: 1024px) {
        .snapshot-viewer .slide-card {
          max-height: none;
          width: 100%;
          aspect-ratio: auto;
          overflow: visible;
        }
        .snapshot-viewer .slide-card__content {
          height: auto;
          overflow: visible;
        }
        .snapshot-controls button {
          min-height: 44px;
          min-width: 44px;
          padding: 0.5rem 1.25rem;
        }
      }
      @media print {
        .snapshot-viewer .slide-card {
          max-height: none;
        }
      }
    </style>
  </head>
  <body class="snapshot-body snapshot-viewer" style="${safeSnapshotDeckStyle}">
    <main class="presentation-shell" aria-live="polite">
      ${slidesMarkup}
      <nav class="snapshot-controls" aria-label="Presentation controls">
        <button type="button" data-action="prev">Previous</button>
        <span id="snapshot-status">1 / ${renderedSlides.length}</span>
        <button type="button" data-action="next">Next</button>
      </nav>
    </main>
    <script id="deck-source" type="application/json">${payload}</script>
    <script>
      const slides = [...document.querySelectorAll(".slide")];
      const status = document.querySelector("#snapshot-status");
      let activeIndex = 0;
      let revealStep = 0;
      let mermaidRenderSequence = 0;

      async function renderMermaidBlocks(root = document) {
        const blocks = [...root.querySelectorAll(".mermaid:not([data-mermaid-rendered])")];
        if (!blocks.length) return;
        try {
          const module = await import("https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs");
          const mermaid = module.default || module;
          if (!window.__deckMermaidInitialized) {
            mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });
            window.__deckMermaidInitialized = true;
          }
          for (const block of blocks) {
            const source = block.textContent.trim();
            if (!source) continue;
            const fallbackId = \`mermaid-snapshot-\${mermaidRenderSequence += 1}\`;
            const result = await mermaid.render(block.dataset.mermaidId || fallbackId, source);
            block.innerHTML = result.svg;
            block.dataset.mermaidRendered = "true";
          }
        } catch (error) {
          console.warn("Mermaid diagrams could not be rendered in the snapshot view.", error);
        }
      }

      function contentOverflows(content) {
        return content.scrollHeight > content.clientHeight + 1 || content.scrollWidth > content.clientWidth + 1;
      }

      function calculateBodyScale(measure) {
        let scale = 1;
        let measurement = measure(scale);

        if (measurement.overflow) {
          while (scale > 0.72 && measurement.overflow) {
            scale = Math.max(0.72, Number((scale - 0.04).toFixed(2)));
            measurement = measure(scale);
          }
          return scale;
        }

        while (scale < 1.56 && measurement.fillRatio < 0.82) {
          const nextScale = Math.min(1.56, Number((scale + 0.04).toFixed(2)));
          const nextMeasurement = measure(nextScale);
          if (nextMeasurement.overflow) {
            break;
          }
          scale = nextScale;
          measurement = nextMeasurement;
        }

        return scale;
      }

      function prepareSlide(slide) {
        const content = slide.querySelector(".slide-card__content");
        if (!content || slide.dataset.kind === "title" || slide.dataset.kind === "closing" || content.querySelector(".layout-image-hero")) return;
        let body = content.querySelector(":scope > .slide-card__body");
        if (!body) {
          body = document.createElement("div");
          body.className = "slide-card__body";
          const children = [...content.children].filter((node) => node.tagName !== "H1");
          const anchor = content.querySelector(":scope > h1");
          content.insertBefore(body, anchor ? anchor.nextSibling : content.firstChild);
          children.forEach((child) => body.append(child));
        }
        const scale = calculateBodyScale((nextScale) => {
          body.style.setProperty("--slide-body-scale", nextScale);
          return {
            overflow: contentOverflows(content),
            fillRatio: content.scrollHeight / Math.max(1, content.clientHeight),
          };
        });
        body.style.setProperty("--slide-body-scale", scale);
      }

      function applyRevealState(slide) {
        const items = [...slide.querySelectorAll(".next")];
        items.forEach((item, index) => {
          const isVisible = index < revealStep;
          const isCurrent = index === revealStep - 1;
          item.hidden = !isVisible;
          item.classList.toggle("visited", index < revealStep - 1);
          item.classList.toggle("active", isCurrent);
        });
      }

      function render() {
        slides.forEach((slide, index) => {
          slide.classList.toggle("is-active", index === activeIndex);
          slide.hidden = index !== activeIndex;
          if (index === activeIndex) {
            prepareSlide(slide);
            applyRevealState(slide);
            renderMermaidBlocks(slide).then(() => prepareSlide(slide));
          }
        });
        status.textContent = \`\${activeIndex + 1} / \${slides.length} · \${revealStep} / \${Number(slides[activeIndex]?.dataset.stepCount || 0)} reveals\`;
      }

      function move(delta) {
        const stepCount = Number(slides[activeIndex]?.dataset.stepCount || 0);
        if (delta > 0 && revealStep < stepCount) {
          revealStep += 1;
        } else if (delta < 0 && revealStep > 0) {
          revealStep -= 1;
        } else {
          activeIndex = Math.max(0, Math.min(slides.length - 1, activeIndex + delta));
          revealStep = delta > 0 ? 0 : Number(slides[activeIndex]?.dataset.stepCount || 0);
        }
        render();
      }

      document.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") move(1);
        if (event.key === "ArrowLeft" || event.key === "PageUp") move(-1);
      });

      document.addEventListener("click", (event) => {
        const action = event.target.dataset.action;
        if (action === "prev") move(-1);
        if (action === "next") move(1);
      });

      let touchStartX = 0;
      let touchStartY = 0;
      const SWIPE_MIN_DISTANCE = 40;
      const SWIPE_DIRECTION_THRESHOLD = 1.5;
      document.addEventListener("touchstart", (event) => {
        touchStartX = event.changedTouches[0].clientX;
        touchStartY = event.changedTouches[0].clientY;
      }, { passive: true });
      document.addEventListener("touchend", (event) => {
        const dx = event.changedTouches[0].clientX - touchStartX;
        const dy = event.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) > Math.abs(dy) * SWIPE_DIRECTION_THRESHOLD && Math.abs(dx) > SWIPE_MIN_DISTANCE) {
          move(dx < 0 ? 1 : -1);
        }
      }, { passive: true });

      window.addEventListener("resize", render);

      render();
    </script>
  </body>
</html>`;
}

export function buildNotesExportHtml({ title, cssText, themeStylesheetCss, renderedSlides, metadata }) {
  const safeLang = escapeHtmlAttr(metadata.lang || "en");
  const safeTheme = escapeHtmlAttr(metadata.theme || "default-high-contrast");
  const safeDeckStyle = escapeHtmlAttr(buildDeckStyleAttribute(metadata));
  const safeTitle = escapeHtmlAttr(title);

  const slidesMarkup = renderedSlides
    .map((slide, index) => {
      const slideCardClass = getSlideCardClass(slide);
      const hasNotes = slide.notesHtml?.trim();
      const hasResources = slide.resourcesHtml?.trim();
      const hasScript = slide.scriptHtml?.trim();
      const hasSupplemental = hasNotes || hasResources || hasScript;

      const supplementalHtml = hasSupplemental
        ? `<div class="notes-export__supplemental">
            ${hasNotes ? `<div class="notes-export__notes"><h3>Notes</h3>${slide.notesHtml}</div>` : ""}
            ${hasResources ? `<div class="notes-export__resources"><h3>Resources</h3>${slide.resourcesHtml}</div>` : ""}
            ${hasScript ? `<div class="notes-export__script"><h3>Script</h3>${slide.scriptHtml}</div>` : ""}
          </div>`
        : "";

      return `
      <section class="notes-export__slide">
        <header class="notes-export__slide-header">
          <span class="notes-export__slide-number">Slide ${index + 1}</span>
        </header>
        <div class="notes-export__content">
          <article class="${slideCardClass} active">
            <div class="slide-card__content">
              ${slide.html}
            </div>
          </article>
        </div>
        ${supplementalHtml}
      </section>`;
    })
    .join("");

  return `<!doctype html>
<html lang="${safeLang}" data-theme="${safeTheme}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle} — Notes</title>
    ${buildThemeHeadTag(themeStylesheetCss, metadata)}
    <style>${escapeStyleText(cssText)}</style>
    <style>
      body {
        max-width: 72rem;
        margin: 0 auto;
        padding: 2rem;
        font-family: var(--font-body, sans-serif);
        background: var(--bg);
        color: var(--ink);
      }
      .notes-export__header {
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid var(--border, #ccc);
      }
      .notes-export__header h1 {
        margin: 0;
        font-family: var(--font-display, serif);
      }
      .notes-export__slide {
        margin-bottom: 3rem;
        padding-bottom: 2rem;
        border-bottom: 1px solid var(--border, #ccc);
      }
      .notes-export__slide:last-child {
        border-bottom: none;
      }
      .notes-export__slide-header {
        margin-bottom: 0.75rem;
      }
      .notes-export__slide-number {
        font-weight: 700;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--muted, #666);
      }
      .notes-export__content {
        margin-bottom: 1.5rem;
      }
      .notes-export__content .slide-card {
        max-width: 100%;
        aspect-ratio: var(--slide-aspect-ratio, 16/9);
        overflow: hidden;
        border: 1px solid var(--border, #ccc);
        border-radius: 6px;
      }
      .notes-export__supplemental {
        padding: 1rem 1.5rem;
        background: var(--panel, rgba(255,255,255,0.86));
        border-radius: 6px;
        border: 1px solid var(--border, #ccc);
      }
      .notes-export__supplemental h3 {
        margin: 0 0 0.5rem;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent, #b14d2c);
      }
      .notes-export__notes,
      .notes-export__resources,
      .notes-export__script {
        margin-bottom: 1rem;
      }
      .notes-export__notes:last-child,
      .notes-export__resources:last-child,
      .notes-export__script:last-child {
        margin-bottom: 0;
      }
      @media print {
        .notes-export__slide {
          break-inside: avoid;
          page-break-inside: avoid;
        }
      }
    </style>
  </head>
  <body style="${safeDeckStyle}">
    <header class="notes-export__header">
      <h1>${safeTitle}</h1>
      ${metadata.subtitle ? `<p>${escapeHtmlAttr(metadata.subtitle)}</p>` : ""}
    </header>
    <main>
      ${slidesMarkup}
    </main>
  </body>
</html>`;
}
