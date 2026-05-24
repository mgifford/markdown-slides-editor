---
work_package_id: WP02
title: Hero Overlay Light/Dark Mode
lane: planned
dependencies: []
subtasks:
- T007
- T008
- T009
- T010
- T011
- T012
phase: Phase 1 - Foundation
assignee: ''
agent: ''
shell_pid: ''
review_status: ''
reviewed_by: ''
history:
- timestamp: '2026-05-24T18:00:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
---

# Work Package Prompt: WP02 – Hero Overlay Light/Dark Mode

## ⚠️ IMPORTANT: Review Feedback Status

**Read this first if you are implementing this task!**

- **Has review feedback?**: Check the `review_status` field above. If it says `has_feedback`, scroll to the **Review Feedback** section immediately.

---

## Review Feedback

*[This section is empty initially.]*

---

## Objectives & Success Criteria

Make the hero overlay text box and text color adapt to the current color mode (light/dark) while keeping the background image identical in both modes.

**Success criteria**:
- Dark mode: overlay uses a dark semi-transparent background with light text
- Light mode: overlay uses a light semi-transparent background with dark text
- Both modes meet WCAG 2.2 AA contrast (4.5:1 for normal text)
- Hero background image appears identical regardless of color mode
- Show-all mode (`slide-card--image-hero-show-all`) also adapts correctly
- All existing tests pass

## Context & Constraints

**Current state**: The overlay at `styles/app.css:1149-1163` uses hardcoded values:
- `background: rgba(0, 0, 0, 0.6)` (always dark)
- `color: #fff` (always white)

The app's color mode system uses CSS custom properties set on `:root[data-color-mode="light"]` (line 68) and `:root[data-color-mode="dark"]` (line 86), plus a `prefers-color-scheme: dark` media query fallback (line 48).

**Depends on WP01**: The transitions fixed in WP01 should be in place before theming, so overlay appearance testing includes the animated state.

**References**:
- [spec.md](../spec.md) — User Story 2, FR-002, FR-003
- [plan.md](../plan.md) — WP02 section
- [research.md](../research.md) — R2: Hero Overlay Theming

## Subtasks & Detailed Guidance

### Subtask T007 – Define hero overlay CSS custom properties

**Purpose**: Create new custom properties specifically for hero overlays that can vary by color mode.

**Steps**:
1. In `styles/app.css`, add default values in the `:root` block (near the top, around line 3-15):
   ```css
   --hero-overlay-bg: rgba(0, 0, 0, 0.7);
   --hero-overlay-color: #fff;
   ```
2. These defaults match the dark-mode treatment (dark overlay on a photo is the natural default).

**Files**: `styles/app.css`

### Subtask T008 – Add hero overlay variables to light mode

**Purpose**: Override the overlay to use a light background with dark text in light mode.

**Steps**:
1. In the `:root[data-color-mode="light"]` block (line 68), add:
   ```css
   --hero-overlay-bg: rgba(255, 255, 255, 0.82);
   --hero-overlay-color: #102542;
   ```
2. The `#102542` value is the existing `--ink` color for light mode — dark navy text on a light overlay.
3. The `0.82` opacity provides enough background coverage for contrast while still letting the photo show through.

**Files**: `styles/app.css`

### Subtask T009 – Add hero overlay variables to dark mode and media query

**Purpose**: Ensure dark mode has explicit overlay values, matching the defaults.

**Steps**:
1. In the `:root[data-color-mode="dark"]` block (line 86), add:
   ```css
   --hero-overlay-bg: rgba(0, 0, 0, 0.7);
   --hero-overlay-color: #fff;
   ```
2. In the `@media (prefers-color-scheme: dark)` block (line 48), add the same values inside the `:root` rule:
   ```css
   --hero-overlay-bg: rgba(0, 0, 0, 0.7);
   --hero-overlay-color: #fff;
   ```
3. This ensures the overlay looks correct whether the user uses explicit mode selection or system preference.

**Files**: `styles/app.css`

### Subtask T010 – Replace hardcoded overlay values with custom properties

**Purpose**: Wire the overlay CSS to use the new theme-aware properties.

**Steps**:
1. In `.image-hero-slide .layout-image-hero__overlay` (line 1149), change:
   ```css
   /* Before */
   background: rgba(0, 0, 0, 0.6);
   color: #fff;
   
   /* After */
   background: var(--hero-overlay-bg);
   color: var(--hero-overlay-color);
   ```
2. Also check the show-all mode overlay rules at line 1251-1259. The show-all mode uses:
   ```css
   text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
   ```
   and at line 1261-1273:
   ```css
   background: rgba(0, 0, 0, 0.62);
   color: #fff;
   text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
   ```
   Update these to also use `var(--hero-overlay-bg)` and `var(--hero-overlay-color)`. The text-shadow may need a light-mode variant — consider `--hero-overlay-text-shadow` or just remove text-shadow in light mode since the background provides sufficient contrast.

**Files**: `styles/app.css`

### Subtask T011 – Verify WCAG 2.2 AA contrast

**Purpose**: Confirm the overlay text meets minimum contrast requirements in both modes.

**Steps**:
1. Dark mode: `#fff` text on `rgba(0, 0, 0, 0.7)` overlay — the overlay sits on an arbitrary photo, but the 70% opacity black ensures at minimum 4.5:1 against any background. Verify with browser dev tools.
2. Light mode: `#102542` text on `rgba(255, 255, 255, 0.82)` overlay — the light background with 82% opacity provides strong contrast with the dark navy text. The computed contrast ratio is approximately 7:1+.
3. Use the browser's accessibility inspector or Chrome DevTools contrast checker to verify.
4. Test with a very light photo background and a very dark photo background to confirm both modes work.

**Files**: None (manual verification)

### Subtask T012 – Verify hero background image is unchanged by color mode

**Purpose**: Confirm the hero image itself is not affected by the color mode toggle (FR-003).

**Steps**:
1. Open a hero slide in audience view
2. Toggle between light and dark mode
3. Verify the `<img>` element inside `.layout-image-hero__image` has no color mode-dependent styles
4. Verify no CSS rules target `.layout-image-hero__image` based on `data-color-mode` or `prefers-color-scheme`
5. The image should appear pixel-identical in both modes

**Files**: None (manual verification)

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Show-all mode has additional hardcoded colors | T010 covers show-all mode explicitly |
| Text-shadow looks wrong in light mode | Consider removing text-shadow in light mode or using a light shadow variant |
| Exported HTML doesn't include the color mode variables | The export generates inline styles — verify the standalone HTML export includes the CSS variable definitions |

## Review Guidance

- Toggle between light and dark mode on a hero slide — overlay should adapt, image should not
- Check contrast in both modes with browser dev tools
- Verify show-all mode hero slides also adapt
- Check that the exported standalone HTML still renders hero overlays correctly

## Activity Log

- 2026-05-24T18:00:00Z – system – lane=planned – Prompt created.
