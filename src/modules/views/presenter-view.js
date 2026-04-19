import { createSyncChannel } from "../sync.js";
import {
  buildPresentationHash,
  getNextPosition,
  getPresentationDurationMinutes,
  getPreviousPosition,
  getSlideTitle,
} from "../presentation-state.js";
import {
  expandPresenterPanel,
  getPresenterPanelLayoutMap,
  loadPresenterLayout,
  movePresenterPanel,
  resizePresenterPanel,
  savePresenterLayout,
} from "../presenter-layout.js";
import {
  adjustPresenterTimerMinutes,
  createPresenterTimerState,
  formatPresenterTimerMinutes,
  getPresenterTimerProgress,
  getPresenterTimerTone,
  resetPresenterTimer,
  setPresenterTimerPaused,
  tickPresenterTimer,
} from "../presenter-timer.js";
import { createCaptionMonitor, getCaptionConfig } from "../captions.js";
import { isSpeechRecognitionSupported, createSpeechRecognitionSource, CAPTION_LANGUAGES, getCaptionLanguage } from "../speech-recognition.js";
import { toggleColorMode } from "../color-mode.js";
import { applyDeckTheme } from "../theme.js";
import { addColorModeToggle, buildSupplementalHtml, compileSource, createButton, createDeckFrame, mountSlideInto } from "./shared.js";

