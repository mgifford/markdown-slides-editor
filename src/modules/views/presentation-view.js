import { createSyncChannel } from "../sync.js";
import {
  getNextPosition,
  getPresentationDurationMinutes,
  getPreviousPosition,
  getSlideTitle,
} from "../presentation-state.js";
import { applyDeckTheme } from "../theme.js";
import { compileSource, createButton, createDeckFrame, mountSlideInto } from "./shared.js";

export function createPresentationView(root, initialSource) {
  let source = initialSource;
  let activeSlideIndex = 0;
  let revealStep = 0;
  let compiled = compileSource(source);
  const sync = createSyncChannel();
  const frame = createDeckFrame("Audience View");
  const startedAt = Date.now();
  let tocOpen = false;

  frame.innerHTML += `
    <main class="presentation-layout">
      <div class="presentation-toolbar">
        <p id="presentation-status" class="meta-text"></p>
        <p id="presentation-timer" class="meta-text"></p>
      </div>
      <dialog id="presentation-toc" class="toc-dialog">
        <form method="dialog" class="toc-dialog__inner">
          <div class="toc-dialog__header">
            <p class="panel__label">Slide outline</p>
            <button type="submit">Close</button>
          </div>
          <ol id="presentation-outline" class="outline-list"></ol>
        </form>
      </dialog>
      <div id="presentation-frame" class="presentation-frame"></div>
    </main>
  `;

  root.replaceChildren(frame);

  const actions = frame.querySelector(".topbar__actions");
  const frameNode = frame.querySelector("#presentation-frame");
  const statusNode = frame.querySelector("#presentation-status");
  const timerNode = frame.querySelector("#presentation-timer");
  const tocNode = frame.querySelector("#presentation-toc");
  const outlineNode = frame.querySelector("#presentation-outline");
  const prevButton = createButton("Previous");
  const nextButton = createButton("Next");
  const tocButton = createButton("Outline");
  actions.append(prevButton, nextButton, tocButton);

  function updateTimer() {
    const totalMinutes = getPresentationDurationMinutes(compiled.metadata);
    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    const remainingSeconds = Math.max(0, totalMinutes * 60 - elapsedSeconds);
    const elapsedMinutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
    const elapsedRemainder = String(elapsedSeconds % 60).padStart(2, "0");
    const remainingMinutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
    const remainingRemainder = String(remainingSeconds % 60).padStart(2, "0");
    timerNode.textContent = `Elapsed ${elapsedMinutes}:${elapsedRemainder} · Remaining ${remainingMinutes}:${remainingRemainder}`;
  }

  function render() {
    compiled = compileSource(source);
    applyDeckTheme(compiled.metadata);
    const slide = compiled.renderedSlides[activeSlideIndex] || compiled.renderedSlides[0];
    activeSlideIndex = slide?.index || 0;
    mountSlideInto(frameNode, slide, { revealStep });
    statusNode.textContent = compiled.renderedSlides.length
      ? `${compiled.metadata.title || "Untitled deck"} · ${activeSlideIndex + 1} / ${compiled.renderedSlides.length} · ${revealStep}/${slide?.stepCount || 0} reveals`
      : `${compiled.metadata.title || "Untitled deck"} · No slides`;
    outlineNode.innerHTML = compiled.renderedSlides
      .map((renderedSlide, index) => {
        const currentClass = index === activeSlideIndex ? ' class="is-current"' : "";
        return `<li${currentClass}><button type="button" data-slide-index="${index}">${getSlideTitle(renderedSlide, index)}</button></li>`;
      })
      .join("");
    sync.postMessage({ type: "slide-changed", activeSlideIndex, revealStep, source, timestamp: Date.now() });
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
  }

  prevButton.addEventListener("click", () => move(-1));
  nextButton.addEventListener("click", () => move(1));
  tocButton.addEventListener("click", () => {
    tocOpen = !tocOpen;
    if (tocOpen) {
      tocNode.showModal();
    } else {
      tocNode.close();
    }
  });

  outlineNode.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-slide-index]");
    if (!button) return;
    activeSlideIndex = Number.parseInt(button.dataset.slideIndex, 10) || 0;
    revealStep = 0;
    tocOpen = false;
    tocNode.close();
    render();
  });

  tocNode.addEventListener("close", () => {
    tocOpen = false;
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

    if (event.key === "Home") {
      activeSlideIndex = 0;
      revealStep = 0;
      render();
    }

    if (event.key === "End") {
      activeSlideIndex = Math.max(0, compiled.renderedSlides.length - 1);
      revealStep = compiled.renderedSlides[activeSlideIndex]?.stepCount || 0;
      render();
    }

    if (event.key.toLowerCase() === "c") {
      event.preventDefault();
      tocButton.click();
    }
  });

  sync.subscribe((message) => {
    if (message.type === "deck-updated") {
      source = message.source || source;
      activeSlideIndex = message.activeSlideIndex ?? activeSlideIndex;
      revealStep = 0;
      render();
    }
  });

  window.setInterval(updateTimer, 1000);
  updateTimer();
  render();
}
