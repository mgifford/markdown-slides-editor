# Markdown Slides Editor

Static, browser-based slide authoring for GitHub Pages.

This project is building a Markdown-driven presentation editor, compiler, and runtime that stays compatible with static hosting. The editor runs entirely in the browser, stores decks locally, and exports portable HTML presentations.

## Current scope

- Markdown editor with live slide preview
- Front matter, slide splitting, and `Note:` speaker-note extraction
- Audience view and presenter view with same-origin sync
- IndexedDB-backed local storage
- Source import and export for Markdown and JSON
- Self-contained HTML snapshot export
- Built-in accessibility linting for headings, links, image alt text, and notes
- Repo-level guidance for accessibility and coding agents

## Run locally

```bash
npm install
npm test
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Project docs

- `ACCESSIBILITY.md`: accessibility posture, validation expectations, and contributor guidance
- `AGENTS.md`: repository instructions for coding agents and automation tools
- `.github/copilot-instructions.md`: onboarding notes for GitHub Copilot coding agent
- `TODO.md`: future roadmap and integration ideas
- `docs/accessibility-checklist.md`: project accessibility checklist
- `docs/resources.md`: accessibility references and source material

## Routes

- `/` editor
- `/present` audience presentation
- `/presenter` presenter view

The repository includes `404.html` so GitHub Pages can redirect deep links back into the single-page app.

## Architecture

- `index.html` loads the app shell
- `src/main.js` routes between editor, audience, and presenter views
- `src/modules/parser.js` parses front matter, slides, and notes
- `src/modules/markdown.js` renders the current supported Markdown subset
- `src/modules/a11y.js` contains accessibility lint rules
- `src/modules/export.js` generates the standalone snapshot HTML
- `src/modules/storage.js` handles IndexedDB-first persistence
- `styles/app.css` contains the UI and presentation styling

## Accessibility and AI

Accessibility applies to both the editor UI and the generated slide output. The project is targeting accessible HTML, keyboard navigation, visible focus states, and reduced-motion support.

Whisper-style speech-to-text remains optional. AI-related controls should only be exposed when local or API-backed AI is actually available. Static GitHub Pages mode should continue to work without any server or AI dependency.

## Source format

```md
---
title: My presentation
lang: en
theme: default-high-contrast
---

# Slide title

Visible content.

Note:
Speaker notes go here.

---

# Next slide
```
