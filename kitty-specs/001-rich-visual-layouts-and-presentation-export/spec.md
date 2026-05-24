# Feature Specification: Rich Visual Layouts and Presentation Export

**Feature Branch**: `001-rich-visual-layouts-and-presentation-export`
**Created**: 2026-05-24
**Status**: Draft
**Input**: User description: "Visually interesting image-text layouts, working timed hero transitions, light/dark mode hero overlay support, varied demo deck, PDF export with notes and references."

## User Scenarios & Testing

### User Story 1 - Hero Image Timed Transitions Actually Work (Priority: P1)

A presenter authors a slide with `::image-hero stay-5 transition-10 final-0.2` and expects the audience to see the full image for 5 seconds, then watch it fade to 20% opacity over 10 seconds while overlay text appears. Today the image starts in its final faded state immediately because the `active` class is applied at render time — the "before" state is never visible.

**Why this priority**: This is the most-requested visual feature and is visibly broken. The directive syntax exists, the CSS custom properties are set, and the CSS transitions are authored, but the triggering mechanism skips the initial state entirely. Users see no animation.

**Independent Test**: Open the demo deck in audience view (`/present/`), navigate to a hero slide with `stay-5 transition-10`, and observe that the image displays at full opacity for 5 seconds before fading.

**Acceptance Scenarios**:

1. **Given** a hero slide with `stay-5 transition-10 final-0.2`, **When** the slide becomes active in audience view, **Then** the image displays at full opacity for 5 seconds, then fades to 20% opacity over 10 seconds while the overlay text fades in.
2. **Given** a hero slide with `stay-0 transition-0` (instant reveal), **When** the slide becomes active, **Then** the image immediately shows at its final opacity and the text is immediately visible — no delay.
3. **Given** a hero slide with timed transitions and `prefers-reduced-motion: reduce` enabled, **When** the slide becomes active, **Then** transitions are suppressed and the slide displays in its final state immediately.
4. **Given** a hero slide with `pan-left` and `blur-3px`, **When** the transition runs, **Then** the image also pans and blurs as part of the same transition.

---

### User Story 2 - Hero Overlay Adapts to Light/Dark Mode (Priority: P1)

A viewer switches between light and dark mode while viewing a presentation. The hero background image should look identical in both modes. The overlay text box and text color should adapt — darker background with light text in dark mode, lighter semi-transparent background with dark text in light mode.

**Why this priority**: The current overlay is hardcoded (`rgba(0,0,0,0.6)` background, `#fff` text) and looks wrong in light mode. This is a WCAG contrast concern and a visual polish issue that affects every hero slide.

**Independent Test**: Open a hero slide in audience view, toggle between light and dark mode, and verify the overlay adapts while the background image stays the same.

**Acceptance Scenarios**:

1. **Given** a hero slide in dark mode, **When** viewed, **Then** the overlay uses a dark semi-transparent background with light text.
2. **Given** a hero slide in light mode, **When** viewed, **Then** the overlay uses a light semi-transparent background with dark text.
3. **Given** either mode, **When** the overlay text is measured against its background, **Then** the contrast ratio meets WCAG 2.2 AA (4.5:1 for normal text).
4. **Given** either mode, **When** the hero image behind the overlay is examined, **Then** it appears identical — no color shift, filter, or tint applied by the theme.

---

### User Story 3 - Demo Deck Showcases Visual Variety (Priority: P2)

A new user opens the editor and sees a demo deck that demonstrates the full range of available layout options with visually distinct slides. Today the demo deck has several hero slides that look mostly the same. It should showcase `::media-left`, `::media-right`, split-screen columns with images, the magazine-style image treatment, and hero variants that are visually distinguishable from each other.

**Why this priority**: The demo deck is the primary onboarding tool. If it doesn't show variety, users won't know what's possible.

**Independent Test**: Load the default demo deck, page through all slides, and verify that no two layout types look the same and each demonstrates a distinct visual pattern.

**Acceptance Scenarios**:

1. **Given** the default demo deck, **When** a user pages through it, **Then** they see at least one slide using each of: `::image-hero` (with visible timed transition), `::media-left`, `::media-right`, `::column-left`/`::column-right` with an image in one column, and a centered quote or callout.
2. **Given** the demo deck, **When** viewed in both light and dark mode, **Then** hero slides look correct in both modes and non-hero slides adapt to the theme normally.
3. **Given** the demo deck, **When** viewed, **Then** hero slides are visually distinct from each other — different text positions, different transition timings, different image treatments.

---

### User Story 4 - PDF Export Shows Readable Final State (Priority: P2)

A presenter exports their deck to PDF (via the browser print workflow). All timed transitions, progressive reveals, and hero image effects should resolve to their final readable state. No text should be hidden behind a full-opacity image.

**Why this priority**: Exported PDFs are shared with attendees who weren't at the talk. Hidden text defeats the purpose.

**Independent Test**: Open a deck with hero transitions and progressive reveals, use the browser print/save-as-PDF workflow, and verify all text is visible in the output.