export function createPresenterView(root, initialSource) {
  let source = initialSource;
  let activeSlideIndex = 0;
  let revealStep = 0;
  let textZoom = 1;
  let panelControlsLocked = true;
  const sync = createSyncChannel();
  const frame = createDeckFrame("Presenter View");
  let panelLayout = loadPresenterLayout();
  let compiled = compileSource(source);
  let timerState = createPresenterTimerState(getPresentationDurationMinutes(compiled.metadata));
  let captionsState = {
    enabled: false,
    available: false,
    active: false,
    text: "",
    generated: "",
    provider: "none",
    source: "",
  };
  let captionConfig = getCaptionConfig(compiled.metadata);
  const captionMonitor = createCaptionMonitor(captionConfig, (state) => {
    captionsState = state;
    render();
  });

  const sttSupported = isSpeechRecognitionSupported();
  let sttEnabled = sttSupported;
  let sttState = { active: false, text: "", error: "" };
  const sttSource = createSpeechRecognitionSource((update) => {
    sttState = { active: update.active, text: update.text, error: update.error || "" };
    sync.postMessage({ type: "caption-update", text: sttState.text, timestamp: Date.now() });
    render();
  });

  frame.innerHTML += `
    <main class="presenter-layout presenter-layout--custom" id="presenter-layout-grid">
      <section class="presenter-panel" data-panel-id="current">
        <div class="presenter-panel__header">
          <p class="panel__label">Current slide</p>
          <div class="presenter-panel__controls">
            <button type="button" data-action="shrink" data-panel-id="current" aria-label="Make current slide narrower">-</button>
            <button type="button" data-action="grow" data-panel-id="current" aria-label="Make current slide wider">+</button>
            <button type="button" data-action="left" data-panel-id="current" aria-label="Move current slide left">←</button>
            <button type="button" data-action="right" data-panel-id="current" aria-label="Move current slide right">→</button>
          </div>
        </div>
        <div id="presenter-current" class="preview-frame preview-frame--compact"></div>
      </section>
      <section class="presenter-panel" data-panel-id="next">
        <div class="presenter-panel__header">
          <p class="panel__label">Next slide</p>
          <div class="presenter-panel__controls">
            <button type="button" data-action="shrink" data-panel-id="next" aria-label="Make next slide narrower">-</button>
            <button type="button" data-action="grow" data-panel-id="next" aria-label="Make next slide wider">+</button>
            <button type="button" data-action="left" data-panel-id="next" aria-label="Move next slide left">←</button>
            <button type="button" data-action="right" data-panel-id="next" aria-label="Move next slide right">→</button>
          </div>
        </div>
        <div id="presenter-next" class="preview-frame preview-frame--compact"></div>
      </section>
      <section class="presenter-panel" data-panel-id="timer">
        <div class="presenter-panel__header">
          <p class="panel__label">Timer</p>
          <div class="presenter-panel__controls">
            <button type="button" data-action="shrink" data-panel-id="timer" aria-label="Make timer panel narrower">-</button>
            <button type="button" data-action="grow" data-panel-id="timer" aria-label="Make timer panel wider">+</button>
            <button type="button" data-action="left" data-panel-id="timer" aria-label="Move timer panel left">←</button>
            <button type="button" data-action="right" data-panel-id="timer" aria-label="Move timer panel right">→</button>
          </div>
        </div>
        <div class="presenter-panel__body">
          <p id="presenter-timer" class="timer">30 min</p>
          <p id="presenter-remaining" class="meta-text"></p>
          <div class="presenter-timer-controls">
            <button type="button" id="presenter-minus-minute">-1 min</button>
            <button type="button" id="presenter-plus-minute">+1 min</button>
            <button type="button" id="presenter-pause-timer">Pause</button>
            <button type="button" id="presenter-reset-timer">Reset</button>
          </div>
        </div>
      </section>
      <section class="presenter-panel" data-panel-id="notes">
        <div class="presenter-panel__header">
          <p class="panel__label">Presenter support</p>
          <div class="presenter-panel__controls">
            <button type="button" data-action="shrink" data-panel-id="notes" aria-label="Make notes panel narrower">-</button>
            <button type="button" data-action="grow" data-panel-id="notes" aria-label="Make notes panel wider">+</button>
            <button type="button" data-action="left" data-panel-id="notes" aria-label="Move notes panel left">←</button>
            <button type="button" data-action="right" data-panel-id="notes" aria-label="Move notes panel right">→</button>
          </div>
        </div>
        <div class="presenter-panel__body">
          <div id="presenter-notes" class="notes-content"></div>
        </div>
      </section>
      <section class="presenter-panel" data-panel-id="captions" hidden>
        <div class="presenter-panel__header">
          <p class="panel__label">Captions</p>
          <div class="presenter-panel__controls">
            <button type="button" data-action="shrink" data-panel-id="captions" aria-label="Make captions panel narrower">-</button>
            <button type="button" data-action="grow" data-panel-id="captions" aria-label="Make captions panel wider">+</button>
            <button type="button" data-action="left" data-panel-id="captions" aria-label="Move captions panel left">←</button>
            <button type="button" data-action="right" data-panel-id="captions" aria-label="Move captions panel right">→</button>
          </div>
        </div>
        <div class="presenter-panel__body">
          <p id="presenter-captions-status" class="meta-text"></p>
          ${sttSupported ? `<label class="captions-language-label"><span class="sr-only">Caption language</span><select id="captions-language-select">${CAPTION_LANGUAGES.map(([tag, label]) => `<option value="${tag}"${tag === getCaptionLanguage() ? " selected" : ""}>${label}</option>`).join("")}</select></label>` : ""}
          <div id="presenter-captions" class="notes-content captions-transcript"></div>
        </div>
      </section>
      <section class="presenter-panel" data-panel-id="outline">
        <div class="presenter-panel__header">
          <p class="panel__label">Outline</p>
          <div class="presenter-panel__controls">
            <button type="button" data-action="shrink" data-panel-id="outline" aria-label="Make outline panel narrower">-</button>
            <button type="button" data-action="grow" data-panel-id="outline" aria-label="Make outline panel wider">+</button>
            <button type="button" data-action="left" data-panel-id="outline" aria-label="Move outline panel left">←</button>
            <button type="button" data-action="right" data-panel-id="outline" aria-label="Move outline panel right">→</button>
          </div>
        </div>
        <div class="presenter-panel__body">
          <ol id="presenter-outline" class="outline-list"></ol>
        </div>
      </section>
    </main>
    <div id="presenter-timer-progress" class="presenter-timer-progress" aria-hidden="true"></div>
  `;

  root.replaceChildren(frame);

  const actions = frame.querySelector(".topbar__actions");
  const layoutGrid = frame.querySelector("#presenter-layout-grid");
  const currentFrame = frame.querySelector("#presenter-current");
  const nextFrame = frame.querySelector("#presenter-next");
  const notesNode = frame.querySelector("#presenter-notes");
  const captionsPanel = frame.querySelector('[data-panel-id="captions"]');
  const captionsStatusNode = frame.querySelector("#presenter-captions-status");
  const captionsNode = frame.querySelector("#presenter-captions");
  const timerNode = frame.querySelector("#presenter-timer");
  const remainingNode = frame.querySelector("#presenter-remaining");
  const outlineNode = frame.querySelector("#presenter-outline");
  const resetTimerButton = frame.querySelector("#presenter-reset-timer");
  const pauseTimerButton = frame.querySelector("#presenter-pause-timer");
  const minusMinuteButton = frame.querySelector("#presenter-minus-minute");
  const plusMinuteButton = frame.querySelector("#presenter-plus-minute");
  const progressNode = frame.querySelector("#presenter-timer-progress");
  const timerAutoStartToggle = document.createElement("label");
  timerAutoStartToggle.className = "timer-autostart-toggle";
  timerAutoStartToggle.innerHTML = `<input id="presenter-timer-autostart" type="checkbox" checked /> Auto-start after first slide`;
  frame.querySelector('[data-panel-id="timer"] .presenter-panel__body').append(timerAutoStartToggle);
  const timerAutoStartInput = timerAutoStartToggle.querySelector("input");
  const openAudienceButton = createButton("Open Audience Window", "Open the audience presentation in a separate window or tab");
  const previousButton = createButton("<", "Previous Slide");
  previousButton.setAttribute("aria-label", "Previous Slide");
  const nextButton = createButton(">", "Next Slide");
  nextButton.setAttribute("aria-label", "Next Slide");
  const timerStatusButton = createButton("Timer: 30", "Restore or focus the timer panel");
  timerStatusButton.className = "timer-status-button";
  const zoomOutButton = createButton("A-", "Make slide text smaller in presenter and audience views");
  const zoomResetButton = createButton("A", "Reset slide text size in presenter and audience views");
  const zoomInButton = createButton("A+", "Make slide text larger in presenter and audience views");
  const collapsedPanelsNode = document.createElement("div");
  collapsedPanelsNode.className = "collapsed-panel-actions";
  const lockToggleButton = createButton("Unlock", "Unlock panel positioning controls");
  lockToggleButton.className = "unlock-mode-toggle";
  const sttToggleButton = sttSupported
    ? createButton("🎙 Turn Off Captions", "Turn off live speech-to-text captions")
    : null;
  if (sttToggleButton) {
    sttToggleButton.className = "stt-toggle-button";
    sttToggleButton.dataset.sttActive = "true";
  }
  actions.append(openAudienceButton, previousButton, nextButton, timerStatusButton, collapsedPanelsNode, zoomOutButton, zoomResetButton, zoomInButton);
  if (sttToggleButton) actions.append(sttToggleButton);
  addColorModeToggle(actions);
  actions.append(lockToggleButton);
  let timerAutoStart = true;

  function getAudiencePresentationUrl() {
    const audienceUrl = new URL("../present/", window.location.href);
    audienceUrl.hash = buildPresentationHash(activeSlideIndex, revealStep);
    return audienceUrl.toString();
  }

  function publishState() {
    sync.postMessage({
      type: "slide-changed",
      activeSlideIndex,
      revealStep,
      source,
      textZoom,
      timestamp: Date.now(),
    });
  }

  function syncTimerForSlideChange(previousSlideIndex = activeSlideIndex) {
    const durationMinutes = getPresentationDurationMinutes(compiled.metadata);
    if (activeSlideIndex === 0) {
      timerState = resetPresenterTimer(timerState, durationMinutes, Date.now());
      return;
    }

    if (timerAutoStart && previousSlideIndex === 0 && activeSlideIndex > 0 && !timerState.started) {
      timerState = setPresenterTimerPaused(timerState, false, Date.now());
    }
  }

  function applyLayout() {
    const panelsById = getPresenterPanelLayoutMap(panelLayout);
    [...layoutGrid.querySelectorAll(".presenter-panel")].forEach((panelNode) => {
      const panelId = panelNode.dataset.panelId;
      const panel = panelsById.get(panelId);
      panelNode.style.gridColumn = `span ${panel?.span || 4}`;
      panelNode.style.order = String(panel?.order ?? 0);
      panelNode.hidden = panel?.mode === "collapsed";
      panelNode.classList.toggle("presenter-panel--fullscreen", panel?.mode === "fullscreen");
    });

    const currentPanel = panelsById.get("current");
    if (currentPanel) {
      const defaultSpan = 5;
      const spanScale = (currentPanel.span || defaultSpan) / defaultSpan;
      currentFrame.style.setProperty("--panel-span-scale", String(spanScale));
    }

    layoutGrid.classList.toggle("presenter-layout--controls-locked", panelControlsLocked);

    collapsedPanelsNode.innerHTML = panelLayout
      .filter((panel) => panel.mode === "collapsed" && panel.id !== "timer")
      .map(
        (panel) =>
          `<button type="button" data-expand-panel="${panel.id}" title="Restore ${panel.title}">${panel.title}</button>`,
      )
      .join("");

    [...layoutGrid.querySelectorAll(".presenter-panel__controls")].forEach((controlsNode) => {
      const panelId = controlsNode.querySelector("[data-panel-id]")?.dataset.panelId;
      const panel = panelsById.get(panelId);
      const shrinkButton = controlsNode.querySelector('[data-action="shrink"]');
      const growButton = controlsNode.querySelector('[data-action="grow"]');
      if (!panel || !shrinkButton || !growButton) return;
      shrinkButton.textContent = panel.mode === "fullscreen" || panel.span <= 3 ? "_" : "-";
      shrinkButton.title =
        panel.mode === "fullscreen"
          ? "Exit full screen"
          : panel.span <= 3
            ? "Minimize this panel"
            : "Make this panel narrower";
      growButton.textContent = panel.mode === "fullscreen" ? "+" : panel.span >= 12 ? "□" : "+";
      growButton.title =
        panel.mode === "fullscreen"
          ? "Already full screen"
          : panel.span >= 12
            ? "Make this panel full screen"
            : "Make this panel wider";
    });
  }

  function render() {
    compiled = compileSource(source);
    applyDeckTheme(compiled.metadata);
    const nextCaptionConfig = getCaptionConfig(compiled.metadata);
    captionMonitor.update(nextCaptionConfig);
    captionConfig = nextCaptionConfig;
    const currentSlide = compiled.renderedSlides[activeSlideIndex] || compiled.renderedSlides[0];
    const nextSlide = compiled.renderedSlides[activeSlideIndex + 1];
    const metadataDuration = getPresentationDurationMinutes(compiled.metadata);
    if (!timerState || timerState.durationMinutes <= 0) {
      timerState = createPresenterTimerState(metadataDuration);
    }
    mountSlideInto(currentFrame, currentSlide, { revealStep });
    currentFrame.style.setProperty("--presentation-text-zoom", String(textZoom));
    nextFrame.innerHTML = nextSlide
      ? `<article class="slide-card slide-card--next"><div class="slide-card__content">${nextSlide.html}</div></article>`
      : `<article class="slide-card slide-card--next empty-state"><p>No next slide.</p></article>`;
    nextFrame.style.setProperty("--presentation-text-zoom", String(textZoom));
    notesNode.innerHTML = buildSupplementalHtml(currentSlide);
    if (sttSupported) {
      captionsPanel.hidden = false;
      if (sttState.error === "not-allowed" || sttState.error === "service-not-allowed") {
        captionsStatusNode.textContent = "Live Captions · microphone permission denied";
        captionsNode.textContent = "Microphone access was denied. Enable it in your browser settings to use live captions.";
      } else {
        captionsStatusNode.textContent = sttEnabled
          ? `Live Captions · ${sttState.active ? "listening" : "starting…"}`
          : "Live Captions · off";
        captionsNode.textContent = sttState.text || (sttEnabled ? "Listening for speech…" : "Live captions are paused.");
      }
      if (sttToggleButton) {
        sttToggleButton.textContent = sttEnabled ? "🎙 Turn Off Captions" : "🎙 Turn On Captions";
        sttToggleButton.dataset.sttActive = String(sttEnabled);
        sttToggleButton.title = sttEnabled ? "Turn off live speech-to-text captions" : "Turn on live speech-to-text captions";
      }
    } else {
      captionsPanel.hidden = !captionsState.available;
      captionsStatusNode.textContent = captionsState.available
        ? `${captionsState.provider === "whisper.cpp" ? "whisper.cpp" : "Caption source"} · ${captionsState.active ? "live" : "connected"}`
        : "";
      captionsNode.textContent = captionsState.text || "Caption source is available and waiting for speech.";
    }
    outlineNode.innerHTML = compiled.renderedSlides
      .map((renderedSlide, index) => {
        const currentClass = index === activeSlideIndex ? ' class="is-current"' : "";
        return `<li${currentClass}><button type="button" data-slide-index="${index}">${getSlideTitle(renderedSlide, index)}</button></li>`;
      })
      .join("");
    const timerTone = getPresenterTimerTone(timerState);
    timerNode.textContent = formatPresenterTimerMinutes(timerState.remainingMs);
    timerNode.dataset.tone = timerTone;
    remainingNode.textContent =
      activeSlideIndex === 0 && !timerState.started
        ? `Ready on slide 1 · ${timerState.durationMinutes} min total`
        : `${timerState.paused ? "Paused" : "Time left"} · ${Math.ceil(timerState.remainingMs / 60000)} min of ${timerState.durationMinutes}`;
    pauseTimerButton.textContent = timerState.started ? (timerState.paused ? "Resume" : "Pause") : "Start";
    progressNode.style.setProperty("--timer-progress", `${getPresenterTimerProgress(timerState) * 100}%`);
    progressNode.dataset.tone = timerTone;
    timerStatusButton.textContent = `Timer: ${Math.ceil(timerState.remainingMs / 60000)}`;
    timerStatusButton.dataset.tone = timerTone;
    timerStatusButton.title =
      panelLayout.find((panel) => panel.id === "timer")?.mode === "collapsed"
        ? "Restore the timer panel"
        : "Timer panel is open";
    timerAutoStartInput.checked = timerAutoStart;
    applyLayout();
  }

  function move(delta) {
    compiled = compileSource(source);
    const previousSlideIndex = activeSlideIndex;
    const nextPosition =
      delta > 0
        ? getNextPosition(compiled, activeSlideIndex, revealStep)
        : getPreviousPosition(compiled, activeSlideIndex, revealStep);
    activeSlideIndex = nextPosition.activeSlideIndex;
    revealStep = nextPosition.revealStep;
    syncTimerForSlideChange(previousSlideIndex);
    if (sttSource && sttEnabled) {
      sttSource.clearText();
      sync.postMessage({ type: "caption-update", text: "", timestamp: Date.now() });
    }
    render();
    publishState();
  }

  function updateZoom(delta) {
    textZoom = Math.max(0.85, Math.min(1.6, Number((textZoom + delta).toFixed(2))));
    render();
    publishState();
  }

  sync.subscribe((message) => {
    const previousSlideIndex = activeSlideIndex;
    if (message.source) {
      source = message.source;
    }
    if (typeof message.activeSlideIndex === "number") {
      activeSlideIndex = message.activeSlideIndex;
    }
    if (typeof message.revealStep === "number") {
      revealStep = message.revealStep;
    }
    if (typeof message.textZoom === "number") {
      textZoom = message.textZoom;
    }
    syncTimerForSlideChange(previousSlideIndex);
    render();
  });

  previousButton.addEventListener("click", () => move(-1));
  nextButton.addEventListener("click", () => move(1));
  timerStatusButton.addEventListener("click", () => {
    const timerPanel = panelLayout.find((panel) => panel.id === "timer");
    if (timerPanel?.mode === "collapsed") {
      panelLayout = expandPresenterPanel(panelLayout, "timer");
      savePresenterLayout(panelLayout);
      applyLayout();
      return;
    }
    const timerNode = layoutGrid.querySelector('[data-panel-id="timer"]');
    timerNode?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  });
  openAudienceButton.addEventListener("click", () => {
    window.open(getAudiencePresentationUrl(), "markdown-slides-audience", "noopener,noreferrer");
  });
  zoomOutButton.addEventListener("click", () => updateZoom(-0.1));
  zoomResetButton.addEventListener("click", () => {
    textZoom = 1;
    render();
    publishState();
  });
  zoomInButton.addEventListener("click", () => updateZoom(0.1));

  lockToggleButton.addEventListener("click", () => {
    panelControlsLocked = !panelControlsLocked;
    if (panelControlsLocked) {
      lockToggleButton.textContent = "Unlock";
      lockToggleButton.title = "Unlock panel positioning controls";
      lockToggleButton.className = "unlock-mode-toggle";
    } else {
      lockToggleButton.textContent = "Lock";
      lockToggleButton.title = "Lock panel positioning controls";
      lockToggleButton.className = "lock-mode-toggle";
    }
    applyLayout();
  });

  nextFrame.addEventListener("click", () => {
    if (compiled.renderedSlides[activeSlideIndex + 1]) {
      const previousSlideIndex = activeSlideIndex;
      activeSlideIndex += 1;
      revealStep = 0;
      syncTimerForSlideChange(previousSlideIndex);
      render();
      publishState();
    }
  });

  outlineNode.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-slide-index]");
    if (!button) return;
    const previousSlideIndex = activeSlideIndex;
    activeSlideIndex = Number.parseInt(button.dataset.slideIndex, 10) || 0;
    revealStep = 0;
    syncTimerForSlideChange(previousSlideIndex);
    render();
    publishState();
  });

  layoutGrid.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action][data-panel-id]");
    if (!button) return;
    const { action, panelId } = button.dataset;
    if (action === "grow") {
      panelLayout = resizePresenterPanel(panelLayout, panelId, 1);
    }
    if (action === "shrink") {
      panelLayout = resizePresenterPanel(panelLayout, panelId, -1);
    }
    if (action === "left") {
      panelLayout = movePresenterPanel(panelLayout, panelId, -1);
    }
    if (action === "right") {
      panelLayout = movePresenterPanel(panelLayout, panelId, 1);
    }
    savePresenterLayout(panelLayout);
    applyLayout();
  });

  collapsedPanelsNode.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-expand-panel]");
    if (!button) return;
    panelLayout = expandPresenterPanel(panelLayout, button.dataset.expandPanel);
    savePresenterLayout(panelLayout);
    applyLayout();
  });

  document.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
      event.preventDefault();
      move(1);
    }

    if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      move(-1);
    }

    if (event.key.toLowerCase() === "d") {
      event.preventDefault();
      toggleColorMode();
    }

    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      updateZoom(0.1);
    }

    if (event.key === "-") {
      event.preventDefault();
      updateZoom(-0.1);
    }

    if (event.key === "0") {
      event.preventDefault();
      textZoom = 1;
      render();
      publishState();
    }
  });

  window.setInterval(() => {
    timerState = tickPresenterTimer(timerState, Date.now());
    render();
  }, 1000);

  minusMinuteButton.addEventListener("click", () => {
    timerState = adjustPresenterTimerMinutes(timerState, -1);
    render();
  });

  plusMinuteButton.addEventListener("click", () => {
    timerState = adjustPresenterTimerMinutes(timerState, 1);
    render();
  });

  pauseTimerButton.addEventListener("click", () => {
    timerState = setPresenterTimerPaused(timerState, !timerState.paused, Date.now());
    render();
  });

  resetTimerButton.addEventListener("click", () => {
    timerState = resetPresenterTimer(timerState, getPresentationDurationMinutes(compiled.metadata), Date.now());
    render();
  });

  timerAutoStartInput.addEventListener("change", () => {
    timerAutoStart = timerAutoStartInput.checked;
  });

  if (sttToggleButton) {
    sttToggleButton.addEventListener("click", () => {
      sttEnabled = !sttEnabled;
      if (sttEnabled) {
        sttSource.start();
      } else {
        sttSource.stop();
        sync.postMessage({ type: "caption-update", text: "", timestamp: Date.now() });
      }
      render();
    });
  }

  const captionsLanguageSelect = sttSupported ? frame.querySelector("#captions-language-select") : null;
  if (captionsLanguageSelect && sttSource) {
    captionsLanguageSelect.addEventListener("change", () => {
      sttSource.setLanguage(captionsLanguageSelect.value);
    });
  }

  render();
  publishState();
  captionMonitor.start();
  if (sttSource && sttEnabled) {
    sttSource.start();
  }
}
