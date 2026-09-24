# AGENTS.md

## Project Overview

- This repository is a small, static browser app for authoring Markdown-based slide decks and previewing them as accessible HTML presentations.
- The current implementation is plain JavaScript, HTML, and CSS with no frontend framework and no bundler.
- The long-term direction is to align the generated presentation runtime with `whisper-slides`, preserve strong W3C-style accessible slide markup, and expose Whisper speech-to-text only when local or API-backed AI is actually available.
- GitHub Pages static hosting is a core constraint. Do not introduce a server requirement for the default experience.
- Leveraging local browser persistence is important. Prefer browser-side caching and storage over network-dependent state when adding features for the default static workflow.
- Read `STYLES.md` alongside this file when making UI, wording, or presentation-style changes.
- Keep `README.md` and disclosure/accessibility docs current when behavior changes materially, especially around AI, exports, presenter controls, accessibility affordances, and keyboard shortcuts.

## Setup Commands

- Check runtime versions first:
  - `node -v` validated with `v18.20.8`
  - `npm -v` validated with `10.8.2`
  - `python3 --version` validated with `Python 3.9.6`
- Install dependencies with `npm install`
  - Validated result in this repo: succeeds in about 244ms and reports no vulnerabilities.
  - Today this is effectively a no-op because the repo has no package dependencies, but it is still safe to run.
- Run tests with `npm test`
  - Validated result: passes with Node’s built-in test runner in about 50ms.
- Run the app locally with `python3 -m http.server 4173`
  - This is the documented local dev server for the current static app.
  - In the Codex sandbox this required elevated permission and then served successfully; follow-up `curl` checks could not connect from a separate sandboxed process, so treat that as an environment limitation, not a repo failure.
  - On a normal local machine, open `http://localhost:4173`.

## Always-Do Validation Flow

- Always run `npm install` before validating changes, even though it is currently a no-op.
- Always run `npm test` before finishing a change.
- If you touch the directive grammar or generate deck content, run `npm run validate:deck -- <file>` on a sample deck and confirm every example deck still validates cleanly.
- If you touch presentation behavior, also run the local static server and manually verify:
  - `/` editor
  - `/present/` audience view
  - `/presenter/` presenter view
- If you touch editor/source syncing, verify that moving the caret in the Markdown source updates the preview to the matching slide.
- If you touch export, verify that the main `Export` ZIP still contains the expected bundle files.
- If you touch accessibility rules or rendering, compare behavior against `docs/accessibility-checklist.md` and `docs/manual-a11y-testing.md`.

## Project Layout

- Root files:
  - `index.html`: SPA shell that loads `src/main.js`
  - `404.html`: GitHub Pages redirect helper for deep-link routes
  - `README.md`: human-oriented project summary and local run instructions
  - `LICENSE`: AGPLv3 license text
  - `TODO.md`: future roadmap ideas, especially `whisper-slides`, W3C accessibility patterns, and optional AI/Whisper support
  - `package.json`: minimal scripts for testing, local serving, and optional Whisper helpers
- Documentation:
  - `AI_AUTHORING.md`: compact authoring contract for external AI systems generating decks — the strict syntax rules, the complete directive reference, and validating decks
  - `docs/accessibility-checklist.md`: required accessibility targets for slide structure, links, media, motion, keyboard support, and validation
  - `docs/editor-vision.md`: longer-term product direction for the editor and runtime
  - `docs/manual-a11y-testing.md`: Sa11y-assisted and manual accessibility workflow
  - `docs/resources.md`: project reference position on Intopia, Inklusiv, WCAG, and APG usage
- Example decks:
  - `examples/government-policy.md`, `examples/technical-talk.md`, `examples/evidence-report.md`, `examples/keynote.md`: canonical, validator-clean decks exercising the directive grammar
- App entry:
  - `src/main.js`: loads stored source, resolves route, and mounts editor, audience, or presenter views
