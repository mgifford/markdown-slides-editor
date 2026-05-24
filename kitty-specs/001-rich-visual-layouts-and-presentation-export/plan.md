# Implementation Plan: Rich Visual Layouts and Presentation Export

**Branch**: `001-rich-visual-layouts-and-presentation-export` | **Date**: 2026-05-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `kitty-specs/001-rich-visual-layouts-and-presentation-export/spec.md`

## Summary

Fix the broken hero image timed transitions, add light/dark mode awareness to hero overlays, expand the demo deck to showcase visual variety, ensure PDF export renders all content readably, and add an export option that includes speaker notes and references. All changes stay within the existing plain JS + CSS architecture with no new dependencies.

## Technical Context

**Language/Version**: JavaScript (ES modules, no transpiler), CSS, HTML. Node.js 18+ for tests.
**Primary Dependencies**: None (zero runtime dependencies). Cucumber.js as sole devDependency for BDD tests.
**Storage**: IndexedDB-first with localStorage fallback (browser-side only).
**Testing**: Node built-in test runner (`node --test`) + Cucumber.js BDD + semantic output checks.
**Target Platform**: Modern browsers via GitHub Pages static hosting. Offline-capable via service worker.
**Project Type**: Single static browser application.
**Performance Goals**: Keep app shell lightweight for service worker caching. No server-side targets.
**Constraints**: No build step. No server requirement. No new runtime dependencies. WCAG 2.2 AA conformance. Must respect `prefers-reduced-motion`.
**Scale/Scope**: Single-user browser tool. ~7,800 lines of source JS across 24 modules.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| No build step, no framework | PASS | All changes are plain JS + CSS edits to existing modules |
| GitHub Pages static hosting | PASS | No server requirement introduced |
| No new runtime dependencies | PASS | Zero new dependencies |
| All new features must have tests | PASS | Plan includes tests for each work package |
| Accessibility is a product requirement | PASS | Hero overlay contrast, reduced-motion, keyboard access all addressed |
| Static baseline and AI layer separate | PASS | No AI features involved |
| Source format contract preserved | PASS | Existing directive syntax (`::image-hero`, `stay-N`, etc.) unchanged |
| npm test must pass | PASS | Tests run after each work package |
| Browser shortcuts not hijacked | PASS | No new keyboard shortcuts introduced |

No constitution violations. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```
kitty-specs/001-rich-visual-layouts-and-presentation-export/
├── plan.md              # This file
├── research.md          # Phase 0 output — investigation findings
├── data-model.md        # Phase 1 output — state and entity model
├── spec.md              # Feature specification
├── checklists/
│   └── requirements.md  # Quality checklist
└── tasks/               # Work packages (created by /spec-kitty.tasks)
```

### Source Code (repository root)

```
src/
├── main.js                          # App entry — no changes needed
├── modules/
│   ├── views/
│   │   ├── shared.js                # WP01: mountSlideInto active-class deferral
│   │   ├── presentation-view.js     # WP01: transition cleanup on slide change
│   │   ├── presenter-view.js        # WP01: verify no regression
│   │   └── editor-view.js           # WP01: verify editor preview stays static
│   ├── markdown.js                  # WP03: verify directive parsing (no changes expected)
│   ├── render.js                    # WP03: verify render output (no changes expected)
│   └── export.js                    # WP04+WP05: print stylesheet, notes export
styles/
└── app.css                          # WP01+WP02+WP04: transitions, overlay theming, print rules
deck.md                              # WP03: demo deck rewrite
tests/
├── parser.test.js                   # Existing — verify no regression
├── export.test.js                   # WP04+WP05: new export tests
└── (new test files as needed)       # WP01+WP02: hero transition and overlay tests
```

**Structure Decision**: All changes fit within the existing flat module structure. No new directories or abstractions needed.

## Implementation Approach

### WP01: Fix Hero Image Timed Transitions (P1)

**Problem**: `mountSlideInto()` in `src/modules/views/shared.js:110` renders slides with `class="... active"` immediately. The CSS transitions from initial → final state never fire because the browser never sees the "before" state.

**Solution**:
1. Render the slide *without* the `active` class in `mountSlideInto()`
2. For presentation view only: add `active` after a `requestAnimationFrame` so the browser paints the initial state first
3. For editor preview: add `active` immediately (no animation in preview — FR-009)
4. On slide change: remove `active` from the previous slide before mounting the next one, canceling any in-progress transition cleanly (FR-010)
5. Add `@media (prefers-reduced-motion: reduce)` rule that sets `transition-duration: 0s` on hero images and overlays (FR-004)

