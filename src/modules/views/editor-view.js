import {
  buildExportFilename,
  buildShortExportFilename,
  buildExportBundle,
  buildMhtmlDocument,
  buildOdpPresentation,
  buildOnePageHtml,
  buildOfflinePresentationHtml,
  buildSnapshotHtml,
  downloadFile,
  openHtmlInNewWindow,
} from "../export.js";
import { buildAiAuthoringPrompt, createAiPromptDefaults } from "../ai-prompt.js";
import { assessSlideDensity } from "../a11y.js";
import { getSlideIndexForSourceOffset, getSourceOffsetForSlideIndex } from "../parser.js";
import { updateFrontMatterValue, removeFrontMatterValue } from "../source-format.js";
import { createSyncChannel } from "../sync.js";
import { getSlideTitle } from "../presentation-state.js";
import { applyDeckTheme, BUILT_IN_THEMES, isValidThemeStylesheetUrl } from "../theme.js";
import { applyPreviewScale } from "../slide-layout.js";
import { addColorModeToggle, buildSupplementalHtml, compileSource, createButton, createDeckFrame, mountSlideInto } from "./shared.js";

async function readCss() {
  const response = await fetch(new URL("../../styles/app.css", import.meta.url));
  return response.text();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function createAppView(root, { initialSource, onSourceChange, onResetDeck, onClearLocalData }) {
  let source = initialSource;
  let activeSlideIndex = 0;
  let lastCompiled = null;
  let editorCollapsed = false;
  let previewCollapsed = false;
  let outlineCollapsed = true;
  let mobilePane = "editor";
  let aiPromptDefaults = null;
  let splitRatio = 0.5;
  let isResizingPanels = false;
  const sync = createSyncChannel();
  const frame = createDeckFrame("Editor");

  frame.innerHTML += `
    <main class="editor-layout" data-editor-collapsed="false" data-mobile-pane="editor">
      <div class="mobile-pane-tabs" role="tablist" aria-label="Editor workspace panes">
        <button type="button" class="mobile-pane-tabs__button is-current" data-pane="editor" role="tab" aria-selected="true">Edit</button>
        <button type="button" class="mobile-pane-tabs__button" data-pane="preview" role="tab" aria-selected="false">Preview</button>
        <button type="button" class="mobile-pane-tabs__button" data-pane="support" role="tab" aria-selected="false">Support</button>
      </div>
      <section class="panel panel--editor">
        <div class="panel-heading">
          <label class="panel__label" for="source-editor">Markdown source</label>
          <button type="button" id="toggle-editor-panel">Minimize Editor</button>
        </div>
        <div class="editor-toolbar" role="toolbar" aria-label="Markdown editing tools">
          <button type="button" data-insert-action="bold" title="Bold selected text">B</button>
          <button type="button" data-insert-action="list" title="Turn selected lines into a list">List</button>
          <button type="button" data-insert-action="new-slide" title="Insert a new slide">New slide</button>
          <button type="button" data-insert-action="note" title="Insert a speaker notes section">Note</button>
          <button type="button" data-insert-action="resources" title="Insert a references section">Resources</button>
          <button type="button" data-insert-action="script" title="Insert a script section">Script</button>
          <button type="button" data-insert-action="center" title="Insert a centered block">Center</button>
          <button type="button" data-insert-action="columns" title="Insert a two-column layout">2 Col</button>
          <button type="button" data-insert-action="media-right" title="Insert media with supporting text">Media</button>
          <button type="button" data-insert-action="callout" title="Insert a callout">Callout</button>
          <button type="button" data-insert-action="quote" title="Insert a quote block">Quote</button>
          <button type="button" data-insert-action="mermaid" title="Insert a Mermaid diagram block">Mermaid</button>
          <button type="button" data-insert-action="svg" title="Insert an SVG figure block">SVG</button>
        </div>
        <p class="local-save-status">Saved locally in this browser on this device. Export to keep a copy elsewhere.</p>
        <textarea id="source-editor" class="editor" spellcheck="false"></textarea>
      </section>
      <div class="editor-layout__divider" id="editor-layout-divider" role="separator" aria-orientation="vertical" aria-label="Resize editor and preview panels" tabindex="0"></div>
      <section class="panel panel--preview" aria-live="polite">
        <div class="preview-header">
          <div>
            <p class="panel__label">Live preview</p>
            <p id="deck-meta" class="meta-text"></p>
          </div>
          <div class="preview-header__actions">
            <div id="layout-warning" class="layout-warning" hidden>
              <button type="button" id="layout-warning-button" class="layout-warning__button" aria-label="Suggestions for Improvements" title="Suggestions for Improvements" aria-describedby="layout-warning-tooltip" aria-expanded="false">
                Suggestion
              </button>
              <div id="layout-warning-tooltip" class="layout-warning__tooltip" role="tooltip" hidden></div>
            </div>
            <div class="theme-menu">
              <button type="button" id="theme-menu-toggle" aria-label="Choose a Theme" title="Choose a Theme" aria-haspopup="true" aria-expanded="false">Theme</button>
              <div id="theme-menu-panel" class="theme-menu__panel" hidden>
                <div class="theme-menu__header">
                  <p class="panel__label">Theme</p>
                  <button type="button" id="theme-menu-close">Close</button>
                </div>
                <label class="theme-control" id="theme-select-control">
                  <span>Built-in theme</span>
                  <select id="theme-select"></select>
                </label>
                <label class="theme-control theme-control--wide" id="theme-stylesheet-control">
                  <span>External CSS</span>
                  <input id="theme-stylesheet-input" type="url" placeholder="https://example.com/theme.css" />
                </label>
              </div>
            </div>
            <button type="button" id="toggle-preview-panel" aria-label="Minimize Preview" title="Minimize Preview">Minimize</button>
            <button type="button" id="toggle-outline-panel-header" aria-label="Show Outline" title="Show Outline">Show Outline</button>
            <div class="preview-header__nav" aria-label="Slide navigation">
              <button type="button" id="prev-slide" aria-label="Previous Slide" title="Previous Slide">&lt;</button>
              <button type="button" id="next-slide" aria-label="Next Slide" title="Next Slide">&gt;</button>
            </div>
          </div>
        </div>
        <div class="preview-layout" data-outline-collapsed="true">
          <div id="preview-frame" class="preview-frame preview-frame--compact"></div>
          <aside class="outline-panel" data-collapsed="true" hidden>
            <div class="panel-heading">
              <p class="panel__label">Slide outline</p>
              <button type="button" id="toggle-outline-panel">Hide Outline</button>
            </div>
            <ol id="slide-outline" class="outline-list"></ol>
          </aside>
        </div>
        <aside class="notes-panel">
          <p class="panel__label">Presenter support</p>
          <div id="notes-preview" class="notes-content"></div>
        </aside>
      </section>
    </main>
  `;

  root.replaceChildren(frame);

  const actions = frame.querySelector(".topbar__actions");
  const editor = frame.querySelector("#source-editor");
  const previewFrame = frame.querySelector("#preview-frame");
  const notesPreview = frame.querySelector("#notes-preview");
  const deckMeta = frame.querySelector("#deck-meta");
  const layoutWarning = frame.querySelector("#layout-warning");
  const layoutWarningButton = frame.querySelector("#layout-warning-button");
  const layoutWarningTooltip = frame.querySelector("#layout-warning-tooltip");
  const outlineNode = frame.querySelector("#slide-outline");
  const themeMenuToggle = frame.querySelector("#theme-menu-toggle");
  const themeMenuPanel = frame.querySelector("#theme-menu-panel");
  const themeMenuClose = frame.querySelector("#theme-menu-close");
  const themeSelect = frame.querySelector("#theme-select");
  const themeSelectControl = frame.querySelector("#theme-select-control");
  const themeStylesheetInput = frame.querySelector("#theme-stylesheet-input");
  const themeStylesheetControl = frame.querySelector("#theme-stylesheet-control");
  const editorLayout = frame.querySelector(".editor-layout");
  const editorToolbar = frame.querySelector(".editor-toolbar");
  const divider = frame.querySelector("#editor-layout-divider");
  const previewLayout = frame.querySelector(".preview-layout");
  const previewPanel = frame.querySelector(".panel--preview");
  const outlinePanel = frame.querySelector(".outline-panel");
  const mobilePaneButtons = [...frame.querySelectorAll(".mobile-pane-tabs__button")];
  const toggleEditorPanelButton = frame.querySelector("#toggle-editor-panel");
  const togglePreviewPanelButton = frame.querySelector("#toggle-preview-panel");
  const toggleOutlinePanelButton = frame.querySelector("#toggle-outline-panel");
  const toggleOutlinePanelHeaderButton = frame.querySelector("#toggle-outline-panel-header");

  const importInput = document.createElement("input");
  importInput.type = "file";
  importInput.accept = ".md,.json,text/markdown,application/json";
  importInput.hidden = true;

  const presentButton = createButton("Audience View");
  const presenterButton = createButton("Presenter View");
  const aiPromptButton = createButton("AI Prompt");
  const helpButton = createButton("Help");
  const exportBundleButton = createButton("Export");
  const onePageButton = createButton("1 Page View");
  const advancedToggle = createButton("Advanced");
  advancedToggle.setAttribute("aria-haspopup", "true");
  advancedToggle.setAttribute("aria-expanded", "false");

  const advancedMenu = document.createElement("div");
  advancedMenu.className = "advanced-menu";
  advancedMenu.hidden = true;
  advancedMenu.innerHTML = `
    <div class="advanced-menu__panel">
      <button type="button" id="advanced-import-source">Import Source</button>
      <button type="button" id="advanced-email-deck">Email Deck</button>
      <button type="button" id="advanced-reset-deck">Reset Local Deck</button>
      <button type="button" id="advanced-clear-data">Clear Local App Data</button>
    </div>
  `;

  actions.append(
    presentButton,
    presenterButton,
    aiPromptButton,
    helpButton,
    exportBundleButton,
    onePageButton,
    advancedToggle,
    advancedMenu,
    importInput,
  );
  addColorModeToggle(actions);

  const advancedImportButton = advancedMenu.querySelector("#advanced-import-source");
  const advancedEmailDeckButton = advancedMenu.querySelector("#advanced-email-deck");
  const advancedResetDeckButton = advancedMenu.querySelector("#advanced-reset-deck");
  const advancedClearDataButton = advancedMenu.querySelector("#advanced-clear-data");

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
        <p>Use <strong>Export</strong> to download a ZIP that contains your editable Markdown deck, a machine-readable JSON version, and a portable HTML presentation. Use <strong>Import Source</strong> to reopen a previously exported Markdown or JSON deck in this editor.</p>
        <p>Lower-frequency tools such as import and <strong>Email Deck</strong> are grouped under <strong>Advanced</strong>. Email Deck is especially useful on a phone when you want to move a draft to a desktop quickly.</p>
        <p>On smaller screens, use the <strong>Edit</strong>, <strong>Preview</strong>, and <strong>Support</strong> tabs to switch panes without the editor feeling cramped.</p>
        <p>Audience View opens the clean presentation surface. Presenter View opens notes, timing, next-slide support, and shared text zoom controls in a second window.</p>
        <div class="support-section">
          <h2>Keyboard shortcuts</h2>
          <p><strong>Audience View:</strong> <kbd>Right Arrow</kbd>, <kbd>Page Down</kbd>, or <kbd>Space</kbd> moves forward. <kbd>Left Arrow</kbd> or <kbd>Page Up</kbd> moves back. <kbd>Home</kbd> goes to the first slide. <kbd>End</kbd> goes to the last slide. <kbd>O</kbd> opens the outline. <kbd>D</kbd> toggles light and dark mode.</p>
          <p><strong>Presenter View:</strong> the same navigation keys work there, plus <kbd>A-</kbd>/<kbd>-</kbd>, <kbd>A</kbd>/<kbd>0</kbd>, and <kbd>A+</kbd>/<kbd>+</kbd> to adjust text zoom for both presenter and audience screens.</p>
          <p>Browser shortcuts like <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>C</kbd> should remain available for copying text.</p>
        </div>
      </div>
    </form>
  `;
  frame.append(helpDialog);

  const aiPromptDialog = document.createElement("dialog");
  aiPromptDialog.className = "help-dialog ai-prompt-dialog";
  aiPromptDialog.innerHTML = `
    <form method="dialog" class="help-dialog__inner ai-prompt-dialog__inner">
      <div class="help-dialog__header">
        <div>
          <p class="panel__label">AI prompt generator</p>
          <h2>Build a briefing prompt for an LLM</h2>
        </div>
        <button type="submit">Close</button>
      </div>
      <div class="ai-prompt-layout">
        <div class="ai-prompt-fields">
          <label class="theme-control">
            <span>Title</span>
            <input id="ai-prompt-title" type="text" />
          </label>
          <label class="theme-control">
            <span>Presenters</span>
            <input id="ai-prompt-presenters" type="text" />
          </label>
          <label class="theme-control">
            <span>Duration (min)</span>
            <input id="ai-prompt-duration" type="number" min="1" step="1" />
          </label>
          <label class="theme-control">
            <span>Audience</span>
            <input id="ai-prompt-audience" type="text" placeholder="Who is this for?" />
          </label>
          <label class="theme-control">
            <span>Purpose</span>
            <input id="ai-prompt-purpose" type="text" placeholder="What should this talk achieve?" />
          </label>
          <label class="theme-control">
            <span>Tone</span>
            <input id="ai-prompt-tone" type="text" placeholder="Credible, practical, warm..." />
          </label>
          <label class="theme-control">
            <span>Call to action</span>
            <input id="ai-prompt-cta" type="text" placeholder="Optional" />
          </label>
          <label class="theme-control theme-control--wide">
            <span>Topics</span>
            <textarea id="ai-prompt-topics" class="ai-prompt-textarea" rows="5"></textarea>
          </label>
          <label class="theme-control theme-control--wide">
            <span>References</span>
            <textarea id="ai-prompt-references" class="ai-prompt-textarea" rows="5"></textarea>
          </label>
          <div class="ai-prompt-options">
            <label><input id="ai-prompt-title-slide" type="checkbox" /> Include title slide</label>
            <label><input id="ai-prompt-closing-slide" type="checkbox" /> Include closing slide</label>
            <label><input id="ai-prompt-notes" type="checkbox" /> Include notes</label>
            <label><input id="ai-prompt-resources" type="checkbox" /> Include resources</label>
            <label><input id="ai-prompt-script" type="checkbox" /> Include script</label>
          </div>
        </div>
        <div class="ai-prompt-output">
          <div class="panel-heading">
            <p class="panel__label">Generated prompt</p>
            <button type="button" id="copy-ai-prompt">Copy Prompt</button>
          </div>
          <textarea id="ai-prompt-output" class="editor ai-prompt-output__field" spellcheck="false"></textarea>
          <p id="ai-prompt-status" class="meta-text"></p>
        </div>
      </div>
    </form>
  `;
  frame.append(aiPromptDialog);

  const aiPromptFields = {
    title: aiPromptDialog.querySelector("#ai-prompt-title"),
    presenters: aiPromptDialog.querySelector("#ai-prompt-presenters"),
    durationMinutes: aiPromptDialog.querySelector("#ai-prompt-duration"),
    audience: aiPromptDialog.querySelector("#ai-prompt-audience"),
    purpose: aiPromptDialog.querySelector("#ai-prompt-purpose"),
    tone: aiPromptDialog.querySelector("#ai-prompt-tone"),
    callToAction: aiPromptDialog.querySelector("#ai-prompt-cta"),
    topics: aiPromptDialog.querySelector("#ai-prompt-topics"),
    references: aiPromptDialog.querySelector("#ai-prompt-references"),
    includeTitleSlide: aiPromptDialog.querySelector("#ai-prompt-title-slide"),
    includeClosingSlide: aiPromptDialog.querySelector("#ai-prompt-closing-slide"),
    includeNotes: aiPromptDialog.querySelector("#ai-prompt-notes"),
    includeResources: aiPromptDialog.querySelector("#ai-prompt-resources"),
    includeScript: aiPromptDialog.querySelector("#ai-prompt-script"),
  };
  const aiPromptOutput = aiPromptDialog.querySelector("#ai-prompt-output");
  const aiPromptStatus = aiPromptDialog.querySelector("#ai-prompt-status");
  const copyAiPromptButton = aiPromptDialog.querySelector("#copy-ai-prompt");

  themeSelect.innerHTML = BUILT_IN_THEMES.map(
    (theme) => `<option value="${theme.id}">${theme.label}</option>`,
  ).join("");

  function setSource(nextSource) {
    source = nextSource;
    editor.value = nextSource;
    onSourceChange(nextSource);
    render();
  }

  function setEditorSelection(start, end = start) {
    editor.focus();
    editor.setSelectionRange(start, end);
  }

  function jumpEditorToSlide(compiled, slideIndex) {
    const sourceOffset = getSourceOffsetForSlideIndex(source, slideIndex, compiled);

    if (editorCollapsed) {
      editorCollapsed = false;
    }
    if (mobilePane !== "editor") {
      mobilePane = "editor";
    }
    applyPanelState();
    setEditorSelection(sourceOffset);
  }

  function replaceEditorSelection(replacement, selectionStart = null, selectionEnd = null) {
    const start = editor.selectionStart || 0;
    const end = editor.selectionEnd || 0;
    const nextSource = `${source.slice(0, start)}${replacement}${source.slice(end)}`;
    setSource(nextSource);
    const nextStart = selectionStart == null ? start + replacement.length : selectionStart;
    const nextEnd = selectionEnd == null ? nextStart : selectionEnd;
    setEditorSelection(nextStart, nextEnd);
  }

  function wrapEditorSelection(prefix, suffix = "") {
    const start = editor.selectionStart || 0;
    const end = editor.selectionEnd || 0;
    const selected = source.slice(start, end) || "text";
    const replacement = `${prefix}${selected}${suffix}`;
    replaceEditorSelection(replacement, start + prefix.length, start + prefix.length + selected.length);
  }

  function insertBlock(block, selectOffset = null, selectLength = 0) {
    const start = editor.selectionStart || 0;
    const end = editor.selectionEnd || 0;
    const before = source.slice(0, start);
    const needsLeadingBreak = before && !before.endsWith("\n\n");
    const prefix = needsLeadingBreak ? "\n\n" : "";
    const replacement = `${prefix}${block}`;
    const selectionStart = selectOffset == null ? start + replacement.length : start + prefix.length + selectOffset;
    const selectionEnd = selectionStart + selectLength;
    replaceEditorSelection(replacement, selectionStart, selectionEnd);
  }

  function turnSelectionIntoList() {
    const start = editor.selectionStart || 0;
    const end = editor.selectionEnd || 0;
    const selected = source.slice(start, end) || "List item";
    const lines = selected
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const replacement = lines.length
      ? lines.map((line) => (line.startsWith("- ") ? line : `- ${line}`)).join("\n")
      : "- List item";
    replaceEditorSelection(replacement, start, start + replacement.length);
  }

  function handleToolbarAction(action) {
    switch (action) {
      case "bold":
        wrapEditorSelection("**", "**");
        return;
      case "list":
        turnSelectionIntoList();
        return;
      case "new-slide":
        insertBlock("---\n\n# New slide\n\n");
        return;
      case "note":
        insertBlock("Note:\nSpeaker notes go here.\n", 6, "Speaker notes go here.".length);
        return;
      case "resources":
        insertBlock("Resources:\n- [Reference title](https://example.com)\n", 13, "Reference title".length);
        return;
      case "script":
        insertBlock("Script:\nAdd fuller delivery text here.\n", 8, "Add fuller delivery text here.".length);
        return;
      case "center":
        insertBlock("::center\nCentered text.\n::\n", 9, "Centered text.".length);
        return;
      case "columns":
        insertBlock("::column-left\nLeft column content\n::\n\n::column-right\nRight column content\n::\n", 14, "Left column content".length);
        return;
      case "media-right":
        insertBlock("::media-right\n![Alt text](https://example.com/image.jpg)\n---\nSupporting text here.\n::\n", 25, "Alt text".length);
        return;
      case "callout":
        insertBlock("::callout\nImportant takeaway.\n::\n", 11, "Important takeaway.".length);
        return;
      case "quote":
        insertBlock("::quote\nMemorable quote.\n::\n", 9, "Memorable quote.".length);
        return;
      case "mermaid":
        insertBlock("::mermaid\nflowchart LR\n  A[Author] --> B[Deck]\n::\n", 11, "flowchart LR\n  A[Author] --> B[Deck]".length);
        return;
      case "svg":
        insertBlock("::svg\n![Diagram description](./images/diagram.svg)\n::\n", 9, "Diagram description".length);
        return;
      default:
    }
  }

  function applyPanelState() {
    editorLayout.dataset.editorCollapsed = String(editorCollapsed);
    editorLayout.dataset.previewCollapsed = String(previewCollapsed);
    editorLayout.dataset.mobilePane = mobilePane;
    previewLayout.dataset.outlineCollapsed = String(outlineCollapsed);
    outlinePanel.dataset.collapsed = String(outlineCollapsed);
    outlinePanel.hidden = outlineCollapsed;
    toggleEditorPanelButton.textContent = editorCollapsed ? "Expand Editor" : "Minimize Editor";
    const previewLabel = previewCollapsed ? "Expand Preview" : "Minimize Preview";
    togglePreviewPanelButton.textContent = previewCollapsed ? "Expand" : "Minimize";
    togglePreviewPanelButton.setAttribute("aria-label", previewLabel);
    togglePreviewPanelButton.setAttribute("title", previewLabel);

    const outlineLabel = outlineCollapsed ? "Show Outline" : "Hide Outline";
    toggleOutlinePanelButton.textContent = outlineLabel;
    toggleOutlinePanelButton.setAttribute("aria-label", outlineLabel);
    toggleOutlinePanelButton.setAttribute("title", outlineLabel);
    toggleOutlinePanelHeaderButton.textContent = outlineLabel;
    toggleOutlinePanelHeaderButton.setAttribute("aria-label", outlineLabel);
    toggleOutlinePanelHeaderButton.setAttribute("title", outlineLabel);
    previewPanel.hidden = previewCollapsed;
    divider.hidden = editorCollapsed || previewCollapsed;
    if (editorCollapsed || previewCollapsed) {
      editorLayout.style.removeProperty("--editor-panel-fr");
      editorLayout.style.removeProperty("--preview-panel-fr");
    } else {
      editorLayout.style.setProperty("--editor-panel-fr", `${splitRatio}fr`);
      editorLayout.style.setProperty("--preview-panel-fr", `${1 - splitRatio}fr`);
    }
    mobilePaneButtons.forEach((button) => {
      const isCurrent = button.dataset.pane === mobilePane;
      button.classList.toggle("is-current", isCurrent);
      button.setAttribute("aria-selected", String(isCurrent));
    });
  }

  function closeThemeMenu() {
    themeMenuPanel.hidden = true;
    themeMenuToggle.setAttribute("aria-expanded", "false");
  }

  function openThemeMenu() {
    themeMenuPanel.hidden = false;
    themeMenuToggle.setAttribute("aria-expanded", "true");
    (themeSelectControl.hidden ? themeStylesheetInput : themeSelect).focus();
  }

  function publishState(compiled) {
    applyDeckTheme(compiled.metadata);
    aiPromptDefaults = createAiPromptDefaults(compiled);
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
    const stylesheetValue = compiled.metadata.themeStylesheet || "";
    themeSelect.value = compiled.metadata.theme || "default-high-contrast";
    themeStylesheetInput.dataset.fullValue = stylesheetValue;
    themeStylesheetInput.value = shortenThemeStylesheetValue(stylesheetValue);
    const hasExternalStylesheet = isValidThemeStylesheetUrl(stylesheetValue);
    themeSelectControl.hidden = hasExternalStylesheet;
    themeStylesheetControl.hidden = false;
    const fitResult = mountSlideInto(previewFrame, slide);
    notesPreview.innerHTML = buildSupplementalHtml(slide);
    const currentSlideWarnings = compiled.issues.filter(
      (issue) => issue.slide === activeSlideIndex + 1 && issue.level === "warning" && issue.category === "layout",
    );
    if (fitResult?.overflow || currentSlideWarnings.length) {
      layoutWarning.hidden = false;
      layoutWarningTooltip.textContent = fitResult?.overflow
        ? "This slide still overflows the target presentation frame. Shorten the visible copy or split it into more slides."
        : currentSlideWarnings[0].message;
      hideLayoutWarningTooltip();
    } else {
      layoutWarning.hidden = true;
      layoutWarningTooltip.textContent = "";
      hideLayoutWarningTooltip();
    }
    outlineNode.innerHTML = compiled.renderedSlides
      .map((renderedSlide, index) => {
        const currentClass = index === activeSlideIndex ? ' class="is-current"' : "";
        const density = assessSlideDensity(compiled.slides?.[index]);
        const densityBadge = density.level === "comfortable"
          ? ""
          : `<span class="outline-density outline-density--${density.level}" aria-hidden="true">${density.label}</span>`;
        const densitySummary = density.level === "comfortable"
          ? ""
          : ` · ${density.label} slide`;
        return `<li${currentClass}><button type="button" data-slide-index="${index}" aria-label="${escapeHtml(`${getSlideTitle(renderedSlide, index)}${densitySummary}`)}"><span class="outline-title">${escapeHtml(getSlideTitle(renderedSlide, index))}</span>${densityBadge}</button></li>`;
      })
      .join("");
  }

  function render() {
    lastCompiled = compileSource(source);
    publishState(lastCompiled);
  }

  function showLayoutWarningTooltip() {
    if (layoutWarning.hidden || !layoutWarningTooltip.textContent.trim()) return;
    layoutWarningTooltip.hidden = false;
    layoutWarningButton.setAttribute("aria-expanded", "true");
  }

  function hideLayoutWarningTooltip() {
    layoutWarningTooltip.hidden = true;
    layoutWarningButton.setAttribute("aria-expanded", "false");
  }

  function syncPreviewToEditorSelection() {
    const nextSlideIndex = getSlideIndexForSourceOffset(source, editor.selectionStart || 0);
    if (nextSlideIndex === activeSlideIndex) return;
    activeSlideIndex = Math.max(0, nextSlideIndex);
    render();
  }

  function setAiPromptFormValues(values) {
    aiPromptFields.title.value = values.title || "";
    aiPromptFields.presenters.value = values.presenters || "";
    aiPromptFields.durationMinutes.value = values.durationMinutes || "";
    aiPromptFields.audience.value = values.audience || "";
    aiPromptFields.purpose.value = values.purpose || "";
    aiPromptFields.tone.value = values.tone || "";
    aiPromptFields.callToAction.value = values.callToAction || "";
    aiPromptFields.topics.value = (values.topics || []).join("\n");
    aiPromptFields.references.value = (values.references || []).join("\n");
    aiPromptFields.includeTitleSlide.checked = Boolean(values.includeTitleSlide);
    aiPromptFields.includeClosingSlide.checked = Boolean(values.includeClosingSlide);
    aiPromptFields.includeNotes.checked = Boolean(values.includeNotes);
    aiPromptFields.includeResources.checked = Boolean(values.includeResources);
    aiPromptFields.includeScript.checked = Boolean(values.includeScript);
  }

  function readAiPromptFormValues() {
    return {
      title: aiPromptFields.title.value.trim(),
      presenters: aiPromptFields.presenters.value.trim(),
      durationMinutes: aiPromptFields.durationMinutes.value.trim(),
      audience: aiPromptFields.audience.value.trim(),
      purpose: aiPromptFields.purpose.value.trim(),
      tone: aiPromptFields.tone.value.trim(),
      callToAction: aiPromptFields.callToAction.value.trim(),
      topics: aiPromptFields.topics.value,
      references: aiPromptFields.references.value,
      includeTitleSlide: aiPromptFields.includeTitleSlide.checked,
      includeClosingSlide: aiPromptFields.includeClosingSlide.checked,
      includeNotes: aiPromptFields.includeNotes.checked,
      includeResources: aiPromptFields.includeResources.checked,
      includeScript: aiPromptFields.includeScript.checked,
    };
  }

  function refreshAiPromptOutput() {
    aiPromptOutput.value = buildAiAuthoringPrompt(readAiPromptFormValues());
    aiPromptStatus.textContent = "Copy this prompt into Ollama or another LLM, then paste the returned deck Markdown back into this editor.";
  }

  editor.value = source;
  applyPanelState();
  render();

  const previewFrameObserver = new ResizeObserver(() => {
    applyPreviewScale(previewFrame);
  });
  previewFrameObserver.observe(previewFrame);

  editor.addEventListener("input", () => {
    source = editor.value;
    onSourceChange(source);
    activeSlideIndex = getSlideIndexForSourceOffset(source, editor.selectionStart || 0);
    render();
  });

  editor.addEventListener("click", syncPreviewToEditorSelection);
  editor.addEventListener("keyup", syncPreviewToEditorSelection);
  editor.addEventListener("select", syncPreviewToEditorSelection);
  editorToolbar.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-insert-action]");
    if (!button) return;
    handleToolbarAction(button.dataset.insertAction);
  });

  layoutWarningButton.addEventListener("mouseenter", showLayoutWarningTooltip);
  layoutWarningButton.addEventListener("mouseleave", hideLayoutWarningTooltip);
  layoutWarningButton.addEventListener("focus", showLayoutWarningTooltip);
  layoutWarningButton.addEventListener("blur", hideLayoutWarningTooltip);
  layoutWarningButton.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hideLayoutWarningTooltip();
      layoutWarningButton.blur();
    }
  });

  themeSelect.addEventListener("change", () => {
    const nextSource = updateFrontMatterValue(source, "theme", themeSelect.value);
    setSource(nextSource);
  });

  themeMenuToggle.addEventListener("click", () => {
    if (themeMenuPanel.hidden) {
      openThemeMenu();
      return;
    }
    closeThemeMenu();
  });

  themeMenuClose.addEventListener("click", () => {
    closeThemeMenu();
    themeMenuToggle.focus();
  });

  themeStylesheetInput.addEventListener("focus", () => {
    themeStylesheetInput.value = themeStylesheetInput.dataset.fullValue || "";
  });

  themeStylesheetInput.addEventListener("change", () => {
    const value = themeStylesheetInput.value.trim();
    themeStylesheetInput.dataset.fullValue = value;
    const nextSource = isValidThemeStylesheetUrl(value)
      ? updateFrontMatterValue(source, "themeStylesheet", value)
      : removeFrontMatterValue(source, "themeStylesheet");
    setSource(nextSource);
  });

  themeStylesheetInput.addEventListener("blur", () => {
    themeStylesheetInput.value = shortenThemeStylesheetValue(themeStylesheetInput.dataset.fullValue || "");
  });

  toggleEditorPanelButton.addEventListener("click", () => {
    if (!editorCollapsed && previewCollapsed) {
      previewCollapsed = false;
    }
    editorCollapsed = !editorCollapsed;
    applyPanelState();
  });

  togglePreviewPanelButton.addEventListener("click", () => {
    if (!previewCollapsed && editorCollapsed) {
      editorCollapsed = false;
    }
    previewCollapsed = !previewCollapsed;
    applyPanelState();
  });

  toggleOutlinePanelButton.addEventListener("click", () => {
    outlineCollapsed = !outlineCollapsed;
    applyPanelState();
  });

  toggleOutlinePanelHeaderButton.addEventListener("click", () => {
    outlineCollapsed = !outlineCollapsed;
    applyPanelState();
  });

  mobilePaneButtons.forEach((button) => {
    button.addEventListener("click", () => {
      mobilePane = button.dataset.pane || "editor";
      applyPanelState();
    });
  });

  frame.querySelector("#prev-slide").addEventListener("click", () => {
    const compiled = compileSource(source);
    activeSlideIndex = Math.max(0, activeSlideIndex - 1);
    publishState(compiled);
    jumpEditorToSlide(compiled, activeSlideIndex);
  });

  frame.querySelector("#next-slide").addEventListener("click", () => {
    const compiled = compileSource(source);
    activeSlideIndex = Math.min(compiled.renderedSlides.length - 1, activeSlideIndex + 1);
    publishState(compiled);
    jumpEditorToSlide(compiled, activeSlideIndex);
  });

  outlineNode.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-slide-index]");
    if (!button) return;
    const compiled = compileSource(source);
    activeSlideIndex = Number.parseInt(button.dataset.slideIndex, 10) || 0;
    publishState(compiled);
    jumpEditorToSlide(compiled, activeSlideIndex);
  });

  function updateSplitRatio(clientX) {
    const rect = editorLayout.getBoundingClientRect();
    if (!rect.width) return;
    const nextRatio = (clientX - rect.left) / rect.width;
    splitRatio = Math.min(0.72, Math.max(0.28, Number(nextRatio.toFixed(3))));
    applyPanelState();
  }

  divider.addEventListener("pointerdown", (event) => {
    if (editorCollapsed || previewCollapsed) return;
    isResizingPanels = true;
    divider.setPointerCapture(event.pointerId);
    editorLayout.dataset.resizing = "true";
    updateSplitRatio(event.clientX);
  });

  divider.addEventListener("pointermove", (event) => {
    if (!isResizingPanels) return;
    updateSplitRatio(event.clientX);
  });

  divider.addEventListener("pointerup", (event) => {
    if (!isResizingPanels) return;
    isResizingPanels = false;
    divider.releasePointerCapture(event.pointerId);
    editorLayout.dataset.resizing = "false";
  });

  divider.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      splitRatio = Math.max(0.28, Number((splitRatio - 0.03).toFixed(3)));
      applyPanelState();
    }
    if (event.key === "ArrowRight") {
      splitRatio = Math.min(0.72, Number((splitRatio + 0.03).toFixed(3)));
      applyPanelState();
    }
  });

  presentButton.addEventListener("click", () => {
    window.open("./present/", "_blank", "noopener,noreferrer");
  });

  presenterButton.addEventListener("click", () => {
    window.open("./presenter/", "_blank", "noopener,noreferrer");
  });

  aiPromptButton.addEventListener("click", () => {
    setAiPromptFormValues(aiPromptDefaults || createAiPromptDefaults(lastCompiled || {}));
    refreshAiPromptOutput();
    aiPromptDialog.showModal();
  });

  helpButton.addEventListener("click", () => {
    helpDialog.showModal();
  });

  Object.values(aiPromptFields).forEach((field) => {
    field.addEventListener("input", refreshAiPromptOutput);
    field.addEventListener("change", refreshAiPromptOutput);
  });

  copyAiPromptButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(aiPromptOutput.value);
      aiPromptStatus.textContent = "Prompt copied to the clipboard.";
    } catch {
      aiPromptOutput.focus();
      aiPromptOutput.select();
      aiPromptStatus.textContent = "Clipboard access was not available. The prompt is selected so you can copy it manually.";
    }
  });

  exportBundleButton.addEventListener("click", async () => {
    const cssText = await readCss();

    let themeStylesheetCss = "";
    const themeStylesheetUrl = lastCompiled?.metadata?.themeStylesheet;
    if (isValidThemeStylesheetUrl(themeStylesheetUrl)) {
      try {
        const themeResponse = await fetch(themeStylesheetUrl);
        if (themeResponse.ok) {
          themeStylesheetCss = await themeResponse.text();
        }
      } catch {
        // Theme CSS fetch failed; offline file will omit the external theme
      }
    }

    const html = buildSnapshotHtml({
      title: lastCompiled?.metadata.title || "Slide deck snapshot",
      cssText,
      renderedSlides: lastCompiled?.renderedSlides || [],
      metadata: lastCompiled?.metadata || {},
      source,
    });
    const deckJson = JSON.stringify(
      {
        metadata: lastCompiled?.metadata || {},
        slides: lastCompiled?.slides || [],
        source,
      },
      null,
      2,
    );
    const onePageHtml = buildOnePageHtml({
      title: lastCompiled?.metadata.title || "Slide deck one-page view",
      cssText,
      renderedSlides: lastCompiled?.renderedSlides || [],
      metadata: lastCompiled?.metadata || {},
    });
    const offlineHtml = buildOfflinePresentationHtml({
      title: lastCompiled?.metadata.title || "Slide deck",
      cssText,
      themeStylesheetCss,
      renderedSlides: lastCompiled?.renderedSlides || [],
      metadata: lastCompiled?.metadata || {},
    });
    const zipFilename = buildExportFilename(lastCompiled?.metadata.title || "deck-export", lastCompiled?.metadata.date);
    const filePrefix = zipFilename.replace(/\.zip$/, "");
    const bundle = buildExportBundle({
      markdownSource: source,
      snapshotHtml: html,
      deckJson,
      odpBytes: buildOdpPresentation({
        title: lastCompiled?.metadata.title || "Slide deck",
        renderedSlides: lastCompiled?.renderedSlides || [],
        metadata: lastCompiled?.metadata || {},
      }),
      onePageMhtml: buildMhtmlDocument({
        title: lastCompiled?.metadata.title || "Slide deck one-page view",
        html: onePageHtml,
      }),
      offlineMhtml: buildMhtmlDocument({
        title: lastCompiled?.metadata.title || "Slide deck offline presentation",
        html: offlineHtml,
      }),
      filePrefix,
    });
    downloadFile(
      zipFilename,
      bundle,
      "application/zip",
    );
  });

  onePageButton.addEventListener("click", async () => {
    const cssText = await readCss();
    const html = buildOnePageHtml({
      title: lastCompiled?.metadata.title || "Slide deck snapshot",
      cssText,
      renderedSlides: lastCompiled?.renderedSlides || [],
      metadata: lastCompiled?.metadata || {},
    });
    openHtmlInNewWindow(html);
  });

  advancedImportButton.addEventListener("click", () => {
    advancedMenu.hidden = true;
    advancedToggle.setAttribute("aria-expanded", "false");
    importInput.click();
  });

  advancedEmailDeckButton.addEventListener("click", () => {
    advancedMenu.hidden = true;
    advancedToggle.setAttribute("aria-expanded", "false");
    const deckTitle = lastCompiled?.metadata?.title || "Markdown slide deck";
    const editorUrl = new URL(window.location.href);
    editorUrl.pathname = editorUrl.pathname.replace(/\/present(er)?\/?$/, "/");
    editorUrl.search = "";
    editorUrl.hash = "";
    const intro = [
      `Deck: ${deckTitle}`,
      `Editor URL: ${editorUrl.toString()}`,
      "",
      "This draft is stored locally in the browser on this device.",
      "If the full source is not included below, use Export on this device and attach the ZIP or Markdown file.",
      "",
    ].join("\n");
    const maxBodyLength = 6000;
    const body = source.length <= maxBodyLength
      ? `${intro}${source}`
      : `${intro}The deck source is too long to include safely in a mail draft.`;
    const mailto = `mailto:?subject=${encodeURIComponent(deckTitle)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  });

  advancedResetDeckButton.addEventListener("click", async () => {
    advancedMenu.hidden = true;
    advancedToggle.setAttribute("aria-expanded", "false");
    const confirmed = window.confirm(
      "Reset the locally saved deck and restore the default starter deck for this browser?",
    );
    if (!confirmed) return;
    await onResetDeck();
    window.location.reload();
  });

  advancedClearDataButton.addEventListener("click", async () => {
    advancedMenu.hidden = true;
    advancedToggle.setAttribute("aria-expanded", "false");
    const confirmed = window.confirm(
      "Clear all locally stored app data for this browser and reload the editor?",
    );
    if (!confirmed) return;
    await onClearLocalData();
    window.location.reload();
  });

  advancedToggle.addEventListener("click", () => {
    const isOpening = advancedMenu.hidden;
    advancedMenu.hidden = !isOpening;
    advancedToggle.setAttribute("aria-expanded", String(isOpening));
  });

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

  document.addEventListener("click", (event) => {
    if (advancedMenu.hidden) return;
    if (advancedMenu.contains(event.target) || advancedToggle.contains(event.target)) return;
    advancedMenu.hidden = true;
    advancedToggle.setAttribute("aria-expanded", "false");
  });

  document.addEventListener("click", (event) => {
    if (themeMenuPanel.hidden) return;
    if (themeMenuPanel.contains(event.target) || themeMenuToggle.contains(event.target)) return;
    closeThemeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || themeMenuPanel.hidden) return;
    closeThemeMenu();
  });
}

function shortenThemeStylesheetValue(value) {
  if (!isValidThemeStylesheetUrl(value)) return value;
  try {
    const parsed = new URL(value);
    const shortPath = parsed.pathname.split("/").filter(Boolean).slice(-2).join("/");
    return shortPath ? `.../${shortPath}` : value;
  } catch {
    return value;
  }
}
