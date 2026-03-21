import { buildSnapshotHtml, downloadFile } from "../export.js";
import { runSa11y } from "../sa11y.js";
import { updateFrontMatterValue, removeFrontMatterValue } from "../source-format.js";
import { createSyncChannel } from "../sync.js";
import { getSlideTitle } from "../presentation-state.js";
import { applyDeckTheme, BUILT_IN_THEMES } from "../theme.js";
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
            <label class="theme-control">
              <span>Theme</span>
              <select id="theme-select"></select>
            </label>
            <label class="theme-control theme-control--wide">
              <span>External CSS</span>
              <input id="theme-stylesheet-input" type="url" placeholder="https://example.com/theme.css" />
            </label>
            <button type="button" id="prev-slide">Previous</button>
            <button type="button" id="next-slide">Next</button>
          </div>
        </div>
        <div class="preview-layout">
          <div id="preview-frame" class="preview-frame"></div>
          <aside class="outline-panel">
            <p class="panel__label">Slide outline</p>
            <ol id="slide-outline" class="outline-list"></ol>
          </aside>
        </div>
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
        <div class="lint-panel__actions">
          <button type="button" id="run-a11y-check">Run Accessibility Check</button>
          <button type="button" id="run-sa11y-check">Run Sa11y</button>
        </div>
        <ul id="lint-summary" class="lint-summary"></ul>
      </div>
      <div class="resource-links" aria-label="Accessibility resources">
        <a href="https://intopia.digital/articles/how-to-create-more-accessible-presentations/" target="_blank" rel="noreferrer">Intopia presentation guidance</a>
        <a href="https://inklusiv.ca/" target="_blank" rel="noreferrer">Inklusiv</a>
        <a href="https://www.w3.org/WAI/presentations/" target="_blank" rel="noreferrer">WAI presentations</a>
        <a href="https://sa11y.netlify.app/bookmarklet/" target="_blank" rel="noreferrer">Sa11y bookmarklet</a>
      </div>
      <p id="sa11y-status" class="meta-text"></p>
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
  const runSa11yCheckButton = frame.querySelector("#run-sa11y-check");
  const sa11yStatus = frame.querySelector("#sa11y-status");
  const outlineNode = frame.querySelector("#slide-outline");
  const themeSelect = frame.querySelector("#theme-select");
  const themeStylesheetInput = frame.querySelector("#theme-stylesheet-input");

  const importInput = document.createElement("input");
  importInput.type = "file";
  importInput.accept = ".md,.json,text/markdown,application/json";
  importInput.hidden = true;

  const presentButton = createButton("Audience View");
  const presenterButton = createButton("Presenter View");
  const helpButton = createButton("Help");
  const exportSourceButton = createButton("Export Source");
  const exportJsonButton = createButton("Export JSON");
  const exportSnapshotButton = createButton("Export Snapshot");
  const importButton = createButton("Import Source");

  actions.append(
    presentButton,
    presenterButton,
    helpButton,
    importButton,
    exportSourceButton,
    exportJsonButton,
    exportSnapshotButton,
    importInput,
  );

  const helpDialog = document.createElement("dialog");
  helpDialog.className = "help-dialog";
  helpDialog.innerHTML = `
    <form method="dialog" class="help-dialog__inner">
      <div class="help-dialog__header">
        <div>
          <p class="panel__label">How this editor works</p>
          <h2>Editing, saving, and exporting</h2>
        </div>
        <button type="submit">Close</button>
      </div>
      <div class="help-dialog__content">
        <p>This editor is local-first. Your deck is automatically saved in this browser on this device as you work.</p>
        <p>That means your work is not saved to a Google-style cloud account by default. If you switch browsers, clear browser storage, or move to another device, your local saved deck will not come with you unless you export it.</p>
        <p>Use <strong>Export Source</strong> to save your Markdown deck for future editing. Use <strong>Export JSON</strong> if you want a machine-readable version of the same deck. Use <strong>Export Snapshot</strong> to save a portable HTML presentation for sharing or presenting offline.</p>
        <p>Use <strong>Import Source</strong> to reopen a previously exported Markdown or JSON deck in this editor.</p>
        <p>Audience View opens the presentation view. Presenter View opens notes, timing, and next-slide support in a second window.</p>
      </div>
    </form>
  `;
  frame.append(helpDialog);

  themeSelect.innerHTML = BUILT_IN_THEMES.map(
    (theme) => `<option value="${theme.id}">${theme.label}</option>`,
  ).join("");

  function setSource(nextSource) {
    source = nextSource;
    editor.value = nextSource;
    onSourceChange(nextSource);
    render();
  }

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
    applyDeckTheme(compiled.metadata);
    sync.postMessage({
      type: "deck-updated",
      source,
      activeSlideIndex,
      revealStep: compiled.renderedSlides[activeSlideIndex]?.stepCount || 0,
      timestamp: Date.now(),
    });

    const slide = compiled.renderedSlides[activeSlideIndex] || compiled.renderedSlides[0];
    activeSlideIndex = slide?.index || 0;
    deckMeta.textContent = compiled.renderedSlides.length
      ? `${compiled.metadata.title || "Untitled deck"} · Slide ${activeSlideIndex + 1} of ${compiled.renderedSlides.length}`
      : `${compiled.metadata.title || "Untitled deck"} · No slides`;
    themeSelect.value = compiled.metadata.theme || "default-high-contrast";
    themeStylesheetInput.value = compiled.metadata.themeStylesheet || "";
    mountSlideInto(previewFrame, slide);
    notesPreview.innerHTML = slide?.notesHtml || "<p>No speaker notes for this slide.</p>";
    outlineNode.innerHTML = compiled.renderedSlides
      .map((renderedSlide, index) => {
        const currentClass = index === activeSlideIndex ? ' class="is-current"' : "";
        return `<li${currentClass}><button type="button" data-slide-index="${index}">${getSlideTitle(renderedSlide, index)}</button></li>`;
      })
      .join("");
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

  themeSelect.addEventListener("change", () => {
    const nextSource = updateFrontMatterValue(source, "theme", themeSelect.value);
    setSource(nextSource);
  });

  themeStylesheetInput.addEventListener("change", () => {
    const value = themeStylesheetInput.value.trim();
    const nextSource = value
      ? updateFrontMatterValue(source, "themeStylesheet", value)
      : removeFrontMatterValue(source, "themeStylesheet");
    setSource(nextSource);
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

  outlineNode.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-slide-index]");
    if (!button) return;
    activeSlideIndex = Number.parseInt(button.dataset.slideIndex, 10) || 0;
    render();
  });

  presentButton.addEventListener("click", () => {
    window.open("./present", "_blank", "noopener,noreferrer");
  });

  presenterButton.addEventListener("click", () => {
    window.open("./presenter", "_blank", "noopener,noreferrer");
  });

  helpButton.addEventListener("click", () => {
    helpDialog.showModal();
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

  runSa11yCheckButton.addEventListener("click", async () => {
    sa11yStatus.textContent = "Loading Sa11y for the current preview…";
    try {
      await runSa11y("#preview-frame");
      sa11yStatus.textContent = "Sa11y loaded. Use its checker controls to review the current slide preview.";
    } catch (error) {
      sa11yStatus.textContent = `Sa11y could not be loaded here. You can still use the Sa11y bookmarklet or site directly. ${error.message}`;
    }
  });
}
