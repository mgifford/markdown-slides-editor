import { createSyncChannel } from "../sync.js";
import { getPresentationDurationMinutes, getSlideTitle } from "../presentation-state.js";
import { applyDeckTheme } from "../theme.js";
import { compileSource, createDeckFrame, mountSlideInto } from "./shared.js";

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

  frame.innerHTML += `
    <main class="presenter-layout">
      <section class="presenter-column">
        <p class="panel__label">Current slide</p>
        <div id="presenter-current" class="preview-frame preview-frame--compact"></div>
      </section>
      <section class="presenter-column">
        <p class="panel__label">Next slide</p>
        <div id="presenter-next" class="preview-frame preview-frame--compact"></div>
      </section>
      <aside class="presenter-sidebar">
        <div class="presenter-sidebar__block">
          <p class="panel__label">Timer</p>
          <p id="presenter-timer" class="timer">00:00</p>
          <p id="presenter-remaining" class="meta-text"></p>
          <div class="presenter-timer-controls">
            <button type="button" id="presenter-reset-timer">Reset</button>
          </div>
        </div>
        <div class="presenter-sidebar__block">
          <p class="panel__label">Outline</p>
          <ol id="presenter-outline" class="outline-list"></ol>
        </div>
        <div class="presenter-sidebar__block">
          <p class="panel__label">Notes</p>
          <div id="presenter-notes" class="notes-content"></div>
        </div>
      </aside>
    </main>
  `;

  root.replaceChildren(frame);

  const currentFrame = frame.querySelector("#presenter-current");
  const nextFrame = frame.querySelector("#presenter-next");
  const notesNode = frame.querySelector("#presenter-notes");
  const timerNode = frame.querySelector("#presenter-timer");
  const remainingNode = frame.querySelector("#presenter-remaining");
  const outlineNode = frame.querySelector("#presenter-outline");
  const resetTimerButton = frame.querySelector("#presenter-reset-timer");
  let timerStart = startedAt;
  let lastDurationMinutes = 30;

  function render() {
    const compiled = compileSource(source);
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
        return `<li${currentClass}><span>${getSlideTitle(renderedSlide, index)}</span></li>`;
      })
      .join("");

    const elapsedSeconds = Math.floor((Date.now() - timerStart) / 1000);
    const remainingSeconds = Math.max(0, lastDurationMinutes * 60 - elapsedSeconds);
    remainingNode.textContent = `Remaining ${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;
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
}