**Files touched**:
- `src/modules/views/shared.js` — `mountSlideInto()` options for deferred activation
- `src/modules/views/presentation-view.js` — pass activation option, cleanup on navigate
- `styles/app.css` — reduced-motion rule

**Tests**: New test verifying `mountSlideInto()` does not include `active` class when `deferActivation` option is set. Verify existing parser/render tests pass unchanged.

### WP02: Hero Overlay Light/Dark Mode Adaptation (P1)

**Problem**: Hero overlay background is hardcoded to `rgba(0, 0, 0, 0.6)` with `color: #fff` at `styles/app.css:1153`. Does not respond to theme variables.

**Solution**:
1. Define new CSS custom properties for hero overlays:
   - `--hero-overlay-bg` (dark mode: `rgba(0, 0, 0, 0.7)`, light mode: `rgba(255, 255, 255, 0.8)`)
   - `--hero-overlay-color` (dark mode: `#fff`, light mode: `var(--ink)`)
2. Apply these in `.layout-image-hero__overlay` instead of hardcoded values
3. Set values in both `:root[data-color-mode="light"]` and `:root[data-color-mode="dark"]` blocks and the `prefers-color-scheme` media query
4. Verify contrast ratio meets WCAG 2.2 AA (4.5:1) in both modes
5. Verify the background image itself is unaffected by color mode

**Files touched**:
- `styles/app.css` — overlay properties, light/dark variable definitions

**Tests**: Manual browser verification in both modes. CSS contrast can be spot-checked with browser dev tools.

### WP03: Demo Deck Visual Variety (P2)

**Problem**: Current `deck.md` has many hero slides that look the same. Doesn't showcase `::media-left`, `::media-right`, or varied hero configurations.

**Solution**:
1. Rewrite `deck.md` to include at least one example of each layout directive
2. Ensure hero slides have visually distinct configurations (different text positions, timings, effects)
3. Use placeholder images with distinct colors and compositions
4. Include slides with `Note:`, `Resources:`, and `Script:` sections to support WP05 testing
5. Verify the demo deck works in both light and dark mode

**Files touched**:
- `deck.md` — full rewrite of demo content

**Tests**: Manual verification — page through all slides, confirm visual variety, test in both color modes.

### WP04: PDF Export Shows Readable Final State (P2)

**Problem**: No print-specific CSS rules for hero transitions. Printed/PDF output may show hero slides in their initial state (image at full opacity, text hidden).

**Solution**:
1. Add `@media print` rules that:
   - Force `.layout-image-hero__image` to final opacity (`var(--hero-final, 0.3)`)
   - Force `.layout-image-hero__overlay` to `opacity: 1`
   - Disable all transitions (`transition: none`)
2. Verify existing `on-click` reveal behavior in print (already works — confirm no regression)
3. Add print rules that show hero slides against a neutral background (no dark theme in print)

**Files touched**:
- `styles/app.css` — `@media print` section

**Tests**: New export test verifying the standalone HTML export contains print-friendly hero rules. Manual browser print preview verification.

### WP05: Export with Speaker Notes and References (P3)

**Problem**: Current exports don't include speaker notes, resources, or script content alongside slides.

**Solution**:
1. Add a "notes export" function in `src/modules/export.js` that generates a standalone HTML document with:
   - Each slide's visual content
   - Followed by its notes, resources, and script sections (if present)
   - Clear visual separation between slide content and supporting material
2. Wire this into the editor export UI as an additional export option
3. Omit "No speaker notes" placeholders for slides without notes

**Files touched**:
- `src/modules/export.js` — new notes export function
- `src/modules/views/editor-view.js` — UI for the export option

**Tests**: New export test verifying the notes export includes all authored support content.

## Dependency Graph

```
WP01 (hero transitions) ─────────┐
                                  ├── WP03 (demo deck) ── needs working transitions to demo
WP02 (overlay light/dark mode) ──┘                       and correct overlay theming
                                  
WP04 (print/PDF) ── can start after WP01 (needs to know final transition model)

WP05 (notes export) ── independent, can run in parallel with WP01-WP04
```

**Recommended order**: WP01 → WP02 → WP03 → WP04, with WP05 in parallel after WP01.

## Post-Phase 1 Constitution Re-check

| Principle | Status | Notes |
|-----------|--------|-------|
| No build step, no framework | PASS | Pure JS + CSS changes |
| No new runtime dependencies | PASS | Zero added |
| WCAG 2.2 AA | PASS | Overlay contrast addressed in WP02, reduced-motion in WP01 |
| Tests for all features | PASS | Each WP includes test plan |
| Source format contract | PASS | No directive syntax changes |

All gates pass. Ready for `/spec-kitty.tasks`.
