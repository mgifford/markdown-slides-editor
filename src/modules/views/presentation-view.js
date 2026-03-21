import { createSyncChannel } from "../sync.js";
import { compileSource, createButton, createDeckFrame, mountSlideInto } from "./shared.js";

export function createPresentationView(root, initialSource) {
  let source = initialSource;
  let activeSlideIndex = 0;
  const sync = createSyncChannel();
  const frame = createDeckFrame("Audience View");

  frame.innerHTML += `
    <main class="presentation-layout">
      <div class="presentation-toolbar">
        <p id="presentation-status" class="meta-text"></p>
      </div>
      <div id="presentation-frame" class="presentation-frame"></div>
    </main>
  `;

  root.replaceChildren(frame);

  const actions = frame.querySelector(".topbar__actions");
  const frameNode = frame.querySelector("#presentation-frame");
  const statusNode = frame.querySelector("#presentation-status");
  const prevButton = createButton("Previous");
  const nextButton = createButton("Next");
  actions.append(prevButton, nextButton);

  function render() {
    const compiled = compileSource(source);
    const slide = compiled.renderedSlides[activeSlideIndex] || compiled.renderedSlides[0];
    activeSlideIndex = slide?.index || 0;
    mountSlideInto(frameNode, slide);
    statusNode.textContent = compiled.renderedSlides.length
      ? `${compiled.metadata.title || "Untitled deck"} · ${activeSlideIndex + 1} / ${compiled.renderedSlides.length}`
      : `${compiled.metadata.title || "Untitled deck"} · No slides`;
    sync.postMessage({ type: "slide-changed", activeSlideIndex, source, timestamp: Date.now() });
  }

  function move(delta) {
    const compiled = compileSource(source);
    activeSlideIndex = Math.max(0, Math.min(compiled.renderedSlides.length - 1, activeSlideIndex + delta));
    render();
  }

  prevButton.addEventListener("click", () => move(-1));
  nextButton.addEventListener("click", () => move(1));

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

  sync.subscribe((message) => {
    if (message.type === "deck-updated") {
      source = message.source || source;
      activeSlideIndex = message.activeSlideIndex ?? activeSlideIndex;
      render();
    }
  });

  render();
}
