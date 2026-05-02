function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createPresenterTimerState(durationMinutes) {
  const normalizedDuration = Math.max(1, Number.parseInt(durationMinutes, 10) || 30);
  return {
    durationMinutes: normalizedDuration,
    remainingMs: normalizedDuration * 60 * 1000,
    paused: true,
    started: false,
    lastTickAt: Date.now(),
  };
}

export function tickPresenterTimer(timerState, now = Date.now()) {
  if (timerState.paused || !timerState.started) {
    return {
      ...timerState,
      lastTickAt: now,
    };
  }

  const elapsed = Math.max(0, now - timerState.lastTickAt);
  return {
    ...timerState,
    remainingMs: Math.max(0, timerState.remainingMs - elapsed),
    lastTickAt: now,
  };
}

export function setPresenterTimerPaused(timerState, paused, now = Date.now()) {
  return {
    ...timerState,
    paused,
    started: paused ? timerState.started : true,
    lastTickAt: now,
  };
}

export function adjustPresenterTimerMinutes(timerState, deltaMinutes) {
  const durationMinutes = clamp(timerState.durationMinutes + deltaMinutes, 1, 240);
  const deltaMs = deltaMinutes * 60 * 1000;
  return {
    ...timerState,
    durationMinutes,
    remainingMs: clamp(timerState.remainingMs + deltaMs, 0, durationMinutes * 60 * 1000),
  };
}

export function resetPresenterTimer(timerState, durationMinutes = timerState.durationMinutes, now = Date.now()) {
  const nextDuration = Math.max(1, Number.parseInt(durationMinutes, 10) || timerState.durationMinutes || 30);
  return {
    durationMinutes: nextDuration,
    remainingMs: nextDuration * 60 * 1000,
    paused: true,
    started: false,
    lastTickAt: now,
  };
}

export function formatPresenterTimerMinutes(remainingMs) {
  const remainingMinutes = Math.ceil(Math.max(0, remainingMs) / 60000);
  return `${remainingMinutes} min`;
}

export function getPresenterTimerProgress(timerState) {
  if (timerState.durationMinutes <= 0) return 0;
  return clamp(timerState.remainingMs / (timerState.durationMinutes * 60 * 1000), 0, 1);
}

export function getPresenterTimerTone(timerState) {
  const progress = getPresenterTimerProgress(timerState);
  if (progress <= 0.05) return "danger";
  if (progress <= 0.1) return "warning";
  if (progress <= 0.2) return "caution";
  return "safe";
}

export function getPaceIndicator(timerState, slideIndex, slideCount) {
  if (!timerState.started || slideCount <= 1) return null;
  const timeElapsedRatio = 1 - getPresenterTimerProgress(timerState);
  const slideProgress = slideIndex / (slideCount - 1);
  const pace = slideProgress - timeElapsedRatio;
  if (pace > 0.2) return "rabbit";
  if (pace < -0.2) return "turtle";
  return null;
}
