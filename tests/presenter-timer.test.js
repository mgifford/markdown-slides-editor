import test from "node:test";
import assert from "node:assert/strict";
import {
  adjustPresenterTimerMinutes,
  createPresenterTimerState,
  formatPresenterTimerMinutes,
  getPresenterTimerProgress,
  getPresenterTimerTone,
  resetPresenterTimer,
  setPresenterTimerPaused,
  tickPresenterTimer,
} from "../src/modules/presenter-timer.js";

test("createPresenterTimerState uses minute durations and milliseconds", () => {
  const state = createPresenterTimerState(30);
  assert.equal(state.durationMinutes, 30);
  assert.equal(state.remainingMs, 30 * 60 * 1000);
  assert.equal(state.paused, true);
  assert.equal(state.started, false);
});

test("tickPresenterTimer decreases remaining time when not paused", () => {
  const base = {
    durationMinutes: 30,
    remainingMs: 30 * 60 * 1000,
    paused: false,
    started: true,
    lastTickAt: 1000,
  };
  const next = tickPresenterTimer(base, 61000);
  assert.equal(next.remainingMs, 29 * 60 * 1000);
});

test("tickPresenterTimer does not decrease remaining time when paused", () => {
  const base = {
    durationMinutes: 30,
    remainingMs: 30 * 60 * 1000,
    paused: true,
    lastTickAt: 1000,
  };
  const next = tickPresenterTimer(base, 61000);
  assert.equal(next.remainingMs, 30 * 60 * 1000);
});

test("adjustPresenterTimerMinutes changes both duration and remaining time safely", () => {
  const base = createPresenterTimerState(10);
  const increased = adjustPresenterTimerMinutes(base, 2);
  assert.equal(increased.durationMinutes, 12);
  assert.equal(increased.remainingMs, 12 * 60 * 1000);

  const decreased = adjustPresenterTimerMinutes(increased, -5);
  assert.equal(decreased.durationMinutes, 7);
  assert.equal(decreased.remainingMs, 7 * 60 * 1000);
});

test("formatPresenterTimerMinutes rounds up to whole minutes", () => {
  assert.equal(formatPresenterTimerMinutes(30 * 60 * 1000), "30 min");
  assert.equal(formatPresenterTimerMinutes(29 * 60 * 1000 + 1), "30 min");
  assert.equal(formatPresenterTimerMinutes(0), "0 min");
});

test("presenter timer tone reflects remaining progress", () => {
  const safe = createPresenterTimerState(30);
  assert.equal(getPresenterTimerTone(safe), "safe");

  const caution = {
    ...safe,
    remainingMs: 6 * 60 * 1000,
  };
  assert.equal(getPresenterTimerTone(caution), "caution");

  const warning = {
    ...safe,
    remainingMs: 3 * 60 * 1000,
  };
  assert.equal(getPresenterTimerTone(warning), "warning");

  const danger = {
    ...safe,
    remainingMs: 1 * 60 * 1000,
  };
  assert.equal(getPresenterTimerTone(danger), "danger");
  assert.equal(getPresenterTimerProgress(danger) <= 0.05, true);
});

test("resetPresenterTimer restores the countdown and unpauses it", () => {
  const paused = setPresenterTimerPaused(createPresenterTimerState(20), true, 1000);
  const reset = resetPresenterTimer(paused, 25, 2000);
  assert.equal(reset.durationMinutes, 25);
  assert.equal(reset.remainingMs, 25 * 60 * 1000);
  assert.equal(reset.paused, true);
  assert.equal(reset.started, false);
  assert.equal(reset.lastTickAt, 2000);
});
