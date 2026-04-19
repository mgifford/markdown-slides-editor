import { buildDeckStyleAttribute, buildThemeLinkTag } from "./theme.js";

const textEncoder = new TextEncoder();
const ODP_MIMETYPE = "application/vnd.oasis.opendocument.presentation";

function escapeScriptText(value) {
  return value.replaceAll("</script>", "<\\/script>");
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
      .replace(/<\/(?:p|div|section|article|blockquote|ul|ol|li|h1|h2|h3|h4|h5|h6)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
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
  const titleWidth = Number((widthCm - 2).toFixed(2));
  const bodyWidth = titleWidth;
  const bodyHeight = Number((heightCm - 5.2).toFixed(2));

  const pagesMarkup = renderedSlides
    .map((slide, index) => {
      const titleText = slide.headings?.find((heading) => heading.level === 1)?.text || `Slide ${index + 1}`;
      const bodyHtml = slide.html.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, "");
      const bodyLines = htmlToTextLines(bodyHtml);
      const bodyParagraphs = bodyLines.length
        ? bodyLines.map((line) => `<text:p text:style-name="PBody">${escapeXml(line)}</text:p>`).join("")
        : '<text:p text:style-name="PBody"></text:p>';

      return `
    <draw:page draw:name="page${index + 1}" draw:style-name="dp1" draw:master-page-name="Default" presentation:presentation-page-layout-name="AL1T0">
      <draw:frame draw:style-name="gr-title" presentation:class="title" svg:x="1cm" svg:y="0.9cm" svg:width="${titleWidth}cm" svg:height="2.8cm">
        <draw:text-box>
          <text:p text:style-name="PTitle">${escapeXml(titleText)}</text:p>
        </draw:text-box>
      </draw:frame>
      <draw:frame draw:style-name="gr-body" presentation:class="outline" svg:x="1cm" svg:y="4.2cm" svg:width="${bodyWidth}cm" svg:height="${bodyHeight}cm">
        <draw:text-box>
          ${bodyParagraphs}
        </draw:text-box>
      </draw:frame>
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
    <style:style style:name="PTitle" style:family="paragraph">
      <style:text-properties fo:font-size="24pt" fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="PBody" style:family="paragraph">
      <style:paragraph-properties fo:margin-bottom="0.22cm"/>
      <style:text-properties fo:font-size="16pt"/>
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

export function buildExportBundle({ markdownSource, snapshotHtml, deckJson, odpBytes, onePageMhtml, offlineMhtml }) {
  return buildZipArchive([
    { name: "deck.md", contents: markdownSource },
    { name: "deck.json", contents: deckJson },
    { name: "presentation.html", contents: snapshotHtml },
    { name: "presentation.odp", contents: odpBytes },
    { name: "presentation-one-page.mhtml", contents: onePageMhtml },
    ...(offlineMhtml ? [{ name: "presentation-offline.mhtml", contents: offlineMhtml }] : []),
  ]);
}

function buildAudienceScriptText() {
  return `(function() {
  var data = JSON.parse(document.getElementById('deck-payload').textContent);
  var slides = data.slides;
  var activeIndex = 0;
  var rs = 0;
  var frame = document.getElementById('audience-frame');
  function applyRevealState(container, step) {
    var items = Array.from(container.querySelectorAll('li.next'));
    items.forEach(function(item, i) {
      item.hidden = i >= step;
      item.classList.toggle('visited', i < step - 1);
      item.classList.toggle('active', i === step - 1);
    });
  }
  function mountSlide(container, slide, step) {
    if (!slide) {
      container.innerHTML = '<article class="slide-card empty-state"><div class="slide-card__content"><p>No slide</p></div></article>';
      return;
    }
    var cls = (slide.kind === 'title' || slide.kind === 'closing') ? 'slide-card slide-card--title' : 'slide-card';
    container.innerHTML = '<article class="' + cls + '"><div class="slide-card__content">' + slide.html + '</div></article>';
    applyRevealState(container, step);
  }
  function render() {
    mountSlide(frame, slides[activeIndex], rs);
    document.title = data.title + ' \u2013 Audience (' + (activeIndex + 1) + '/' + slides.length + ')';
  }
  function notifyPresenter() {
    if (window.opener) {
      try { window.opener.postMessage({ type: 'audience-navigate', slideIndex: activeIndex, revealStep: rs }, '*'); } catch(e) {}
    }
  }
  function move(delta) {
    var slide = slides[activeIndex];
    var stepCount = slide ? slide.stepCount : 0;
    if (delta > 0 && rs < stepCount) { rs++; }
    else if (delta < 0 && rs > 0) { rs--; }
    else {
      activeIndex = Math.max(0, Math.min(slides.length - 1, activeIndex + delta));
      rs = delta > 0 ? 0 : (slides[activeIndex] ? slides[activeIndex].stepCount : 0);
    }
    render();
    notifyPresenter();
  }
  window.addEventListener('message', function(event) {
    if (!event.data) return;
    if (event.data.type === 'slide-changed') {
      activeIndex = event.data.slideIndex || 0;
      rs = event.data.revealStep || 0;
      render();
    }
  });
  document.addEventListener('keydown', function(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') { event.preventDefault(); move(1); }
    if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); move(-1); }
    if (event.key === 'Home') { activeIndex = 0; rs = 0; render(); notifyPresenter(); }
    if (event.key === 'End') {
      activeIndex = Math.max(0, slides.length - 1);
      rs = slides[activeIndex] ? slides[activeIndex].stepCount : 0;
      render(); notifyPresenter();
    }
  });
  if (window.opener) {
    try { window.opener.postMessage({ type: 'audience-ready' }, '*'); } catch(e) {}
  }
  render();
})();`;
}

export function buildOfflinePresentationHtml({ title, cssText, themeStylesheetCss, renderedSlides, metadata }) {
  const theme = metadata.theme || "default-high-contrast";
  const lang = metadata.lang || "en";
  const deckStyleAttr = buildDeckStyleAttribute(metadata);
  const duration = Number.parseInt(metadata.durationMinutes, 10) > 0
    ? Number.parseInt(metadata.durationMinutes, 10)
    : 30;

  const slidesForPayload = renderedSlides.map((slide, index) => ({
    index,
    html: slide.html || "",
    notesHtml: slide.notesHtml || "",
    scriptHtml: slide.scriptHtml || "",
    resourcesHtml: slide.resourcesHtml || "",
    stepCount: slide.stepCount || 0,
    kind: slide.kind || "content",
  }));

  const payload = escapeScriptText(
    JSON.stringify({
      title,
      theme,
      lang,
      deckStyleAttr,
      duration,
      slides: slidesForPayload,
    }),
  );

  const allCss = cssText + (themeStylesheetCss ? "\n" + themeStylesheetCss : "");

  const slideCount = renderedSlides.length;
  const timerMinutes = String(Math.floor(duration)).padStart(2, "0");
  const timerSeconds = "00";
  const initialTimer = `${timerMinutes}:${timerSeconds}`;

  const escapedAudienceScript = escapeScriptText(buildAudienceScriptText());

  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} \u2013 Offline Presentation</title>
    <style id="offline-app-styles">${allCss}</style>
    <style>
      .offline-presenter-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr auto;
        gap: 0.75rem;
        padding: 0.75rem;
        height: calc(100vh - var(--topbar-height, 3.5rem));
        box-sizing: border-box;
        overflow: hidden;
      }
      .offline-panel {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid var(--color-border, #555);
        border-radius: 0.375rem;
        padding: 0.5rem;
      }
      .offline-panel .preview-frame {
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }
      .offline-panel--notes {
        grid-column: 1 / -1;
        max-height: 14rem;
        overflow-y: auto;
      }
    </style>
  </head>
  <body class="snapshot-body" data-theme="${theme}" style="${deckStyleAttr}">
    <header class="topbar">
      <div>
        <p class="eyebrow">Offline Presentation</p>
        <h1>${title}</h1>
      </div>
      <div class="topbar__actions">
        <button type="button" id="open-audience-btn">Open Audience Window</button>
        <button type="button" id="prev-btn" aria-label="Previous slide">\u2039</button>
        <span id="slide-counter" class="meta-text" aria-live="polite">1 / ${slideCount}</span>
        <button type="button" id="next-btn" aria-label="Next slide">\u203a</button>
        <span id="timer-display" class="timer">${initialTimer}</span>
        <button type="button" id="start-pause-btn">Start</button>
        <button type="button" id="reset-timer-btn">Reset</button>
      </div>
    </header>
    <main class="offline-presenter-layout">
      <section class="offline-panel offline-panel--current" aria-label="Current slide">
        <p class="panel__label">Current slide</p>
        <div id="current-slide-frame" class="preview-frame preview-frame--compact"></div>
      </section>
      <section class="offline-panel offline-panel--next" aria-label="Next slide">
        <p class="panel__label">Next slide</p>
        <div id="next-slide-frame" class="preview-frame preview-frame--compact"></div>
      </section>
      <section class="offline-panel offline-panel--notes" aria-label="Presenter support">
        <p class="panel__label">Presenter support</p>
        <div id="presenter-notes" class="notes-content"></div>
      </section>
    </main>
    <script id="deck-payload" type="application/json">${payload}</script>
    <script id="offline-audience-script" type="text/plain">${escapedAudienceScript}</script>
    <script>
(function() {
  var data = JSON.parse(document.getElementById('deck-payload').textContent);
  var slides = data.slides;
  var activeSlideIndex = 0;
  var revealStep = 0;
  var audienceWindow = null;
  var timerSeconds = data.duration * 60;
  var timerRunning = false;
  var timerStarted = false;
  var timerInterval = null;
  var currentFrame = document.getElementById('current-slide-frame');
  var nextFrame = document.getElementById('next-slide-frame');
  var notesEl = document.getElementById('presenter-notes');
  var slideCounter = document.getElementById('slide-counter');
  var timerDisplay = document.getElementById('timer-display');
  var startPauseBtn = document.getElementById('start-pause-btn');

  function applyRevealState(container, step) {
    var items = Array.from(container.querySelectorAll('li.next'));
    items.forEach(function(item, i) {
      item.hidden = i >= step;
      item.classList.toggle('visited', i < step - 1);
      item.classList.toggle('active', i === step - 1);
    });
  }

  function mountSlide(container, slide, step) {
    if (!slide) {
      container.innerHTML = '<article class="slide-card empty-state"><div class="slide-card__content"><p>No slide</p></div></article>';
      return;
    }
    var cls = (slide.kind === 'title' || slide.kind === 'closing') ? 'slide-card slide-card--title' : 'slide-card';
    container.innerHTML = '<article class="' + cls + '"><div class="slide-card__content">' + slide.html + '</div></article>';
    applyRevealState(container, step);
  }

  function buildSupplementalHtml(slide) {
    if (!slide) return '<p>No presenter support for this slide.</p>';
    var parts = [];
    if (slide.notesHtml) parts.push('<section class="support-section"><h2>Notes</h2>' + slide.notesHtml + '</section>');
    if (slide.resourcesHtml) parts.push('<section class="support-section"><h2>Resources</h2>' + slide.resourcesHtml + '</section>');
    if (slide.scriptHtml) parts.push('<section class="support-section"><h2>Script</h2>' + slide.scriptHtml + '</section>');
    return parts.join('') || '<p>No presenter support for this slide.</p>';
  }

  function renderPresenter() {
    mountSlide(currentFrame, slides[activeSlideIndex], revealStep);
    var nextSlide = slides[activeSlideIndex + 1] || null;
    if (nextSlide) {
      mountSlide(nextFrame, nextSlide, 0);
    } else {
      nextFrame.innerHTML = '<article class="slide-card empty-state"><div class="slide-card__content"><p>No next slide.</p></div></article>';
    }
    notesEl.innerHTML = buildSupplementalHtml(slides[activeSlideIndex]);
    slideCounter.textContent = (activeSlideIndex + 1) + ' / ' + slides.length;
    publishState();
  }

  function move(delta) {
    var prevIndex = activeSlideIndex;
    var slide = slides[activeSlideIndex];
    var stepCount = slide ? slide.stepCount : 0;
    if (delta > 0 && revealStep < stepCount) {
      revealStep++;
    } else if (delta < 0 && revealStep > 0) {
      revealStep--;
    } else {
      activeSlideIndex = Math.max(0, Math.min(slides.length - 1, activeSlideIndex + delta));
      revealStep = delta > 0 ? 0 : (slides[activeSlideIndex] ? slides[activeSlideIndex].stepCount : 0);
    }
    if (!timerStarted && prevIndex === 0 && activeSlideIndex > 0) {
      startTimer();
    }
    renderPresenter();
  }

  function publishState() {
    if (audienceWindow && !audienceWindow.closed) {
      try {
        audienceWindow.postMessage({ type: 'slide-changed', slideIndex: activeSlideIndex, revealStep: revealStep }, '*');
      } catch(e) {}
    }
  }

  function formatTime(s) {
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(timerSeconds);
    var totalSecs = data.duration * 60;
    var progress = totalSecs > 0 ? timerSeconds / totalSecs : 1;
    timerDisplay.className = 'timer' + (progress <= 0.1 ? ' timer--danger' : progress <= 0.25 ? ' timer--caution' : '');
  }

  function startTimer() {
    if (timerRunning) return;
    timerRunning = true;
    timerStarted = true;
    startPauseBtn.textContent = 'Pause';
    timerInterval = setInterval(function() {
      if (timerSeconds > 0) {
        timerSeconds--;
        updateTimerDisplay();
      } else {
        timerRunning = false;
        clearInterval(timerInterval);
        startPauseBtn.textContent = 'Start';
      }
    }, 1000);
  }

  function pauseTimer() {
    timerRunning = false;
    clearInterval(timerInterval);
    startPauseBtn.textContent = 'Start';
  }

  function escapeHtml(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function buildAudienceHtml() {
    var css = document.getElementById('offline-app-styles').textContent;
    var payloadJson = document.getElementById('deck-payload').textContent;
    var audienceScript = document.getElementById('offline-audience-script').textContent;
    var endScript = '<' + '/script>';
    var h = [
      '<!doctype html>',
      '<html lang="' + escapeHtml(data.lang) + '">',
      '<head>',
      '<meta charset="UTF-8"/>',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0"/>',
      '<title>' + escapeHtml(data.title) + ' \u2013 Audience View</title>',
      '<style>' + css + '</style>',
      '<style>html,body{margin:0;padding:0;}.presentation-frame{position:fixed;inset:0;}</style>',
      '</head>',
      '<body class="snapshot-body" data-theme="' + escapeHtml(data.theme) + '" style="' + escapeHtml(data.deckStyleAttr) + '">',
      '<main class="presentation-layout">',
      '<p id="presentation-status" class="sr-only" aria-live="polite"></p>',
      '<div id="audience-frame" class="presentation-frame"></div>',
      '</main>',
      '<script id="deck-payload" type="application/json">' + payloadJson + endScript,
      '<script>' + audienceScript + endScript,
      '</body>',
      '</html>',
    ];
    return h.join('\n');
  }

  function openAudienceWindow() {
    var AUDIENCE_BLOB_URL_REVOKE_DELAY_MS = 60000;
    var html = buildAudienceHtml();
    var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    audienceWindow = window.open(url, 'offline-audience-window');
    setTimeout(function() { URL.revokeObjectURL(url); }, AUDIENCE_BLOB_URL_REVOKE_DELAY_MS);
  }

  document.getElementById('prev-btn').addEventListener('click', function() { move(-1); });
  document.getElementById('next-btn').addEventListener('click', function() { move(1); });
  document.getElementById('start-pause-btn').addEventListener('click', function() {
    if (timerRunning) { pauseTimer(); } else { startTimer(); }
  });
  document.getElementById('reset-timer-btn').addEventListener('click', function() {
    pauseTimer();
    timerStarted = false;
    timerSeconds = data.duration * 60;
    updateTimerDisplay();
  });
  document.getElementById('open-audience-btn').addEventListener('click', function() {
    if (audienceWindow && !audienceWindow.closed) {
      audienceWindow.focus();
      publishState();
    } else {
      openAudienceWindow();
    }
  });

  document.addEventListener('keydown', function(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') { event.preventDefault(); move(1); }
    if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); move(-1); }
    if (event.key === 'Home') { activeSlideIndex = 0; revealStep = 0; renderPresenter(); }
    if (event.key === 'End') {
      activeSlideIndex = Math.max(0, slides.length - 1);
      revealStep = slides[activeSlideIndex] ? slides[activeSlideIndex].stepCount : 0;
      renderPresenter();
    }
  });

  window.addEventListener('message', function(event) {
    if (!event.data) return;
    if (event.data.type === 'audience-navigate') {
      activeSlideIndex = event.data.slideIndex || 0;
      revealStep = event.data.revealStep || 0;
      renderPresenter();
    }
    if (event.data.type === 'audience-ready') {
      publishState();
    }
  });

  renderPresenter();
  updateTimerDisplay();
})();
    </script>
  </body>
</html>`;
}

