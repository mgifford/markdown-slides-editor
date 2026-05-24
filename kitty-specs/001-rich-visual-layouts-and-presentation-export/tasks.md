# Work Packages: Rich Visual Layouts and Presentation Export

**Feature**: `001-rich-visual-layouts-and-presentation-export`
**Date**: 2026-05-24
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Subtask Inventory

| ID | Description | WP | Parallel |
|----|-------------|-----|----------|
| T001 | Add `deferActivation` option to `mountSlideInto()` | WP01 | |
| T002 | Apply deferred activation in presentation view via `requestAnimationFrame` | WP01 | |
| T003 | Clean up active class on slide navigation (cancel mid-transition) | WP01 | |
| T004 | Add `prefers-reduced-motion` rule to suppress hero transitions | WP01 | |
| T005 | Add test for `mountSlideInto()` deferred activation behavior | WP01 | |
| T006 | Verify editor preview still shows immediate final state | WP01 | |
| T007 | Define `--hero-overlay-bg` and `--hero-overlay-color` custom properties | WP02 | |
| T008 | Add hero overlay variables to light mode variable block | WP02 | |
| T009 | Add hero overlay variables to dark mode variable block and media query | WP02 | |
| T010 | Replace hardcoded overlay values with custom properties | WP02 | |
| T011 | Verify contrast meets WCAG 2.2 AA in both modes | WP02 | |
| T012 | Verify hero background image is unchanged by color mode | WP02 | |
| T013 | Rewrite demo deck with diverse layout examples | WP03 | |
| T014 | Add `::media-left` and `::media-right` demo slides | WP03 | |
| T015 | Add visually distinct hero slide configurations | WP03 | |
| T016 | Add `Note:`, `Resources:`, and `Script:` sections for export testing | WP03 | |
| T017 | Verify demo deck in light and dark mode | WP03 | |
| T018 | Add `@media print` rules for hero image final state | WP04 | |
| T019 | Add `@media print` rule to show overlay text at full opacity | WP04 | |
| T020 | Disable transitions in print stylesheet | WP04 | |
| T021 | Verify `on-click` reveals still show in print (existing behavior) | WP04 | |
| T022 | Add print-specific hero background for readability | WP04 | |
| T023 | Create notes export HTML generation function | WP05 | [P] |
| T024 | Wire notes export option into editor export UI | WP05 | |
| T025 | Omit placeholder text for slides without notes | WP05 | |
| T026 | Add export test for notes export content | WP05 | |

## Work Packages

### Phase 1: Foundation (P1)

#### WP01: Fix Hero Image Timed Transitions
**Priority**: P1 | **Subtasks**: T001-T006 (6 subtasks) | **~350 lines**
**Prompt**: [WP01-fix-hero-transitions.md](tasks/WP01-fix-hero-transitions.md)
**Dependencies**: None
**Implementation command**: `spec-kitty implement WP01`

**Goal**: Make the `stay-N transition-N final-N` hero directive parameters actually produce visible timed transitions in audience view.

**Included subtasks**:
- [ ] T001: Add `deferActivation` option to `mountSlideInto()`
- [ ] T002: Apply deferred activation in presentation view
- [ ] T003: Clean up active class on slide change
- [ ] T004: Add `prefers-reduced-motion` suppression
- [ ] T005: Test deferred activation behavior
- [ ] T006: Verify editor preview remains static

---

#### WP02: Hero Overlay Light/Dark Mode
**Priority**: P1 | **Subtasks**: T007-T012 (6 subtasks) | **~300 lines**
**Prompt**: [WP02-hero-overlay-theming.md](tasks/WP02-hero-overlay-theming.md)
**Dependencies**: WP01
**Implementation command**: `spec-kitty implement WP02 --base WP01`

**Goal**: Make hero overlay text and background adapt to the current color mode while keeping the background image unchanged.

**Included subtasks**:
- [ ] T007: Define new CSS custom properties
- [ ] T008: Add light mode values
- [ ] T009: Add dark mode values
- [ ] T010: Replace hardcoded overlay styles
- [ ] T011: Verify WCAG contrast
- [ ] T012: Verify image unchanged by mode

---

### Phase 2: Content and Polish (P2)

#### WP03: Demo Deck Visual Variety
**Priority**: P2 | **Subtasks**: T013-T017 (5 subtasks) | **~350 lines**
**Prompt**: [WP03-demo-deck-variety.md](tasks/WP03-demo-deck-variety.md)
**Dependencies**: WP01, WP02
**Implementation command**: `spec-kitty implement WP03 --base WP02`

**Goal**: Rewrite the demo deck to showcase the full range of layout directives with visually distinct slides.

**Included subtasks**:
- [ ] T013: Rewrite demo deck structure
- [ ] T014: Add media-left/right demo slides
- [ ] T015: Add distinct hero configurations
- [ ] T016: Add notes/resources/script for export testing
- [ ] T017: Verify in light and dark mode

---

#### WP04: PDF Export Final State
**Priority**: P2 | **Subtasks**: T018-T022 (5 subtasks) | **~250 lines**
**Prompt**: [WP04-pdf-export-final-state.md](tasks/WP04-pdf-export-final-state.md)
**Dependencies**: WP01
**Implementation command**: `spec-kitty implement WP04 --base WP01`

**Goal**: Ensure printed/PDF output shows hero slides in their readable final state.

**Included subtasks**:
- [ ] T018: Print rule for hero image final opacity
- [ ] T019: Print rule for overlay text visibility
- [ ] T020: Disable transitions in print
- [ ] T021: Verify on-click reveals in print
- [ ] T022: Print-specific hero background

---

### Phase 3: Enhancement (P3)

#### WP05: Export with Speaker Notes
**Priority**: P3 | **Subtasks**: T023-T026 (4 subtasks) | **~300 lines**
**Prompt**: [WP05-notes-export.md](tasks/WP05-notes-export.md)
**Dependencies**: None (independent)
**Implementation command**: `spec-kitty implement WP05`

**Goal**: Add an export option that produces a standalone HTML document with slides and their speaker notes, resources, and script content.

**Included subtasks**:
- [ ] T023: Create notes export HTML function
- [ ] T024: Wire into editor export UI
- [ ] T025: Omit placeholders for empty notes
- [ ] T026: Add export test

---

## Parallelization

```
WP01 (hero transitions) ──┬── WP02 (overlay theming) ── WP03 (demo deck)
                           │
                           └── WP04 (print/PDF)

WP05 (notes export) ── runs independently, can start any time
```

**Parallel opportunities**: WP04 and WP02 can run in parallel after WP01 completes. WP05 is fully independent.

## MVP Scope

**WP01 alone** delivers the most impactful fix — hero transitions working. Combined with WP02 (overlay theming), it fixes the two P1 issues. WP03 then makes the improvements visible in the demo.
