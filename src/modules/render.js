import { renderMarkdown } from "./markdown.js";

export function renderDeck(deck) {
  const renderedSlides = deck.slides.map((slide) => {
    const rendered = renderMarkdown(slide.body);
    const noteRender = slide.notes ? renderMarkdown(slide.notes) : null;
    return {
      ...slide,
      html: rendered.html,
      headings: rendered.headings,
      stepCount: rendered.stepCount,
      notesHtml: noteRender?.html || "",
    };
  });

  return {
    ...deck,
    renderedSlides,
  };
}