- Routes (three distinct surfaces sharing the `compileSource` pipeline in `src/modules/views/shared.js`):
  - `/` editor (`src/modules/views/editor-view.js`): split-pane authoring surface; broadcasts `deck-updated` / `slide-changed` over the sync channel
  - `/present/` audience view (`src/modules/views/presentation-view.js`): clean presentation shell; keeps navigation state as `(activeSlideIndex, revealStep)`, renders `class="next"` (reveal on advance) and `class="next-reverse"` (hide on advance) via `applyRevealState`, and deep-links positions as `#4` / `#4.1`
  - `/presenter/` presenter view (`src/modules/views/presenter-view.js`): current/next slide, notes, timer, captions, and shared text-zoom controls; owns `publishState()` so presenter navigation drives the audience window
- Core modules:
  - `src/modules/directives.js`: single source of truth for the `::directive` grammar (regex, supported directives, modifier validation) shared by the parser, renderer, validator, and AI prompt generation
  - `src/modules/parser.js`: front matter parsing, directive-aware slide splitting on `---`, speaker note extraction using `Note:`, `::notes`/`::resources`/`::script` section handling, and source-offset mapping so the editor preview can follow the cursor position in Markdown source
  - `src/modules/markdown.js`: lightweight Markdown-to-HTML renderer
  - `src/modules/render.js`: applies Markdown rendering to each parsed slide
  - `src/modules/validate.js`: `validateDeck` — line-backed structural validation of the authoring grammar (unclosed/unknown directives, misplaced `---`, internal-section counts)
  - `src/modules/a11y.js`: current deck linting for H1 count, heading skips, generic links, missing alt text, note presence, and slide-density assessment
  - `src/modules/ai-prompt.js`: generates structured AI briefing prompts from deck content
  - `src/modules/captions.js`: caption-source capability detection, transcript parsing, and transcript polling helpers
  - `src/modules/storage.js`: IndexedDB-first persistence plus fallback to `localStorage`
  - `src/modules/router.js`: route detection and GitHub Pages redirect restoration
  - `src/modules/sync.js`: `BroadcastChannel` presenter/editor sync with a `localStorage` fallback
  - `src/modules/export.js`: bundle export helpers plus standalone HTML, ODP, and one-page MHTML generation
  - `src/modules/slide-layout.js`: slide-size normalization and body-text fitting
  - `src/modules/presenter-layout.js`: presenter panel sizing, reordering, collapse, and fullscreen state
  - `src/modules/presenter-timer.js`: presenter countdown timing, auto-start/reset state, and warning thresholds
- Views:
  - `src/modules/views/editor-view.js`: split-pane editor, preview, notes, AI prompt modal, one-page view, import/export, theme-or-external-CSS controls, preview suggestion tooltip, source-cursor-to-slide syncing, and route launchers
  - `src/modules/views/presentation-view.js`: audience presentation shell, deep-link hashes like `#4` / `#4.1`, and keyboard navigation
  - `src/modules/views/presenter-view.js`: current slide, next slide, notes, timer, panel layout controls, collapse/fullscreen panel states, audience-window launcher, and shared zoom controls
  - `src/modules/views/shared.js`: compile pipeline and shared rendering helpers
- Styling:
  - `styles/app.css`: full visual system and responsive layout
- Tests:
  - `tests/parser.test.js`: parser and rendering coverage
  - `tests/export.test.js`: bundle and export format coverage
  - `tests/a11y.test.js`: density and lint-threshold coverage
  - `tests/ai-prompt.test.js`: AI prompt generation coverage
  - `tests/validate.test.js`: grammar validation coverage across directive nesting, internal `---` sections, and example decks
  - `tests/slide-layout.test.js`: slide-dimension and fitting coverage
  - `tests/presenter-layout.test.js`: presenter panel sizing, collapse, and order coverage
  - `tests/presenter-timer.test.js`: presenter countdown and warning-state coverage
  - `tests/layout-css.test.js`: structural CSS assertions (iframe fallback visibility, hidden-column layout preservation)
  - `features/*.feature` + `features/step_definitions/`: Cucumber.js BDD scenarios covering module-level behavior in Node.js (parsing, rendering, export, storage, timer, accessibility)

## Architecture Notes

