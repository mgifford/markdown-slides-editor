---
work_package_id: WP04
title: PDF Export Final State
lane: planned
dependencies: []
subtasks:
- T018
- T019
- T020
- T021
- T022
phase: Phase 2 - Content and Polish
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

# Work Package Prompt: WP04 – PDF Export Final State

## ⚠️ IMPORTANT: Review Feedback Status

**Read this first if you are implementing this task!**

- **Has review feedback?**: Check the `review_status` field above. If it says `has_feedback`, scroll to the **Review Feedback** section immediately.

---

## Review Feedback

*[This section is empty initially.]*

---

## Objectives & Success Criteria

Ensure that printed/PDF output shows hero slides in their readable final state — image at final opacity, overlay text fully visible, transitions disabled.

**Success criteria**:
- Print preview shows hero images at their `--hero-final` opacity (not full opacity)
- Print preview shows hero overlay text at full opacity (visible)
- All CSS transitions are disabled in print
- `on-click` progressive reveals remain visible in print (existing behavior — verify no regression)
- Hero slides print against a readable background
- All existing tests pass

## Context & Constraints

**Current state**: The existing `@media print` section in `styles/app.css` handles general layout but does not address hero slides specifically. There are no print rules for `.layout-image-hero__image` or `.layout-image-hero__overlay`.

**Depends on WP01**: Needs the transition model from WP01 to understand what "final state" means in terms of CSS classes.

**Key insight**: After WP01, the `active` class triggers the final state. In print, we can force the final state regardless of the `active` class by directly setting the properties.

**References**:
- [spec.md](../spec.md) — User Story 4, FR-005, FR-006
- [plan.md](../plan.md) — WP04 section
- [research.md](../research.md) — R3: Print/PDF Hero Handling

## Subtasks & Detailed Guidance

### Subtask T018 – Print rule for hero image final opacity

**Purpose**: Force hero images to their final opacity in print so text overlays are readable.

**Steps**:
1. Find the existing `@media print` section in `styles/app.css` (search for `@media print`)
2. Add a rule that forces the hero image to its final state:
   ```css
   @media print {
     .image-hero-slide .layout-image-hero__image {
       opacity: var(--hero-final, 0.3) !important;
       filter: blur(var(--hero-blur, 0px)) saturate(var(--hero-saturation, 1)) !important;
       transform: scale(1.05) translate(var(--hero-pan-x, 0%), var(--hero-pan-y, 0%)) !important;
     }
   }
   ```
3. The `!important` ensures print rules override both the initial state and any inline styles.

**Files**: `styles/app.css`

### Subtask T019 – Print rule for overlay text visibility

**Purpose**: Force hero overlay text to be fully visible in print.

**Steps**:
1. In the same `@media print` block, add:
   ```css
   @media print {
     .image-hero-slide .layout-image-hero__overlay {
       opacity: 1 !important;
     }
   }
   ```
2. This ensures the overlay text is always visible regardless of the `active` class state.

**Files**: `styles/app.css`

### Subtask T020 – Disable transitions in print

**Purpose**: Prevent any transition effects from interfering with print rendering.

**Steps**:
1. In the `@media print` block, add:
   ```css
   @media print {
     .image-hero-slide .layout-image-hero__image,
     .image-hero-slide .layout-image-hero__overlay {
       transition: none !important;
     }
   }
   ```
2. This ensures the print renderer sees the final state instantly without any transition timing.

**Files**: `styles/app.css`
**Notes**: Combine T018, T019, and T020 rules into a single clean `@media print` block for hero slides. Don't create multiple separate blocks.

### Subtask T021 – Verify on-click reveals in print

**Purpose**: Confirm that existing `on-click` progressive reveal behavior in print is not regressed.

**Steps**:
1. The current CSS likely already has a print rule showing `.next` elements. Find and verify it exists.
2. If no such rule exists, add:
   ```css
   @media print {
     .next {
       display: block !important;
       visibility: visible !important;
     }
     .next[hidden] {
       display: block !important;
       hidden: false;
     }
   }
   ```
3. Create or load a test deck with `on-click` reveals, open print preview, verify all items are visible.

**Files**: `styles/app.css` (if changes needed)

### Subtask T022 – Print-specific hero background

**Purpose**: Ensure hero slides print readably regardless of the viewer's color mode setting.

**Steps**:
1. Hero slides have `background: #000` on `.slide-card--image-hero`. In print, this wastes ink and may not render well on all printers.
2. Consider whether to keep the dark background (preserves the visual intent of the hero) or switch to a neutral background in print.
3. If the hero image has sufficient coverage (it's `object-fit: cover` at the final opacity), the `#000` background shows through where the image is transparent — this is intentional for the hero effect.
4. Leave the `#000` background as-is for print — it provides contrast for the overlay text on hero slides. The image at reduced opacity on a black background is the intended print appearance.
5. If testing reveals readability issues, add a print-specific override.

**Files**: `styles/app.css` (if needed)
**Notes**: This subtask may result in no code changes — it's a verification step. Document the decision either way.

## Test Strategy

- Run `npm test` after changes
- Manual browser print preview verification with a deck containing hero slides
- Check that the standalone HTML export (`src/modules/export.js`) includes the print CSS rules
- If the export generates inline CSS, verify the print rules are included

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| `!important` overrides interfere with other print rules | Scope all rules tightly to `.image-hero-slide` selectors |
| Browser print rendering differs from preview | Test in Chrome and Firefox print preview |
| Standalone HTML export doesn't include print rules | Check if `export.js` copies the full CSS or a subset — may need to add print rules to the export stylesheet |

## Review Guidance

- Open browser print preview with a hero slide deck
- Verify image is at reduced opacity, overlay text is visible
- Verify on-click reveals are all visible
- Check standalone HTML export includes the print rules
- Run `npm test`

## Activity Log

- 2026-05-24T18:00:00Z – system – lane=planned – Prompt created.
