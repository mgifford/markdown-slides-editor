import { createSyncChannel } from "../sync.js";
import { createCaptionMonitor, getCaptionConfig } from "../captions.js";
import {
  buildPresentationHash,
  getNextPosition,
  normalizePresentationPosition,
  parsePresentationHash,
  getPreviousPosition,
  getSlideTitle,
} from "../presentation-state.js";
import { toggleColorMode } from "../color-mode.js";
import { applyDeckTheme } from "../theme.js";
import { compileSource, mountSlideInto } from "./shared.js";

export function createPresentationView(root, initialSource) {
  let source = initialSource;
  let activeSlideIndex = 0;
  let revealStep = 0;
  let textZoom = 1;
  let compiled = compileSource(source);
  const sync = createSyncChannel();
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
  let tocOpen = false;
  const frame = document.createElement("div");
  frame.className = "audience-shell";

  frame.innerHTML = `
    <main class="presentation-layout">
      <p id="presentation-status" class="sr-only" aria-live="polite"></p>
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
      <div id="live-caption-display" class="live-caption-display" aria-live="polite" aria-atomic="false" hidden></div>
    </main>
  `;

  root.replaceChildren(frame);

  const frameNode = frame.querySelector("#presentation-frame");
  const statusNode = frame.querySelector("#presentation-status");
  const tocNode = frame.querySelector("#presentation-toc");
  const outlineNode = frame.querySelector("#presentation-outline");
  const captionNode = frame.querySelector("#live-caption-display");

  // Keep a ResizeObserver so --caption-bar-height stays accurate even when
  // the caption text wraps across multiple lines as the presentation progresses.
  const captionResizeObserver = new ResizeObserver(updateCaptionSpacing);
  captionResizeObserver.observe(captionNode);

  function updateCaptionSpacing() {
    if (!captionNode.hidden && captionNode.textContent) {
      // Measure how much of the viewport the caption element occupies from its
      // top edge down to the bottom (including the fixed bottom gap).
      const rect = captionNode.getBoundingClientRect();
      const reserved = window.innerHeight - rect.top;
      frameNode.style.setProperty("--caption-bar-height", `${Math.max(0, reserved)}px`);
    } else {
      frameNode.style.removeProperty("--caption-bar-height");
    }
  }
  function applyHashPosition() {
    compiled = compileSource(source);
    const position = parsePresentationHash(window.location.hash, compiled);
    if (!position) return false;
    activeSlideIndex = position.activeSlideIndex;
    revealStep = position.revealStep;
    return true;
  }

  function updateHash() {
    const nextHash = buildPresentationHash(activeSlideIndex, revealStep);
    if (window.location.hash === nextHash) return;
    history.replaceState(null, "", nextHash);
  }

  function render() {
    compiled = compileSource(source);
    applyDeckTheme(compiled.metadata);
    const nextCaptionConfig = getCaptionConfig(compiled.metadata);
    captionMonitor.update(nextCaptionConfig);
    captionConfig = nextCaptionConfig;
    const position = normalizePresentationPosition(compiled, activeSlideIndex, revealStep);
    activeSlideIndex = position.activeSlideIndex;
    revealStep = position.revealStep;
    const slide = compiled.renderedSlides[activeSlideIndex] || compiled.renderedSlides[0];
    activeSlideIndex = slide?.index || 0;
    mountSlideInto(frameNode, slide, { revealStep });
    frameNode.style.setProperty("--presentation-text-zoom", String(textZoom));
    statusNode.textContent = compiled.renderedSlides.length
      ? `${compiled.metadata.title || "Untitled deck"} · ${activeSlideIndex + 1} / ${compiled.renderedSlides.length} · ${revealStep}/${slide?.stepCount || 0} reveals`
      : `${compiled.metadata.title || "Untitled deck"} · No slides`;
    outlineNode.innerHTML = compiled.renderedSlides
      .map((renderedSlide, index) => {
        const currentClass = index === activeSlideIndex ? ' class="is-current"' : "";
        return `<li${currentClass}><button type="button" data-slide-index="${index}">${getSlideTitle(renderedSlide, index)}</button></li>`;
      })
      .join("");
    captionNode.hidden = !captionsState.available || !captionsState.text;
    captionNode.textContent = captionsState.text;
    updateCaptionSpacing();
    updateHash();
    sync.postMessage({ type: "slide-changed", activeSlideIndex, revealStep, source, textZoom, timestamp: Date.now() });
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

  function toggleOutline() {
    tocOpen = !tocOpen;
    if (tocOpen) {
      tocNode.showModal();
    } else {
      tocNode.close();
    }
  }

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
    if (event.metaKey || event.ctrlKey || event.altKey) return;

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

    if (event.key.toLowerCase() === "o") {
      event.preventDefault();
      toggleOutline();
    }

    if (event.key.toLowerCase() === "d") {
      event.preventDefault();
      toggleColorMode();
    }
  });

  window.addEventListener("hashchange", () => {
    if (applyHashPosition()) {
      render();
    }
  });

  sync.subscribe((message) => {
    if (message.type === "deck-updated" || message.type === "slide-changed") {
      source = message.source || source;
      activeSlideIndex = message.activeSlideIndex ?? activeSlideIndex;
      revealStep = message.type === "slide-changed" ? message.revealStep ?? revealStep : 0;
      if (typeof message.textZoom === "number") {
        textZoom = message.textZoom;
      }
      render();
    }
    if (message.type === "caption-update") {
      captionNode.hidden = !message.text;
      captionNode.textContent = message.text || "";
      updateCaptionSpacing();
    }
  });

  applyHashPosition();
  render();
  captionMonitor.start();
}
