# ACCESSIBILITY.md

This document describes the accessibility posture, contributor expectations, and validation workflow for this repository.

It is inspired by the open `ACCESSIBILITY.md` framework published at [mgifford.github.io/ACCESSIBILITY.md](https://mgifford.github.io/ACCESSIBILITY.md/), adapted here for a static Markdown-driven slide editor and presentation runtime.

This project is meant for production use. Accessibility guidance here should be treated as operational product requirements, not training material or aspirational sample text.

## Conformance Target

- Target: WCAG 2.2 AA for both:
  - the editor interface
  - the generated presentation output
- Prefer native HTML semantics over ARIA whenever possible.
- Treat accessibility regressions as defects, not polish items.

## Scope

This project has two accessibility surfaces that must both be reviewed:

- Authoring surface:
  - the browser-based editor, controls, import/export actions, presenter tools, and preview UI
- Presentation surface:
  - the generated slide HTML, keyboard navigation, focus behavior, notes handling, and exported snapshot output

Accessibility work is incomplete unless both surfaces are considered.

## Accessibility Commitments

- Keep the default experience compatible with static hosting on GitHub Pages.
- Preserve keyboard access across editor, audience view, and presenter view.
- Maintain visible focus states.
- Respect `prefers-reduced-motion`.
- Preserve logical reading order in preview and exported output.
- Require meaningful text alternatives for informative images.
- Encourage descriptive link text and clear heading structure.
- Prefer browser-native, resilient patterns over complex client-side behavior.
- Encourage concise slides with one main idea per slide and meaningful slide titles.
- Encourage plain, inclusive language and avoid unnecessary jargon or unexplained acronyms.
- Encourage authors to describe meaningful visuals in notes and spoken delivery, not only in static text alternatives.
- Treat speaker notes as supporting detail, not the sole location of critical audience information.
- Keep motion disciplined and minimal by default.
- Avoid hijacking standard browser shortcuts needed for copy, selection, zoom, or assistive technology.
- Keep help text, warnings, and suggestions concise in the UI, with fuller detail exposed through accessible disclosure patterns where needed.

## Current Guardrails

Current automated checks live in the editor lint flow and test suite:

- one `H1` per slide
- no skipped heading levels
- warnings for generic link text
- errors for missing image alt text
- note presence awareness
- slide-density assessment and layout-overflow awareness

Current semantic expectations for rendered output:

- logical heading hierarchy in the final HTML
- semantic lists instead of list-looking paragraphs
- no layout tables in author content
- minimal and justified ARIA usage
- avoid generic container-only output when semantic elements are appropriate
- tooltip-like guidance should be attached to a real control, available on focus as well as hover, and not be the sole way to understand a critical task

Current related files:

- [docs/accessibility-checklist.md](/Users/mike.gifford/markdown-slides-editor/docs/accessibility-checklist.md)
- [docs/resources.md](/Users/mike.gifford/markdown-slides-editor/docs/resources.md)
- [src/modules/a11y.js](/Users/mike.gifford/markdown-slides-editor/src/modules/a11y.js)
- [tests/parser.test.js](/Users/mike.gifford/markdown-slides-editor/tests/parser.test.js)

## Definition Of Done

A change that affects UI, rendering, navigation, or export is not done until:

- `npm test` passes
- the editor accessibility check still works
- keyboard-only use is verified for the changed flow
- focus visibility remains intact
- standard browser copy shortcuts still work where text should be selectable
- generated slide output remains readable in DOM order
- generated slide output uses sensible semantic HTML, not container-only markup
- heading and list semantics remain intact after rendering
- ARIA use is justified and not decorative or redundant
- any new images, controls, or interactive patterns have accessible names and instructions
- any new motion respects reduced-motion preferences
- notes do not hide essential content required to understand the presentation
- transitions and timed behavior do not create cognitive or vestibular burden

If a feature affects exported slides, validate the exported HTML as well as the in-app preview.

## Manual Review Expectations

Manual checks are still required because automated checks are not enough.

Always review, when relevant:

- tab order and keyboard reachability
- visible focus styles
- whether copy/paste and text selection still work in editor and presentation contexts
- screen reader naming of buttons, links, and landmarks
- heading hierarchy on each slide
- whether list content is rendered as actual lists
- whether any table usage is truly tabular rather than visual layout
- whether ARIA roles are necessary and correct
- whether rendered slides use semantic elements rather than "div soup"
- descriptive link text
- notes separation from visible content
- whether tooltip, help, or suggestion text is available on focus and does not trap interaction
- whether the slide itself contains the essential audience-facing idea
- whether notes are adding detail rather than hiding key meaning
- slide density and readability from a distance
- whether charts, diagrams, and other visuals are summarized clearly
- contrast in the chosen theme
- presenter view behavior without a mouse
- presenter view behavior with collapsed/fullscreen panels and the audience-window launcher
- exported snapshot behavior offline
- whether spoken delivery guidance in notes supports an equivalent experience for people who cannot see the slide content
- whether transitions, animation, or timed movement are unnecessary or distracting

## AI And Speech-To-Text

- Whisper or other AI-assisted transcription must remain optional.
- Do not expose AI controls unless local or API-backed AI capability is actually available.
- Static GitHub Pages mode must not imply live captions are available when they are not.
- If AI features are added, document privacy, consent, and failure modes clearly.

## Planned Automation

The project should grow toward stronger shift-left accessibility enforcement:

- Sa11y review of rendered decks as part of the manual validation workflow
- CI checks with `axe` and `pa11y`
- export validation for generated HTML
- stronger theme contrast checks
- broader lint coverage for content quality and structure
- regression coverage for keyboard navigation and presenter workflows
- broader regression coverage for editor-to-preview synchronization and accessible disclosure patterns

These are planned expectations even where automation is not implemented yet.

## Trusted References

- [Intopia guidance](https://intopia.digital/)
- [How To Create More Accessible Presentations](https://intopia.digital/articles/how-to-create-more-accessible-presentations/)
- [Inklusiv resources](https://inklusiv.ca/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [WAI presentations guidance](https://www.w3.org/WAI/presentations/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [ACCESSIBILITY.md framework](https://mgifford.github.io/ACCESSIBILITY.md/)

## Agent And Contributor Guidance

- Start with semantic HTML.
- Avoid introducing inaccessible custom widgets when native controls are sufficient.
- Prefer progressive enhancement.
- Prefer browser-side persistence and caching that do not break accessible workflows.
- Prefer simple, accessible disclosure for secondary guidance. A short visible label with a focusable button and tooltip/popover is better than a long always-on warning block when space is limited.
- Keep the static baseline honest: no required backend, no hidden AI dependency, no inaccessible fallback path.

Trust this file and `docs/accessibility-checklist.md` when making accessibility decisions. Search for more context only if the guidance here is incomplete or outdated.