**Acceptance Scenarios**:

1. **Given** a hero slide with `stay-5 transition-10 final-0.2`, **When** exported to PDF, **Then** the image is at its final opacity (0.2) and all overlay text is fully visible.
2. **Given** a slide with `on-click` progressive reveal blocks, **When** exported to PDF, **Then** all blocks are visible (this already works — verify it remains true).
3. **Given** the print stylesheet, **When** applied, **Then** hero transitions are suppressed and the final state is rendered statically.

---

### User Story 5 - Export with Speaker Notes and References (Priority: P3)

A presenter wants to share a comprehensive document that includes both the slides and the supporting material — speaker notes, references, and script content. This goes beyond the current one-page handout export to produce a document suitable for someone who wants to understand the full depth of the presentation.

**Why this priority**: This supports the broader goal of presentations as knowledge artifacts, not just slide images. However, it builds on existing export infrastructure and is less urgent than fixing the core visual experience.

**Independent Test**: Export a deck that has slides with `Note:`, `Resources:`, and `Script:` sections. Verify the exported document includes all of that content alongside the slide visuals.

**Acceptance Scenarios**:

1. **Given** a deck with speaker notes on multiple slides, **When** the user selects "Export with notes", **Then** the exported document shows each slide followed by its notes, resources, and script content.
2. **Given** a slide with no notes, **When** exported with notes, **Then** that slide appears without a notes section (no "No speaker notes" placeholder).
3. **Given** the exported document, **When** viewed, **Then** it is well-structured with clear visual separation between slide content and supporting material.

---

### Edge Cases

- What happens when a hero image fails to load? The overlay text should still be readable against the fallback background (`#000` for dark, appropriate color for light).
- What happens when `stay` and `transition` values are unreasonably large (e.g., `stay-300`)? The system should cap or warn, not break the presentation flow.
- What happens when multiple hero slides with long transitions are navigated quickly? Moving away from a slide mid-transition should reset cleanly without visual artifacts.
- What happens when the demo deck is cleared and reloaded? The default deck should restore reliably from storage or the embedded default.
- What happens when someone views a hero slide in the editor preview? The editor preview should show the final state (no animation) since it's a preview, not a live presentation.

## Requirements

### Functional Requirements

- **FR-001**: The presentation view MUST delay applying the hero transition final state by `--hero-stay` seconds after the slide becomes active, then animate over `--hero-transition` seconds.
- **FR-002**: The hero overlay background and text color MUST use theme-aware CSS custom properties that adapt to light and dark mode.
- **FR-003**: The hero background image MUST render identically regardless of color mode — no theme-based tinting or filtering applied to the image itself.
- **FR-004**: When `prefers-reduced-motion: reduce` is active, all hero transitions MUST be suppressed and the slide MUST display in its final state immediately.
- **FR-005**: The print/PDF stylesheet MUST force all hero slides to their final visual state — image at final opacity, overlay text fully visible.
- **FR-006**: The print/PDF stylesheet MUST show all `on-click` progressive reveal elements (already implemented — preserve this behavior).
- **FR-007**: The system MUST provide an export option that includes speaker notes, resources, and script content alongside slide visuals.
- **FR-008**: The demo deck MUST include at least one example of each supported layout directive: `::image-hero` (with working transition), `::media-left`, `::media-right`, `::column-left`/`::column-right` with image, `::center`, `::callout`, and `::quote`.
- **FR-009**: The editor preview MUST show hero slides in their final state without animation.
- **FR-010**: Navigating away from a hero slide mid-transition MUST cleanly cancel the transition with no visual artifacts on the next slide.
- **FR-011**: The hero transition timing MUST be driven by CSS custom properties already parsed from the directive (`--hero-stay`, `--hero-transition`, `--hero-final`), not new JavaScript timers duplicating those values.

### Key Entities

- **Hero Transition State**: The lifecycle of a hero slide from initial (image full, text hidden) to final (image faded, text visible), driven by `stay`, `transition`, and `final` parameters.
- **Overlay Theme**: The visual treatment of the text overlay box, including background color/opacity and text color, as a function of the current color mode.
- **Export Mode**: A rendering context (live presentation, editor preview, print/PDF, notes export) that determines which visual state is shown and what content is included.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A user viewing a hero slide with `stay-5 transition-10` in audience view sees the image at full opacity for approximately 5 seconds before the transition begins.
- **SC-002**: Hero overlay text meets WCAG 2.2 AA contrast requirements (4.5:1) in both light and dark mode without manual author intervention.
- **SC-003**: The default demo deck displays at least 6 visually distinct layout patterns when paged through.
- **SC-004**: A PDF export of any deck with hero transitions contains zero hidden or unreadable text — all overlay content is visible in the final document.
- **SC-005**: The "export with notes" document includes 100% of authored `Note:`, `Resources:`, and `Script:` content for every slide that has it.
- **SC-006**: All existing tests (`npm test`) continue to pass after implementation with no regressions.
