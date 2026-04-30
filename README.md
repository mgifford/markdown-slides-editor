# Markdown Slides Editor

Static, browser-based slide authoring for GitHub Pages.

This project is building a Markdown-driven presentation editor, compiler, and runtime that stays compatible with static hosting. The editor runs entirely in the browser, stores decks locally, and exports portable HTML presentations.

The authoring goal is closer to "Google Slides, but with Markdown" than a simple Markdown-to-slides converter. That includes responsive editing, deck-level review, safe experimentation, and eventually AI-assisted feedback that helps improve presentations without taking control away from the author.

This is intended for real production presentations. It is not a training product or a throwaway demo. The editor and output should help authors present with credibility, clarity, and accessible, trustworthy HTML.

## Current scope

- Markdown editor with live slide preview
- Front matter, optional generated title and closing slides, and slide splitting
- `Note:`, `Resources:`, and `Script:` support for presenter-facing context
- Audience view and presenter view with same-origin sync
- Slide outline and presenter timing support
- Progressive disclosure for lists
- Fixed slide geometry with auto-fit body text and compact density warnings
- Better small-screen support for editor and audience view
- IndexedDB-backed local storage
- In-editor AI prompt generator for briefing Ollama or another LLM
- Source import plus bundled ZIP export for Markdown, JSON, HTML, ODP, and MHTML
- Portable HTML snapshot export
- Print / Save PDF workflow with print-friendly slide pages
- Optional caption/transcript support from local `whisper.cpp` or a configured transcript service
- Built-in theme presets plus optional external CSS override
- Accessible light/dark mode that respects system preference and supports manual override
- Presenter panel layout controls and countdown timer
- Accessibility checks in code for headings, links, image alt text, and notes
- Repo-level guidance for accessibility and coding agents

## Run locally

```bash
npm install
npm test
python3 -m http.server 4173
```

Then open:

- `http://localhost:4173/`
- `http://localhost:4173/present/`
- `http://localhost:4173/presenter/`

## Project docs

- `AUTHORING.md`: guide for slide authors — source format, front matter, theming, export, presenter controls, and optional captions
- `ACCESSIBILITY.md`: accessibility posture, validation expectations, and contributor guidance
- `AGENTS.md`: repository instructions for coding agents and automation tools
- `FEATURES.md`: technical inventory of the implemented and maintained feature set
- `LICENSE`: AGPLv3 license for the project
- `STYLES.md`: writing, design, and styling standards for the app and repository docs
- `.github/copilot-instructions.md`: onboarding notes for GitHub Copilot coding agent
- `TODO.md`: future roadmap and integration ideas
- `docs/accessibility-checklist.md`: project accessibility checklist
- `docs/ai-authoring-workflow.md`: recommended workflow and prompt template for AI-assisted deck drafting
- `docs/cloudflare-sync-plan.md`: optional Cloudflare Worker + D1 plan for authenticated online save, load, and comments
- `docs/editor-vision.md`: longer-term product direction for the editor and runtime
- `docs/layout-syntax.md`: layout directives for centered content, columns, media blocks, callouts, and quotes
- `docs/live-captioning-guide.md`: event room setup, browser-native and whisper.cpp captioning, volunteer guidance, known issues, and privacy
- `docs/manual-a11y-testing.md`: Sa11y-assisted and manual accessibility review workflow
- `docs/resources.md`: accessibility references and source material

## AI disclosure

Disclosure of AI use is important to this project.

### AI used to build this repository

- OpenAI Codex, a GPT-5-based coding agent in the Codex desktop environment, was used during repository setup and early development.
  It was used to scaffold the initial static application, write and revise project documentation, add tests, and update planning and guidance files.

### AI used when running the program

- No AI is required to run the program by default.
- The current application runs as a static browser app with no required runtime dependency on an LLM or remote AI service.
- Optional speech-to-text can be enabled for presentations when a local `whisper.cpp` process or a compatible transcript service is available.

### Browser-based AI in the current application

- Browser-based AI is not currently enabled in this application.
- No part of the current shipped editor or presentation runtime executes an in-browser LLM.
- Caption UI stays hidden unless a transcript source is actually available.

### Planned AI direction

- Optional AI-assisted review and editing may be added later.
- If implemented, AI use should be disclosed clearly, kept optional, and separated from the static baseline experience.

## Routes

- `/` editor
- `/present` audience presentation
- `/presenter` presenter view

The repository includes `404.html` so GitHub Pages can redirect deep links back into the single-page app.

## Architecture

- `index.html` loads the app shell
- `src/main.js` routes between editor, audience, and presenter views
- `src/modules/parser.js` parses front matter, slides, and presenter support sections
- `src/modules/markdown.js` renders the current supported Markdown subset
- `src/modules/a11y.js` contains accessibility lint rules
- `src/modules/captions.js` handles caption-source detection, transcript parsing, and transcript polling
- `src/modules/export.js` generates the standalone snapshot HTML
- `src/modules/presentation-state.js` manages reveal-step navigation and duration metadata
- `src/modules/presenter-timer.js` manages presenter countdown timer state
- `src/modules/slide-layout.js` manages slide dimensions and body-text fitting
- `src/modules/theme.js` applies built-in themes and optional external stylesheet overrides
- `src/modules/color-mode.js` manages accessible light/dark mode
- `src/modules/storage.js` handles IndexedDB-first persistence
- `styles/app.css` contains the UI and presentation styling

## Accessibility and AI

Accessibility applies to both the editor UI and the generated slide output. The project is targeting accessible HTML, keyboard navigation, visible focus states, and reduced-motion support.

Whisper-style speech-to-text remains optional. AI-related controls should only be exposed when local or API-backed AI is actually available. Static GitHub Pages mode should continue to work without any server or AI dependency.

Longer term, the editor should support optional LLM-assisted slide review and revision workflows, including local-first integrations such as Ollama, comment-style suggestions, and strong undo/redo support for all applied changes.

The project should be reusable by others, including teams such as CivicActions and W3C, but it should not depend on their adoption to justify product quality. The baseline should stand on its own.

The accessibility approach should actively build on strong public guidance, especially Intopia's presentation accessibility recommendations, while also promoting resources from Inklusiv and related accessibility communities.

