import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import {
  createPresenterTimerState,
  getPresenterTimerTone,
  resetPresenterTimer,
  setPresenterTimerPaused,
  tickPresenterTimer,
} from "../../src/modules/presenter-timer.js";

// ─── Shared state ─────────────────────────────────────────────────────────────

let timerState = null;
let durationMinutes = 20;

// ─── Givens ───────────────────────────────────────────────────────────────────

Given(
  "a presentation timer configured for {int} minutes",
  function (minutes) {
    durationMinutes = minutes;
    timerState = createPresenterTimerState(durationMinutes);
  },
);

// ─── Whens ────────────────────────────────────────────────────────────────────

When("the timer is reset", function () {
  if (!timerState) {
    timerState = createPresenterTimerState(durationMinutes);
  }
  timerState = resetPresenterTimer(timerState, durationMinutes, 0);
});

When("the timer is unpaused at t={int}", function (t) {
  timerState = setPresenterTimerPaused(timerState, false, t);
});

When("the timer ticks at t={int}", function (t) {
  timerState = tickPresenterTimer(timerState, t);
});

When("the timer elapses {int} seconds", function (seconds) {
  // Start the timer running from t=0, then tick to t=seconds*1000
  timerState = setPresenterTimerPaused(timerState, false, 0);
  timerState = tickPresenterTimer(timerState, seconds * 1000);
});

When("the timer is paused", function () {
  timerState = setPresenterTimerPaused(timerState, true, timerState.lastTickAt);
});

// ─── Thens ────────────────────────────────────────────────────────────────────

Then("the remaining milliseconds is {int}", function (expectedMs) {
  assert.equal(timerState.remainingMs, expectedMs);
});

Then("the timer tone is {string}", function (expectedTone) {
  const tone = getPresenterTimerTone(timerState);
  assert.equal(
    tone,
    expectedTone,
    `Expected timer tone "${expectedTone}" but got "${tone}" with remainingMs=${timerState.remainingMs}`,
  );
});
