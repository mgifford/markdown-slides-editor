# Copilot Instructions

## Repository Summary

This repository is a small static web app for authoring Markdown slide decks and presenting them as accessible HTML. It targets GitHub Pages, so the default experience must stay serverless. The current stack is plain HTML, CSS, and ES modules in the browser; there is no framework, bundler, or build pipeline.
Leveraging local browser cache and storage is important to the product direction.

## First-Read Map

- `index.html` loads the app shell.
- `404.html` restores deep links for GitHub Pages routes.
- `src/main.js` is the entry point and routes to editor, audience, or presenter views.
- `src/modules/directives.js` is the single source of truth for the `::directive` grammar (parser, renderer, validator, and AI prompt generation all read from it).
- `src/modules/parser.js` parses front matter, slide boundaries, `Note:` sections, and `::notes`/`::resources`/`::script` sections.
- `src/modules/markdown.js` renders the supported Markdown subset.
- `src/modules/validate.js` implements `validateDeck` — line-backed structural validation of the authoring grammar.
- `src/modules/a11y.js` contains current accessibility lint rules.
- `src/modules/export.js` builds the standalone HTML snapshot export.
- `src/modules/storage.js` handles IndexedDB-first persistence.
- `src/modules/views/editor-view.js` is the main editing UI.
- `src/modules/views/presentation-view.js` and `src/modules/views/presenter-view.js` are the presentation surfaces.
- `styles/app.css` contains all styling.
- `AI_AUTHORING.md` is the compact authoring contract for external AI systems generating decks; read it before drafting presentation content.
- `examples/` contains canonical, validator-clean example decks.
- `tests/parser.test.js` contains the current automated checks.

## Validated Tooling

- Node: `v18.20.8`
- npm: `10.8.2`
- Python: `3.9.6`

## Validated Commands

- Bootstrap: `npm install`
  - Validated in this repo. It succeeds and is currently a no-op because there are no package dependencies.
- Test: `npm test`
  - Validated. Runs `node --test` and currently passes.
- Validate a deck: `npm run validate:deck -- examples/technical-talk.md` (or `< deck.md` via stdin)
  - Exits 0 and prints `"valid": true` only when every directive and slide boundary is unambiguous. Run it on any deck you generate.
- Run locally: `python3 -m http.server 4173`
  - Validated as the intended local server command.
  - In the sandbox this needed extra permission to bind a port, so if a hosted agent cannot open a port, treat that as environment-specific rather than a repo bug.
- Build: none
  - There is no build script yet.
- Lint: none
  - There is no lint script yet.

Always run `npm install` first, then `npm test`. If you change UI behavior, also run the local static server and manually verify `/`, `/present`, and `/presenter`.

## Architecture and Constraints

- Keep the app GitHub-Pages-friendly: no required backend, no SSR, no mandatory secrets.
- Prefer browser-side persistence and caching for the default experience. Reuse `src/modules/storage.js` patterns and avoid introducing features that require a server round-trip for core editing or presentation flows.
- Keep accessibility central. Use `docs/accessibility-checklist.md` and `docs/resources.md` as project guidance.
- Keep the source format stable:
  - front matter at the top
  - `---` between slides
  - `Note:` between visible content and speaker notes
  - `::name` layout directives in `src/modules/directives.js` — every layout directive must be closed with its own `::`, and `---` is only a slide boundary at directive depth zero. Prefer `Note:`/`Resources:`/`Script:` for audience-supplementary content.
- Keep AI features optional. Whisper or speech-to-text UI should only appear when an actual local or API-backed AI capability is available.
- Preserve existing local deck behavior for returning users. Be careful with changes that could invalidate browser-stored content or bypass cached static assets.
- Do not assume a full Markdown implementation exists; the supported syntax is only what `src/modules/markdown.js` implements today.

## Authoring presentations

When a request asks for presentation content (a deck, slides, or a keynote), read `AI_AUTHORING.md` first and follow the syntax rules exactly — a single unclosed `::directive` collapses every following slide. The supported directive set is defined by `src/modules/directives.js`; never introduce a `::name` that the registry does not declare. Build from the canonical patterns in `examples/`, then validate your output with `npm run validate:deck -- <file>` before returning it.

## Validation Before Finishing

- Run `npm test`.
- If rendering changed, verify slide parsing and export behavior.
- If accessibility logic changed, manually exercise the editor’s accessibility check and review `docs/accessibility-checklist.md`.
- If route behavior changed, verify the GitHub Pages redirect behavior still makes sense with `404.html`.

## Current Repo Reality

- No `.github/workflows` CI pipeline exists yet.
- No linter config exists yet.
- No build config exists yet.
- No external runtime integration with `whisper-slides` exists yet; that is planned future work.

Trust these instructions first and only search the repository when this file is incomplete or you find it is out of date.
