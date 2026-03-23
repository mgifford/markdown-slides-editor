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

export function normalizePresentationPosition(deck, activeSlideIndex = 0, revealStep = 0) {
  const slideCount = deck?.renderedSlides?.length || 0;
  if (!slideCount) {
    return { activeSlideIndex: 0, revealStep: 0 };
  }

  const safeSlideIndex = Math.max(0, Math.min(slideCount - 1, activeSlideIndex));
  const safeRevealState = createRevealState(deck.renderedSlides[safeSlideIndex], revealStep);
  return {
    activeSlideIndex: safeSlideIndex,
    revealStep: safeRevealState.revealStep,
  };
}

export function parsePresentationHash(hash, deck) {
  const match = /^#(\d+)(?:\.(\d+))?$/.exec(hash || "");
  if (!match) return null;

  const slideNumber = Number.parseInt(match[1], 10);
  const revealNumber = match[2] ? Number.parseInt(match[2], 10) : 0;

  if (!Number.isFinite(slideNumber) || slideNumber < 1) return null;

  return normalizePresentationPosition(deck, slideNumber - 1, Math.max(0, revealNumber));
}

export function buildPresentationHash(activeSlideIndex, revealStep = 0) {
  const slideNumber = Math.max(1, activeSlideIndex + 1);
  return revealStep > 0 ? `#${slideNumber}.${revealStep}` : `#${slideNumber}`;
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
