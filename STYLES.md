# STYLES.md

This file defines writing, design, and styling standards for this repository.

It is inspired by [mgifford/STYLES.md](https://github.com/mgifford/STYLES.md), adapted here for a static Markdown-driven slide editor and presentation runtime.

## Scope

This repository has two surfaces:

| Surface | Files | Audience |
| :--- | :--- | :--- |
| App UI and exported slides | `index.html`, `src/`, `styles/`, exported snapshot HTML | Authors and presentation audiences |
| Repository documentation | `README.md`, `AGENTS.md`, `ACCESSIBILITY.md`, `STYLES.md`, `TODO.md`, `docs/*.md` | Contributors, adopters, and coding agents |

Rules in this file apply to both surfaces unless a section says otherwise.

## 1. Core principles

1. Reader first. Optimize for clarity and confidence, not institutional language.
2. Production quality. This project is for real presentations, not training demos.
3. Accessibility first. Visual style must not undermine semantics, readability, or keyboard use.
4. Consistency builds trust. Documentation, UI labels, and slide output should feel like one system.
5. Customization should be safe. Theme flexibility is good, but semantic structure must remain stable.

## 2. Content and voice

- Use plain language.
- Prefer active voice.
- Use sentence case for headings, labels, and buttons.
- Keep paragraphs short.
- Use American English by default.
- Prefer “use” over “utilize” or “leverage” in project writing.
- Name things by what they do for the user, not by internal implementation.

Examples:

- Use `Export Markdown`, not `Export Source`.
- Use `Export Presentation HTML`, not `Export Snapshot` if user comprehension is the priority.

## 3. Styling and theming

These rules apply to the app UI and presentation output.

- Keep the visual system based on CSS custom properties.
- Built-in themes should be implemented as token overrides, not as separate structural layouts.
- External stylesheets may override branding and presentation polish, but should not require markup changes.
- Themes must preserve readable typography, visible focus states, and sufficient contrast.
- Avoid decorative effects that reduce legibility or distract from slide content.
- Respect `prefers-reduced-motion`.
- Do not rely on color alone to convey meaning.

Current built-in themes live in:

- [theme.js](/Users/mike.gifford/markdown-slides-editor/src/modules/theme.js)
- [app.css](/Users/mike.gifford/markdown-slides-editor/styles/app.css)

## 4. Layout and component rules

- Favor simple, semantic structure over deeply nested containers.
- Keep controls discoverable, but reduce clutter with progressive disclosure where helpful.
- Default workflows should stay prominent; advanced or machine-oriented actions can live in secondary menus.
- Panels that consume significant space should be collapsible when practical.
- Preserve keyboard access for all controls, including menus, dialogs, and presentation navigation.

## 5. Slide design rules

- Slides should emphasize one main idea.
- Speaker notes should add detail, not hide essential meaning.
- Use real lists for grouped items.
- Avoid layout tables.
- Keep slide titles meaningful and distinct.
- Progressive disclosure should support comprehension, not theatrics.
- Minimize motion. Avoid parallax, 3D transitions, and auto-advance defaults.

## 6. Documentation rules

- Start each major document with a short statement of purpose.
- Use headings in order.
- Link to canonical sources rather than copying large external passages.
- Keep repo docs aligned with the actual shipped behavior of the app.
- If UI text changes, update the related docs and help text in the same change when practical.

## 7. AI agent instructions

- Read [AGENTS.md](/Users/mike.gifford/markdown-slides-editor/AGENTS.md) first.
- Do not introduce visual changes that conflict with [ACCESSIBILITY.md](/Users/mike.gifford/markdown-slides-editor/ACCESSIBILITY.md).
- If AI materially changes the repository, update AI disclosure in [README.md](/Users/mike.gifford/markdown-slides-editor/README.md).
- Prefer small, reversible style changes over broad redesigns.
- Preserve the static-first architecture and local-first editing workflow.

## 8. References

- [STYLES.md reference repository](https://github.com/mgifford/STYLES.md)
- [ACCESSIBILITY.md](/Users/mike.gifford/markdown-slides-editor/ACCESSIBILITY.md)
- [AGENTS.md](/Users/mike.gifford/markdown-slides-editor/AGENTS.md)
- [Product principles](/Users/mike.gifford/markdown-slides-editor/docs/product-principles.md)
- [README.md](/Users/mike.gifford/markdown-slides-editor/README.md)
