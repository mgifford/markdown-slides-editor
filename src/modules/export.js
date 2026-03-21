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

export function buildSnapshotHtml({ title, cssText, renderedSlides, metadata, source }) {
  const slidesMarkup = renderedSlides
    .map(
      (slide, index) => `
        <section class="slide${index === 0 ? " is-active" : ""}" data-slide-index="${index}" aria-label="Slide ${index + 1}">
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
    <style>${cssText}</style>
  </head>
  <body class="snapshot-body">
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

      function render() {
        slides.forEach((slide, index) => {
          slide.classList.toggle("is-active", index === activeIndex);
          slide.hidden = index !== activeIndex;
        });
        status.textContent = \`\${activeIndex + 1} / \${slides.length}\`;
      }

      function move(delta) {
        activeIndex = Math.max(0, Math.min(slides.length - 1, activeIndex + delta));
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

      render();
    </script>
  </body>
</html>`;
}
