import { createSyncChannel } from "../sync.js";
import {
  getNextPosition,
  getPresentationDurationMinutes,
  getPreviousPosition,
  getSlideTitle,
} from "../presentation-state.js";
import {
  loadPresenterLayout,
  movePresenterPanel,
  resizePresenterPanel,
  savePresenterLayout,
} from "../presenter-layout.js";
import { applyDeckTheme } from "../theme.js";
import { compileSource, createButton, createDeckFrame, mountSlideInto } from "./shared.js";

function formatElapsed(startTime) {
  const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
  const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
  const seconds = String(elapsedSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function createPresenterView(root, initialSource) {
  let source = initialSource;
  let activeSlideIndex = 0;
  let revealStep = 0;
  const startedAt = Date.now();
  const sync = createSyncChannel();
  const frame = createDeckFrame("Presenter View");
  let panelLayout = loadPresenterLayout();

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
          <p id="presenter-timer" class="timer">00:00</p>
          <p id="presenter-remaining" class="meta-text"></p>
          <div class="presenter-timer-controls">
            <button type="button" id="presenter-reset-timer">Reset</button>
          </div>
        </div>
      </section>
      <section class="presenter-panel" data-panel-id="notes">
        <div class="presenter-panel__header">
          <p class="panel__label">Notes</p>
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
  `;

  root.replaceChildren(frame);

  const actions = frame.querySelector(".topbar__actions");
  const layoutGrid = frame.querySelector("#presenter-layout-grid");
  const currentFrame = frame.querySelector("#presenter-current");
  const nextFrame = frame.querySelector("#presenter-next");
  const notesNode = frame.querySelector("#presenter-notes");
  const timerNode = frame.querySelector("#presenter-timer");
  const remainingNode = frame.querySelector("#presenter-remaining");
  const outlineNode = frame.querySelector("#presenter-outline");
  const resetTimerButton = frame.querySelector("#presenter-reset-timer");
  const previousButton = createButton("Previous");
  const nextButton = createButton("Next");
  actions.append(previousButton, nextButton);
  let timerStart = startedAt;
  let lastDurationMinutes = 30;
  let compiled = compileSource(source);

  function publishState() {
    sync.postMessage({
      type: "slide-changed",
      activeSlideIndex,
      revealStep,
      source,
      timestamp: Date.now(),
    });
  }

  function applyLayout() {
    const panelsById = new Map(panelLayout.map((panel) => [panel.id, panel]));
    [...layoutGrid.querySelectorAll(".presenter-panel")].forEach((panelNode, index) => {
      const panelId = panelNode.dataset.panelId;
      const panel = panelsById.get(panelId);
      panelNode.style.gridColumn = `span ${panel?.span || 4}`;
      panelNode.style.order = String(index);
    });
  }

  function render() {
    compiled = compileSource(source);
    applyDeckTheme(compiled.metadata);
    const currentSlide = compiled.renderedSlides[activeSlideIndex] || compiled.renderedSlides[0];
    const nextSlide = compiled.renderedSlides[activeSlideIndex + 1];
    lastDurationMinutes = getPresentationDurationMinutes(compiled.metadata);
    mountSlideInto(currentFrame, currentSlide, { revealStep });
    nextFrame.innerHTML = nextSlide
      ? `<article class="slide-card slide-card--next"><div class="slide-card__content">${nextSlide.html}</div></article>`
      : `<article class="slide-card slide-card--next empty-state"><p>No next slide.</p></article>`;
    notesNode.innerHTML = currentSlide?.notesHtml || "<p>No speaker notes for this slide.</p>";
    outlineNode.innerHTML = compiled.renderedSlides
      .map((renderedSlide, index) => {
        const currentClass = index === activeSlideIndex ? ' class="is-current"' : "";
        return `<li${currentClass}><button type="button" data-slide-index="${index}">${getSlideTitle(renderedSlide, index)}</button></li>`;
      })
      .join("");

    const elapsedSeconds = Math.floor((Date.now() - timerStart) / 1000);
    const remainingSeconds = Math.max(0, lastDurationMinutes * 60 - elapsedSeconds);
    remainingNode.textContent = `Remaining ${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;
    applyLayout();
  }

  function move(delta) {
    compiled = compileSource(source);
    const nextPosition =
      delta > 0
        ? getNextPosition(compiled, activeSlideIndex, revealStep)
        : getPreviousPosition(compiled, activeSlideIndex, revealStep);
    activeSlideIndex = nextPosition.activeSlideIndex;
    revealStep = nextPosition.revealStep;
    render();
    publishState();
  }

  sync.subscribe((message) => {
    if (message.source) {
      source = message.source;
    }
    if (typeof message.activeSlideIndex === "number") {
      activeSlideIndex = message.activeSlideIndex;
    }
    if (typeof message.revealStep === "number") {
      revealStep = message.revealStep;
    }
    render();
  });

  previousButton.addEventListener("click", () => move(-1));
  nextButton.addEventListener("click", () => move(1));

  nextFrame.addEventListener("click", () => {
    if (compiled.renderedSlides[activeSlideIndex + 1]) {
      activeSlideIndex += 1;
      revealStep = 0;
      render();
      publishState();
    }
  });

  outlineNode.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-slide-index]");
    if (!button) return;
    activeSlideIndex = Number.parseInt(button.dataset.slideIndex, 10) || 0;
    revealStep = 0;
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

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
      event.preventDefault();
      move(1);
    }

    if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      move(-1);
    }
  });

  window.setInterval(() => {
    timerNode.textContent = formatElapsed(timerStart);
    const elapsedSeconds = Math.floor((Date.now() - timerStart) / 1000);
    const remainingSeconds = Math.max(0, lastDurationMinutes * 60 - elapsedSeconds);
    remainingNode.textContent = `Remaining ${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;
  }, 1000);

  resetTimerButton.addEventListener("click", () => {
    timerStart = Date.now();
    timerNode.textContent = formatElapsed(timerStart);
    render();
  });

  timerNode.textContent = formatElapsed(timerStart);
  render();
  publishState();
}
