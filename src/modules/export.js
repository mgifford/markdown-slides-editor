import { buildDeckStyleAttribute, buildThemeLinkTag } from "./theme.js";

const textEncoder = new TextEncoder();

function escapeScriptText(value) {
  return value.replaceAll("</script>", "<\\/script>");
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

function encodeText(value) {
  return textEncoder.encode(value);
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
    const contentBytes = encodeText(file.contents);
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

export function buildExportBundle({ markdownSource, snapshotHtml, deckJson }) {
  return buildZipArchive([
    { name: "deck.md", contents: markdownSource },
    { name: "deck.json", contents: deckJson },
    { name: "presentation.html", contents: snapshotHtml },
  ]);
}

export function buildOnePageHtml({ title, cssText, renderedSlides, metadata }) {
  const slidesMarkup = renderedSlides
    .map(
      (slide, index) => `
        <section class="slide" data-slide-index="${index}" data-kind="${slide.kind || "content"}" aria-label="Slide ${index + 1}">
          <div class="slide__content">
            ${slide.html}
          </div>
        </section>`,
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
    <main class="presentation-shell" aria-label="All slides">
      ${slidesMarkup}
    </main>
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

      function contentOverflows(content) {
        return content.scrollHeight > content.clientHeight + 1 || content.scrollWidth > content.clientWidth + 1;
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
        let scale = 1;
        body.style.setProperty("--slide-body-scale", scale);
        while (scale > 0.72 && contentOverflows(content)) {
          scale = Math.max(0.72, Number((scale - 0.04).toFixed(2)));
          body.style.setProperty("--slide-body-scale", scale);
        }
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
