import { buildSnapshotHtml, downloadFile } from "../export.js";
import { createSyncChannel } from "../sync.js";
import { compileSource, createButton, createDeckFrame, mountSlideInto } from "./shared.js";

async function readCss() {
  const response = await fetch(new URL("../../styles/app.css", import.meta.url));
  return response.text();
}

function createIssuesMarkup(issues) {
  if (issues.length === 0) {
    return `<li class="issue issue--ok">No accessibility issues detected.</li>`;
  }

  return issues
    .map(
      (issue) => `<li class="issue issue--${issue.level}">
        <strong>${issue.level.toUpperCase()}</strong>
        <span>${issue.message}</span>
      </li>`,
    )
    .join("");
}

export function createAppView(root, { initialSource, onSourceChange }) {
  let source = initialSource;
  let activeSlideIndex = 0;
  let lastCompiled = null;
  const sync = createSyncChannel();
  const frame = createDeckFrame("Editor");

  frame.innerHTML += `
    <main class="editor-layout">
      <section class="panel panel--editor">
        <label class="panel__label" for="source-editor">Markdown source</label>
        <textarea id="source-editor" class="editor" spellcheck="false"></textarea>
      </section>
      <section class="panel panel--preview" aria-live="polite">
        <div class="preview-header">
          <div>
            <p class="panel__label">Live preview</p>
            <p id="deck-meta" class="meta-text"></p>
          </div>
          <div class="preview-header__actions">
            <button type="button" id="prev-slide">Previous</button>
            <button type="button" id="next-slide">Next</button>
          </div>
        </div>
        <div id="preview-frame" class="preview-frame"></div>
        <aside class="notes-panel">
          <p class="panel__label">Speaker notes</p>
          <div id="notes-preview" class="notes-content"></div>
        </aside>
      </section>
    </main>
    <section class="lint-panel">
      <div class="lint-panel__header">
        <div>
          <p class="panel__label">Accessibility check</p>
          <p class="meta-text">Editor linting for slide structure, links, image alt text, and note coverage.</p>
        </div>
        <button type="button" id="run-a11y-check">Run Accessibility Check</button>
        <ul id="lint-summary" class="lint-summary"></ul>
      </div>
      <ul id="lint-issues" class="issues-list"></ul>
    </section>
  `;

  root.replaceChildren(frame);

  const actions = frame.querySelector(".topbar__actions");
  const editor = frame.querySelector("#source-editor");
  const previewFrame = frame.querySelector("#preview-frame");
  const notesPreview = frame.querySelector("#notes-preview");
  const lintIssues = frame.querySelector("#lint-issues");
  const lintSummary = frame.querySelector("#lint-summary");
  const deckMeta = frame.querySelector("#deck-meta");
  const runA11yCheckButton = frame.querySelector("#run-a11y-check");

  const importInput = document.createElement("input");
  importInput.type = "file";
  importInput.accept = ".md,.json,text/markdown,application/json";
  importInput.hidden = true;

  const presentButton = createButton("Audience View");
  const presenterButton = createButton("Presenter View");
  const exportSourceButton = createButton("Export Source");
  const exportJsonButton = createButton("Export JSON");
  const exportSnapshotButton = createButton("Export Snapshot");
  const importButton = createButton("Import Source");

  actions.append(
    presentButton,
    presenterButton,
    importButton,
    exportSourceButton,
    exportJsonButton,
    exportSnapshotButton,
    importInput,
  );

  function updateSummary(issues) {
    const counts = { error: 0, warning: 0, info: 0 };
    for (const issue of issues) {
      counts[issue.level] += 1;
    }

    lintSummary.innerHTML = `
      <li>${counts.error} errors</li>
      <li>${counts.warning} warnings</li>
      <li>${counts.info} info</li>
    `;
  }

  function publishState(compiled) {
    sync.postMessage({
      type: "deck-updated",
      source,
      activeSlideIndex,
      timestamp: Date.now(),
    });

    const slide = compiled.renderedSlides[activeSlideIndex] || compiled.renderedSlides[0];
    activeSlideIndex = slide?.index || 0;
    deckMeta.textContent = compiled.renderedSlides.length
      ? `${compiled.metadata.title || "Untitled deck"} · Slide ${activeSlideIndex + 1} of ${compiled.renderedSlides.length}`
      : `${compiled.metadata.title || "Untitled deck"} · No slides`;
    mountSlideInto(previewFrame, slide);
    notesPreview.innerHTML = slide?.notesHtml || "<p>No speaker notes for this slide.</p>";
    lintIssues.innerHTML = createIssuesMarkup(compiled.issues);
    updateSummary(compiled.issues);
  }

  function render() {
    lastCompiled = compileSource(source);
    publishState(lastCompiled);
  }

  editor.value = source;
  render();

  editor.addEventListener("input", () => {
    source = editor.value;
    onSourceChange(source);
    render();
  });

  frame.querySelector("#prev-slide").addEventListener("click", () => {
    activeSlideIndex = Math.max(0, activeSlideIndex - 1);
    render();
  });

  frame.querySelector("#next-slide").addEventListener("click", () => {
    const compiled = compileSource(source);
    activeSlideIndex = Math.min(compiled.renderedSlides.length - 1, activeSlideIndex + 1);
    publishState(compiled);
  });

  presentButton.addEventListener("click", () => {
    window.open("./present", "_blank", "noopener,noreferrer");
  });

  presenterButton.addEventListener("click", () => {
    window.open("./presenter", "_blank", "noopener,noreferrer");
  });

  exportSourceButton.addEventListener("click", () => {
    downloadFile("deck.md", source, "text/markdown;charset=utf-8");
  });

  exportJsonButton.addEventListener("click", () => {
    downloadFile(
      "deck.json",
      JSON.stringify(
        {
          metadata: lastCompiled?.metadata || {},
          slides: lastCompiled?.slides || [],
          source,
        },
        null,
        2,
      ),
      "application/json;charset=utf-8",
    );
  });

  exportSnapshotButton.addEventListener("click", async () => {
    const cssText = await readCss();
    const html = buildSnapshotHtml({
      title: lastCompiled?.metadata.title || "Slide deck snapshot",
      cssText,
      renderedSlides: lastCompiled?.renderedSlides || [],
      metadata: lastCompiled?.metadata || {},
      source,
    });
    downloadFile("deck-snapshot.html", html, "text/html;charset=utf-8");
  });

  importButton.addEventListener("click", () => importInput.click());

  importInput.addEventListener("change", async () => {
    const file = importInput.files?.[0];
    if (!file) return;
    const text = await file.text();
    if (file.name.endsWith(".json")) {
      const parsed = JSON.parse(text);
      source = parsed.source || source;
    } else {
      source = text;
    }
    editor.value = source;
    onSourceChange(source);
    render();
  });

  runA11yCheckButton.addEventListener("click", () => {
    lastCompiled = compileSource(source);
    lintIssues.innerHTML = createIssuesMarkup(lastCompiled.issues);
    updateSummary(lastCompiled.issues);
  });
}