function buildOnePageSupportMarkup(slide) {
  const sections = [
    slide.notesHtml
      ? `<section class="one-page-support__card" aria-label="Speaker notes">
          <h2>Speaker notes</h2>
          <div class="one-page-support__content">${slide.notesHtml}</div>
        </section>`
      : "",
    slide.resourcesHtml
      ? `<section class="one-page-support__card" aria-label="References and resources">
          <h2>References</h2>
          <div class="one-page-support__content">${slide.resourcesHtml}</div>
        </section>`
      : "",
    slide.scriptHtml
      ? `<section class="one-page-support__card" aria-label="Presentation script">
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

export function buildOnePageHtml({ title, cssText, renderedSlides, metadata }) {
  const slidesMarkup = renderedSlides
    .map(
      (slide, index) => {
        const slideCardClass = slide.kind === "title" || slide.kind === "closing"
          ? "slide-card slide-card--title"
          : "slide-card";
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

  return `<!doctype html>
<html lang="${metadata.lang || "en"}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    ${buildThemeLinkTag(metadata)}
    <style>${cssText}</style>
    <style>
      .one-page-body .slide {
        display: grid !important;
        visibility: visible !important;
      }
    </style>
  </head>
  <body class="snapshot-body one-page-body" data-theme="${metadata.theme || "default-high-contrast"}" style="${buildDeckStyleAttribute(metadata)}">
    <nav class="snapshot-controls one-page-controls" aria-label="One-page view controls">
      <button type="button" data-action="save-html">Save HTML</button>
      <button type="button" data-action="print">Print / Save PDF</button>
    </nav>
    <main class="presentation-shell" aria-label="All slides and supporting material">
      ${slidesMarkup}
    </main>
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

      document.querySelector('[data-action="save-html"]')?.addEventListener("click", saveHtmlDocument);
      document.querySelector('[data-action="print"]')?.addEventListener("click", () => window.print());
      renderMermaidBlocks();
    </script>
  </body>
</html>`;
}

export function buildSnapshotHtml({ title, cssText, renderedSlides, metadata, source }) {
  const slidesMarkup = renderedSlides
    .map(
      (slide, index) => `
        <section class="slide${index === 0 ? " is-active" : ""}" data-slide-index="${index}" data-step-count="${slide.stepCount || 0}" data-kind="${slide.kind || "content"}" aria-label="Slide ${index + 1}">
          <div class="slide__content">
            ${slide.html}
          </div>
        </section>`,
    )
    .join("");

  const payload = escapeScriptText(
    JSON.stringify({
      metadata,
      source,
      slideCount: renderedSlides.length,
    }),
  );

  return `<!doctype html>
<html lang="${metadata.lang || "en"}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    ${buildThemeLinkTag(metadata)}
    <style>${cssText}</style>
  </head>
  <body class="snapshot-body" data-theme="${metadata.theme || "default-high-contrast"}" style="${buildDeckStyleAttribute(metadata)}">
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
        const content = slide.querySelector(".slide__content");
        if (!content || slide.dataset.kind === "title" || slide.dataset.kind === "closing") return;
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
        const items = [...slide.querySelectorAll("li.next")];
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

      window.addEventListener("resize", render);

      render();
    </script>
  </body>
</html>`;
}
