---
work_package_id: "WP01"
subtasks:
  - "T001"
  - "T002"
  - "T003"
  - "T004"
  - "T005"
  - "T006"
title: "Fix Hero Image Timed Transitions"
phase: "Phase 1 - Foundation"
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
review_status: ""
reviewed_by: ""
dependencies: []
history:
  - timestamp: "2026-05-24T18:00:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---

# Work Package Prompt: WP01 – Fix Hero Image Timed Transitions

## ⚠️ IMPORTANT: Review Feedback Status

**Read this first if you are implementing this task!**

- **Has review feedback?**: Check the `review_status` field above. If it says `has_feedback`, scroll to the **Review Feedback** section immediately.
- **You must address all feedback** before your work is complete.

---

## Review Feedback

*[This section is empty initially. Reviewers will populate it if the work is returned from review.]*

---

## Objectives & Success Criteria

Make the `stay-N transition-N final-N` hero image directive parameters produce visible timed transitions in audience presentation view.

**Success criteria**:
- A hero slide with `stay-5 transition-10 final-0.2` shows the image at full opacity for ~5 seconds, then fades to 20% over ~10 seconds while overlay text appears
- A hero slide with `stay-0 transition-0` shows the final state immediately
- Editor preview shows the final state without animation
- Navigating away from a slide mid-transition produces no visual artifacts
- `prefers-reduced-motion: reduce` suppresses all hero transitions
- All existing tests pass (`npm test`)

## Context & Constraints

**Root cause**: `mountSlideInto()` in `src/modules/views/shared.js:110` renders slides with `class="... active"` in the innerHTML. CSS transitions require a state change — the browser needs to paint the initial state (no `active`) before adding `active` to trigger the transition. Because `active` is present from the first paint, the browser jumps to the final state.

**Key files**:
- `src/modules/views/shared.js` — `mountSlideInto()` function (line 83-130)
- `src/modules/views/presentation-view.js` — audience view rendering
- `src/modules/views/presenter-view.js` — presenter view (should NOT animate)
- `src/modules/views/editor-view.js` — editor preview (should NOT animate)
- `styles/app.css` — hero transition CSS (lines 1126-1237)

**CSS already works**: The `--hero-stay`, `--hero-transition`, `--hero-final` custom properties are correctly parsed from the directive in `src/modules/markdown.js` and set as inline styles. The CSS `transition` and `transition-delay` rules at `app.css:1142-1146` correctly consume these variables. Only the class-application timing is broken.

**Constitution constraints**: No new dependencies. No build step changes. Must respect `prefers-reduced-motion`.

**References**:
- [spec.md](../spec.md) — User Story 1, FR-001, FR-004, FR-009, FR-010, FR-011
- [plan.md](../plan.md) — WP01 section
- [research.md](../research.md) — R1: Hero Transition Activation Mechanism
- [data-model.md](../data-model.md) — Hero Transition State entity

## Subtasks & Detailed Guidance

### Subtask T001 – Add `deferActivation` option to `mountSlideInto()`

**Purpose**: Allow callers to control whether the `active` class is applied immediately or deferred, so the presentation view can trigger CSS transitions while the editor preview stays static.

**Steps**:
1. In `src/modules/views/shared.js`, modify the `mountSlideInto()` function:
   - Add a `deferActivation` option to the `options` parameter (default: `false`)
   - When `deferActivation` is `false` (default): keep current behavior — `active` class is in the innerHTML
   - When `deferActivation` is `true`: render the slide HTML WITHOUT the `active` class in the `<article>` element
   - Return information about whether activation was deferred so the caller can handle it

2. The `<article>` template at line 110 currently reads:
   ```html
   <article class="${slideClass} active"...>
   ```
   When `deferActivation` is true, render it as:
   ```html
   <article class="${slideClass}"...>
   ```

**Files**: `src/modules/views/shared.js`
**Notes**: The `active` class is used by the CSS at `app.css:1230-1237` to trigger the hero transition. Non-hero slides also get this class, but it has no CSS effect on them — so deferring it for all slides in presentation view is safe.

### Subtask T002 – Apply deferred activation in presentation view

**Purpose**: Make the audience presentation view use deferred activation so CSS transitions fire correctly.

**Steps**:
1. In `src/modules/views/presentation-view.js`, find the `render()` function (line 145)
2. The call to `mountSlideInto(frameNode, slide, { revealStep })` needs to:
   - Pass `deferActivation: true` in the options
   - After `mountSlideInto()` returns, use `requestAnimationFrame` to add the `active` class to the `<article>` element inside `frameNode`
3. Implementation pattern:
   ```javascript
   mountSlideInto(frameNode, slide, { revealStep, deferActivation: true });
   requestAnimationFrame(() => {
     const article = frameNode.querySelector("article.slide-card");
     if (article) article.classList.add("active");
   });
   ```
4. Verify that `presenter-view.js` and `editor-view.js` do NOT use `deferActivation` — they should keep the default `false` so they show the final state immediately.

**Files**: `src/modules/views/presentation-view.js`
**Notes**: A single `requestAnimationFrame` should be sufficient — the browser paints the initial state (image at full opacity, overlay hidden), then the class change triggers the CSS transition. Double-RAF (`requestAnimationFrame(() => requestAnimationFrame(() => ...))`) is sometimes needed but try single first.

