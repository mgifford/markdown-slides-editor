export function getSlideTitle(slide, fallbackIndex) {
  const explicitHeading = slide?.headings?.find((heading) => heading.level === 1)?.text;
  return explicitHeading || `Slide ${fallbackIndex + 1}`;
}

export function getPresentationDurationMinutes(metadata) {
  const value = Number.parseInt(metadata.durationMinutes, 10);
  return Number.isFinite(value) && value > 0 ? value : 30;
}

export function createRevealState(renderedSlide, revealStep = 0) {
  const stepCount = renderedSlide?.stepCount || 0;
  return {
    revealStep: Math.max(0, Math.min(stepCount, revealStep)),
    stepCount,
  };
}

export function getNextPosition(deck, activeSlideIndex, revealStep) {
  const currentSlide = deck.renderedSlides[activeSlideIndex];
  const stepCount = currentSlide?.stepCount || 0;

  if (revealStep < stepCount) {
    return { activeSlideIndex, revealStep: revealStep + 1 };
  }

  return {
    activeSlideIndex: Math.min(deck.renderedSlides.length - 1, activeSlideIndex + 1),
    revealStep: 0,
  };
}

export function getPreviousPosition(deck, activeSlideIndex, revealStep) {
  if (revealStep > 0) {
    return { activeSlideIndex, revealStep: revealStep - 1 };
  }

  const previousSlideIndex = Math.max(0, activeSlideIndex - 1);
  const previousSlide = deck.renderedSlides[previousSlideIndex];
  return {
    activeSlideIndex: previousSlideIndex,
    revealStep: previousSlide?.stepCount || 0,
  };
}
