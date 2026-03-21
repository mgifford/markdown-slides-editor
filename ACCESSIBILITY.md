# ACCESSIBILITY.md

This document describes the accessibility posture, contributor expectations, and validation workflow for this repository.

It is inspired by the open `ACCESSIBILITY.md` framework published at [mgifford.github.io/ACCESSIBILITY.md](https://mgifford.github.io/ACCESSIBILITY.md/), adapted here for a static Markdown-driven slide editor and presentation runtime.

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

## Current Guardrails

Current automated checks live in the editor lint flow and test suite:

- one `H1` per slide
- no skipped heading levels
- warnings for generic link text
- errors for missing image alt text
- note presence awareness

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
- generated slide output remains readable in DOM order
- any new images, controls, or interactive patterns have accessible names and instructions
- any new motion respects reduced-motion preferences

If a feature affects exported slides, validate the exported HTML as well as the in-app preview.

## Manual Review Expectations

Manual checks are still required because automated checks are not enough.

Always review, when relevant:

- tab order and keyboard reachability
- visible focus styles
- screen reader naming of buttons, links, and landmarks
- heading hierarchy on each slide
- descriptive link text
- notes separation from visible content
- contrast in the chosen theme
- presenter view behavior without a mouse
- exported snapshot behavior offline

## AI And Speech-To-Text

- Whisper or other AI-assisted transcription must remain optional.
- Do not expose AI controls unless local or API-backed AI capability is actually available.
- Static GitHub Pages mode must not imply live captions are available when they are not.
- If AI features are added, document privacy, consent, and failure modes clearly.

## Planned Automation

The project should grow toward stronger shift-left accessibility enforcement:

- CI checks with `axe` and `pa11y`
- export validation for generated HTML
- stronger theme contrast checks
- broader lint coverage for content quality and structure
- regression coverage for keyboard navigation and presenter workflows

These are planned expectations even where automation is not implemented yet.

## Trusted References

- [Intopia guidance](https://intopia.digital/)
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
- Keep the static baseline honest: no required backend, no hidden AI dependency, no inaccessible fallback path.

Trust this file and `docs/accessibility-checklist.md` when making accessibility decisions. Search for more context only if the guidance here is incomplete or outdated.
