import { parseSource } from "../parser.js";
import { renderDeck } from "../render.js";
import { lintDeck } from "../a11y.js";

export function compileSource(source) {
  const deck = parseSource(source);
  const renderedDeck = renderDeck(deck);
  const issues = lintDeck(deck, renderedDeck.renderedSlides);
  return {
    ...renderedDeck,
    issues,
  };
}

export function createDeckFrame(title) {
  const frame = document.createElement("div");
  frame.className = "app-shell";
  frame.innerHTML = `
    <header class="topbar">
      <div>
        <p class="eyebrow">Markdown Slides Editor</p>
        <h1>${title}</h1>
      </div>
      <div class="topbar__actions"></div>
    </header>
  `;
  return frame;
}

export function createButton(label, title) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  if (title) button.title = title;
  return button;
}

export function mountSlideInto(container, renderedSlide) {
  if (!renderedSlide) {
    container.innerHTML = `
      <article class="slide-card empty-state">
        <div class="slide-card__content">
          <h1>No slides yet</h1>
          <p>Add a slide with a level-one heading to start the deck.</p>
        </div>
      </article>
    `;
    return;
  }

  container.innerHTML = `
    <article class="slide-card">
      <div class="slide-card__content">
        ${renderedSlide.html}
      </div>
    </article>
  `;
}
