# Research: Rich Visual Layouts and Presentation Export

## R1: Hero Transition Activation Mechanism

**Question**: Why don't the hero timed transitions work?

**Finding**: The `mountSlideInto()` function in `src/modules/views/shared.js:110` renders the slide HTML with the `active` class already applied in the innerHTML template string. CSS transitions require a state change — the browser needs to paint the element in its initial state (no `active` class) before the `active` class is added to trigger the transition. Because `active` is present from the first paint, the browser skips directly to the final state.

**Decision**: Separate rendering from activation. Render slides without `active`, then add it via `requestAnimationFrame` in presentation view only. Editor preview adds `active` immediately (no animation needed in preview context).

**Rationale**: This is the standard CSS transition pattern. No JavaScript timers needed — the `--hero-stay` and `--hero-transition` custom properties already drive the CSS `transition-delay` and `transition-duration`. The CSS is correct; only the class application timing is wrong.

**Alternatives considered**:
- JavaScript `setTimeout` timers mirroring CSS values: Rejected — duplicates timing logic, harder to maintain, breaks if CSS values change.
- CSS `@keyframes` animation instead of transitions: Rejected — would require rewriting the existing CSS approach. Transitions are simpler and already authored.
- Web Animations API: Rejected — overengineered for this use case, and less compatible with the existing CSS custom property approach.

## R2: Hero Overlay Theming

**Question**: How should hero overlays adapt to light/dark mode?

**Finding**: The overlay at `styles/app.css:1149-1163` uses hardcoded `background: rgba(0, 0, 0, 0.6)` and `color: #fff`. The app's theming system uses CSS custom properties set on `:root[data-color-mode="light"]` and `:root[data-color-mode="dark"]`. The hero overlay does not participate in this system.

**Decision**: Add hero-specific custom properties (`--hero-overlay-bg`, `--hero-overlay-color`) to the light and dark mode variable blocks. Use these in the overlay rule instead of hardcoded values.

**Rationale**: The overlay needs its own variables rather than reusing `--panel` / `--ink` because the overlay sits on top of an arbitrary photograph — it needs higher opacity and specific contrast tuning that differs from the standard panel treatment. In dark mode, a dark semi-transparent overlay on a photo is natural. In light mode, a light semi-transparent overlay with dark text provides the same readability without looking like a dark box on a bright page.

**Contrast verification approach**: Dark mode `rgba(0, 0, 0, 0.7)` with `#fff` text on any background provides at minimum 4.5:1 contrast (the overlay opacity guarantees this). Light mode `rgba(255, 255, 255, 0.8)` with the theme `--ink` color (`#102542`) provides approximately 7:1 contrast. Both exceed WCAG AA.

## R3: Print/PDF Hero Handling

**Question**: How should hero slides render in print/PDF?

**Finding**: The existing `@media print` section in `styles/app.css` does not address hero slides specifically. There are no print rules for `.layout-image-hero__image` opacity or `.layout-image-hero__overlay` visibility.

**Decision**: Add print-specific rules that force the hero image to its `--hero-final` opacity, show the overlay text at full opacity, and disable all transitions. This matches the "final state" that audiences see after the transition completes.

**Rationale**: Print is inherently static — transitions don't apply. The user's intent with `final-0.2` is "the image ends up at 20% opacity" — that's the readable state where text is visible. Printing the initial state (full image, no text) would produce an unreadable page.

## R4: Notes Export Format

**Question**: What format should the "export with notes" use?

**Finding**: The existing export module (`src/modules/export.js`, 1,677 lines) already generates standalone HTML, ODP, MHTML, and ZIP bundle exports. The standalone HTML generator is the closest model for a notes export. Speaker notes, resources, and script content are already parsed and available as `notesHtml`, `resourcesHtml`, and `scriptHtml` on rendered slides.

**Decision**: Add a new export function that produces a standalone HTML document where each slide's visual content is followed by its supporting sections (notes, resources, script). Reuse the existing `buildSupplementalHtml()` helper from `src/modules/views/shared.js`.

**Rationale**: HTML is consistent with existing export formats, works offline, and can be printed to PDF by the user. No new file format or dependency needed.

**Alternatives considered**:
- PDF generation via jsPDF or similar: Rejected — introduces a large runtime dependency, violates constitution.
- Markdown export with notes: Considered for future — the source already has notes in Markdown. But the visual slide content needs rendering, so HTML is the right format for a "slides + notes" document.