### Subtask T003 – Clean up active class on slide navigation

**Purpose**: When navigating away from a hero slide mid-transition, ensure the transition is canceled cleanly with no visual artifacts on the next slide.

**Steps**:
1. In `presentation-view.js`, before calling `mountSlideInto()` for the new slide, cancel any pending `requestAnimationFrame` from the previous slide
2. Store the RAF handle from T002 in a variable scoped to the render function:
   ```javascript
   let pendingActivation = null;
   // In render():
   if (pendingActivation) cancelAnimationFrame(pendingActivation);
   mountSlideInto(frameNode, slide, { revealStep, deferActivation: true });
   pendingActivation = requestAnimationFrame(() => {
     const article = frameNode.querySelector("article.slide-card");
     if (article) article.classList.add("active");
     pendingActivation = null;
   });
   ```
3. Since `mountSlideInto()` replaces `container.innerHTML`, the old slide's DOM is already removed — no explicit cleanup of the old `active` class is needed. The key is canceling any pending RAF that hasn't fired yet.

**Files**: `src/modules/views/presentation-view.js`
**Notes**: The `innerHTML` replacement in `mountSlideInto()` naturally destroys the old slide's DOM, so mid-transition CSS states don't persist. The RAF cancellation prevents a stale callback from firing on the new slide's DOM.

### Subtask T004 – Add `prefers-reduced-motion` rule

**Purpose**: Suppress hero transitions when the user has enabled reduced-motion preferences (FR-004, WCAG 2.2).

**Steps**:
1. In `styles/app.css`, add a media query after the hero transition rules (after line ~1237):
   ```css
   @media (prefers-reduced-motion: reduce) {
     .image-hero-slide .layout-image-hero__image {
       transition: none;
     }
     .image-hero-slide .layout-image-hero__overlay {
       transition: none;
     }
   }
   ```
2. This ensures that when `active` is added (even deferred), the state change happens instantly — no animation.
3. The slide still shows the final state (dimmed image, visible text) — it just gets there without animation.

**Files**: `styles/app.css`
**Notes**: This does NOT change the `active` class logic — it only removes the CSS transition so the state change is instant. The visual end result is identical; only the animation is skipped.

### Subtask T005 – Test deferred activation behavior

**Purpose**: Verify `mountSlideInto()` respects the `deferActivation` option.

**Steps**:
1. Add a new test (or extend existing tests) that:
   - Calls `mountSlideInto(container, renderedSlide, { deferActivation: true })`
   - Asserts the `<article>` element does NOT have the `active` class after the call
   - Calls `mountSlideInto(container, renderedSlide, {})` (default)
   - Asserts the `<article>` element DOES have the `active` class after the call
2. This is a unit-level test using the Node test runner — no browser needed. Create a minimal mock container (a `div` element from JSDOM or similar, or just check the innerHTML string).
3. Since the project uses Node's built-in test runner with no DOM library, the test can verify the innerHTML string contains or doesn't contain `class="... active"`.

**Files**: New or existing test file under `tests/`
**Notes**: The existing tests mock DOM elements minimally. Follow the same pattern — see `tests/parser.test.js` for examples.

### Subtask T006 – Verify editor preview remains static

**Purpose**: Confirm that the editor preview and presenter view still show hero slides in their final state without animation (FR-009).

**Steps**:
1. Check `src/modules/views/editor-view.js` — the `mountSlideInto()` call should NOT pass `deferActivation: true`. Verify this is the case.
2. Check `src/modules/views/presenter-view.js` — same verification.
3. Manual verification: open the editor at `http://localhost:4173/`, load a deck with a hero slide that has `stay-5 transition-10`, and verify the preview shows the final state immediately (no 5-second wait).
4. Open presenter view at `http://localhost:4173/presenter/` and verify the same.

**Files**: `src/modules/views/editor-view.js`, `src/modules/views/presenter-view.js` (read-only verification)

## Test Strategy

- Run `npm test` after changes to verify all 310+ existing tests pass
- New test in T005 for deferred activation
- Manual browser verification for T002, T003, T004, T006 (animation timing can't be tested in Node)

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Single `requestAnimationFrame` isn't enough — transition doesn't fire | Try double-RAF: `requestAnimationFrame(() => requestAnimationFrame(() => ...))`. This is a known pattern for some browsers. |
| Non-hero slides are affected by the class deferral | `active` class has no CSS effect on non-hero slides — no visual change. But verify with manual testing. |
| Rapid navigation causes stale RAF callbacks | T003 handles this with `cancelAnimationFrame`. |
| `prefers-reduced-motion` test is hard to automate | Manual testing with browser dev tools override is sufficient. |

## Review Guidance

- Verify the `active` class is NOT in the initial innerHTML when `deferActivation` is true
- Verify editor and presenter views are unchanged (no deferral)
- Test a hero slide with `stay-5 transition-10 final-0.2` in audience view — should see 5s image, then 10s fade
- Test rapid clicking through hero slides — no visual glitches
- Test with `prefers-reduced-motion: reduce` in browser settings — transition should be instant

## Activity Log

- 2026-05-24T18:00:00Z – system – lane=planned – Prompt created.
