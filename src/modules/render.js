import { renderMarkdown } from "./markdown.js";

export function renderDeck(deck) {
  const renderedSlides = deck.slides.map((slide) => {
    const rendered = renderMarkdown(slide.body);
    return {
      ...slide,
      html: rendered.html,
      headings: rendered.headings,
      notesHtml: slide.notes ? renderMarkdown(slide.notes).html : "",
    };
  });

  return {
    ...deck,
    renderedSlides,
  };
}