- There is no build step, no transpiler, no linter, and no GitHub Actions workflow yet.
- There is no lint command and no `stylelint` (or other CSS) config, so CSS changes in `styles/app.css` have no automated checks. Verify visually in all three routes plus the one-page/print views when touching styles.
- There is no external Markdown library yet; the current Markdown renderer is intentionally small and only supports the syntax implemented in `src/modules/markdown.js` and declared in `src/modules/directives.js`.
- `src/modules/directives.js` is the authoritative directive grammar. Keep the renderer (`markdown.js`), parser (`parser.js`), validator (`validate.js`), AI prompt generator (`ai-prompt.js`), and `AI_AUTHORING.md` in lock-step with it — do not let a `::directive` exist in one surface and not the others.
- An unclosed layout directive (`::name` without its own `::` close) swallows every following slide. The validator reports this; the parser still honours the swallow to stay consistent with rendering.
- Speaker-support sections (`::notes`/`::resources`/`::script`) may be left unclosed; they end at the next `---`.
- The current runtime is an in-repo placeholder. Planned `whisper-slides` alignment is tracked in `TODO.md`.
- Whisper or other AI features must remain optional and should only surface in the UI when an actual AI capability is available.
- Do not show speech-to-text status, buttons, transcript placeholders, or related help text when the transcript source is unavailable.
- The editor preview theme controls are mutually exclusive in practice: if a valid `themeStylesheet` URL is present, the built-in `theme` selector is hidden until the external stylesheet value is cleared.
- The main export action is a single ZIP bundle. Preserve that default rather than reintroducing multiple primary export buttons.
- Keep the static baseline honest: GitHub Pages mode must work without server code, local binaries, or secret keys.
- When adding offline-friendly behavior, prefer existing browser primitives such as IndexedDB, `localStorage`, and cache-aware static asset loading before inventing new infrastructure.

## Editing Guidance

- Prefer small, direct edits in the existing modules over introducing new abstractions.
- If you use AI to materially change the repository, update `README.md` to disclose that use accurately and specifically.
- If you add a new feature, decide first whether it belongs in:
  - the static baseline, or
  - the optional AI/local-runtime layer
- Do not blur those two modes.
- Preserve keyboard access and visible focus states when editing UI.
- Do not intercept standard browser editing and copy shortcuts such as `Cmd/Ctrl+C`. Presentation shortcuts must avoid conflicting with common browser and assistive technology shortcuts.
- Preserve the source format contract:
  - front matter at the top
  - `---` for slide boundaries
  - `Note:` for speaker notes
  - `Resources:` for slide-linked references
  - `Script:` for fuller speaker script content
- When asked to generate presentation content, read `AI_AUTHORING.md` first, follow its syntax rules exactly (every layout directive closes with `::`, `---` is only a boundary at directive depth zero), stay within the directive set in `src/modules/directives.js`, and validate the result with `npm run validate:deck -- <file>` before returning it.
- Optional caption settings should live in front matter, for example `captionsProvider` and `captionsSource`, and must degrade cleanly when the source is unavailable.
- Preserve and extend local browser caching carefully. Changes to persistence or cached assets should degrade gracefully for returning users instead of wiping or bypassing local state.
- Keep the audience route clean. Presentation controls belong in presenter view, not audience view.
- Keep presenter view useful on a real second-screen workflow. Changes to navigation, timers, zoom, or panel layout should still support one-screen presenter control and a second-screen audience window.

## Validation and CI Reality

- There are currently no CI workflows under `.github/workflows`.
- There is currently no lint command.
- There is currently no production build command.
- The effective pre-check-in validation today is:
  - `npm install`
  - `npm test`
  - manual local browser verification when UI behavior changes

## Known Working Commands

- `npm install`
- `npm test`
- `npm run test:unit` — run Node built-in unit tests only
- `npm run test:bdd` — run Cucumber.js BDD scenarios only
- `npm run validate:deck -- examples/government-policy.md` (or `< deck.md` via stdin) — exits 0 and prints `"valid": true` only when every directive and slide boundary is unambiguous; run on any generated deck
- `python3 -m http.server 4173`
- `npm run dev:whisper`
- `npm run dev:transcript -- --src ./path/to/transcript.txt`

## Known Gaps

- No automated browser tests yet (BDD scenarios cover module-level behavior in Node.js)
- No `axe` or `pa11y` automation yet
- No bundled local asset export yet
- No real `whisper-slides` runtime integration yet
- No first-class embedded video directive yet

## Search Policy

- Trust this file first.
- Only search the repo when these instructions are incomplete, stale, or contradicted by the files you are changing.
