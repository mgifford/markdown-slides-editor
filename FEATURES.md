# FEATURES.md

This document is the technical feature inventory for `markdown-slides-editor`.

It describes what is currently built, what this repository is expected to maintain, and where the current boundaries are. It is meant to be more implementation-focused than the README and more product-focused than inline code comments.

## Product Summary

`markdown-slides-editor` is a static, browser-based slide authoring system for GitHub Pages.

It combines:

- a Markdown editor
- an in-browser parser and compiler
- an audience presentation runtime
- a presenter view
- export formats for editing, sharing, handoff, and presentation

The project goal is closer to "Google Slides, but with Markdown" than a simple Markdown-to-HTML converter.

## Core Hosting Model

The maintained baseline is:

- static hosting only
- no required backend
- no required build step
- no required cloud account
- no required AI service

Primary supported environments:

- GitHub Pages
- local static serving with `python3 -m http.server 4173`

## Source Authoring Features

### Markdown deck structure

Supported deck structure:

- YAML-like front matter at the top of the file
- `---` as a slide delimiter
- visible slide content written in Markdown
- `Note:` sections for presenter notes
- `Resources:` sections for references and supporting links
- `Script:` sections for fuller written delivery text

### Front matter support

Currently supported front matter includes:

- `title`
- `lang` — BCP 47 language tag (e.g. `en`, `fr`, `es-MX`, `en-CA`). Sets the HTML `lang` attribute on the presentation and controls the spellcheck language in the editor.
- `Language` — alternative to `lang`; accepts ISO 639-1 codes or full English language names (e.g. `French`, `Spanish`). Resolved to an ISO 639-1 language code automatically. Ignored when `lang` is also present.
- `theme`
- `themeStylesheet`
- `durationMinutes`
- `slideWidth`
- `slideHeight`
- `captionsProvider`
- `captionsSource`
- `titleSlide`
- `subtitle`
- `date`
- `location`
- `speakers`
- `titleSlideQr`
- `titleSlideQrUrl`
- `presentationUrl`
- `publishedUrl`
- `closingSlide`
- `closingTitle`
- `closingPrompt`
- `contactEmail`
- `contactUrl`
- `socialLinks`

### Supported Markdown and layout syntax

The renderer supports a controlled Markdown subset rather than arbitrary user HTML.

Supported content patterns include:

- headings
- paragraphs
- unordered and ordered lists
- links
- images
- blockquotes
- progressive disclosure list items using `- [>]`

Supported layout directives include:

- `::center`
- `::column-left`
- `::column-right`
- width-qualified column directives such as `::column-left-75%` and `::column-right-300px`
- `::media-left`
- `::media-right`
- `::callout`
- `::quote`
- `::mermaid`
- `::svg`

These directives are intended to give authors layout control without opening the door to arbitrary, harder-to-maintain HTML.

## Generated Slide Types

The maintained slide system currently supports:

- title slides generated from front matter
- standard content slides
- quote slides
- callout slides
- centered-content slides
- bullet-heavy slides with progressive disclosure
- text-and-bullets slides
- column-based slides
- media-plus-text slides
- closing/question slides generated from front matter

Generated title slides can include:

- title
- subtitle
- date
- location
- speakers
- optional QR code

Generated closing slides can include:

- closing title
- closing prompt
- contact email
- contact URL
- social links
- published presentation URL
- QR code to the published deck

## Editor Features

The editor view at `/` currently includes:

- Markdown source editing
- browser-native spellcheck (enabled automatically, language driven by `lang` front matter field)
- live preview of the active slide
- split-pane editing and preview by default on desktop widths
- automatic preview sync based on caret position in the source editor
- slide outline
- presenter support panel
- deck metadata display
- density warning and overflow suggestion UI
- built-in theme selection
- external CSS override
- local browser persistence
- help modal
- AI prompt generator modal
- one-page view launcher
- audience-view launcher
- presenter-view launcher

### Editor workspace behavior

Current workspace controls include:

- Markdown insert toolbar actions for common structure and layout snippets (for example bold, list, slide break, note, resources, script, center, columns, media, callout, quote, Mermaid, and SVG)
- minimize editor pane
- hide slide outline
- mobile pane switching between `Edit`, `Preview`, and `Support`

Current persistence behavior:

- decks are stored locally in the browser
- IndexedDB is preferred
- `localStorage` fallback is implemented
- local reset actions are available through `Advanced`

### Import and recovery

Supported author recovery flows:

- import Markdown source
- import JSON deck data
- reset local deck to starter content
- clear local app data
- email deck handoff for mobile-to-desktop workflows

## Presentation Runtime Features

### Audience view

The audience runtime at `/present/` supports:

- clean slide-only presentation surface
- keyboard navigation
- progressive disclosure
- deep-linkable slide hashes like `#4`
- deep-linkable reveal-step hashes like `#4.1`
- theme and color-mode application
- body-text auto-fit
- synchronization with presenter view
- optional caption display when a transcript source is available

Audience view intentionally avoids persistent presenter/editor controls.

### Presenter view

The presenter runtime at `/presenter/` supports:

- current slide panel
- next slide panel
- notes panel
- references/resources visibility through support content
- script visibility through support content
- countdown timer
- outline
- live captions panel when available
- audience-window launcher
- synchronized slide control over the audience view

### Presenter layout controls

Presenter panels currently support:

- width increase and decrease
- panel reordering
- minimized state
- fullscreen state
- persistent layout saved locally in the browser

Minimized panels surface as restore buttons in the presenter toolbar.

### Presenter timer behavior

Current timer features include:

- duration from `durationMinutes`
- minute-only display
- pause
- reset
- plus/minus minute adjustment
- timer status button in the presenter toolbar
- auto-start after advancing from slide 1 by default
- reset when returning to slide 1
- optional manual override for auto-start
- color warning progression as time runs down
- sticky bottom progress line in presenter view

## Export Features

### Primary export

The primary `Export` action downloads a ZIP bundle.

Current bundle contents:

- `deck.md`
- `deck.json`
- `presentation.html`
- `presentation.odp`
- `presentation-one-page.mhtml`
- `presentation-offline.html`

ZIP filenames are generated from the deck title plus date when available.

### Standalone presentation export

The HTML snapshot export maintains:

- rendered slide HTML in slide-card containers (correct aspect ratio, viewport-scaling)
- theme data
- runtime navigation
- reveal-step behavior
- embedded source payload
- viewport-filling layout: slides scale to fill the browser window at any display size

This is intended as a portable presentation output.

### One-page view

The one-page view is available as an in-browser window rather than an automatic download. It is designed for printing or saving as PDF.

Current one-page behaviors:

- opens in a new window or tab (tooltip explains its print/PDF purpose)
- shows all slides in sequence
- wraps each slide in a clear card
- renders notes, references, and script in sub-cards beneath each slide
- exposes optional `Save HTML`
- exposes `Print / Save PDF`
- has print-aware styling for handout/PDF workflows
- **4 per page** toggle: switch between 1-slide-per-page and a 2×2 four-up layout; speaker notes are hidden in 4-up mode to save space
- multi-column slide layouts are preserved regardless of browser window width

### ODP and MHTML output

Current additional export formats:

- ODP for OpenDocument Presentation handoff and PowerPoint import
- MHTML (`presentation-one-page.mhtml`) for one-file archival/transfer of the one-page handout view
- HTML (`presentation-offline.html`) for fully offline presenter-and-audience presentation

### Offline presenter HTML

`presentation-offline.html` is a fully self-contained offline presenter file. Opening it in a browser shows:

- **Presenter view** (default): current slide, next-slide preview, speaker notes, and a countdown timer
- **Open Audience Window** button: opens a linked audience view in a new browser window

Audience and presenter windows stay in sync:

- Navigating in the presenter advances the audience display automatically
- Navigating in the audience window notifies the presenter view

The file requires no network access once saved. If a `themeStylesheet` URL is set in the deck front matter, the CSS at that URL is fetched at export time and embedded directly so the offline file remains self-contained.

## Accessibility Features

Accessibility is a maintained feature area, not a secondary enhancement.

Current implemented accessibility-related features include:

- semantic heading checks
- skipped-heading detection
- generic-link warnings
- missing-alt-text errors
- density and overflow awareness
- reduced-motion support
- visible focus styling
- keyboard navigation in audience and presenter views
- copy-safe presentation shortcuts
- support for logical reading order in rendered output
- print-friendly one-page handout behavior

Current repo guidance:

- `ACCESSIBILITY.md`
- `docs/accessibility-checklist.md`
- `docs/manual-a11y-testing.md`
- `docs/resources.md`

## Theming and Appearance

Current theming features:

- built-in theme presets
- optional external stylesheet override
- mutually exclusive theme-vs-external-CSS editor controls
- shortened URL display for external CSS in the editor
- accessible light/dark mode
- system preference detection for color mode
- manual color-mode override
- presenter and audience color-mode support

External CSS is intended for branded decks and organization-specific styling, while keeping slide semantics stable.

## AI and Captioning Features

### Current AI-related functionality

The static baseline does not require AI.

Currently implemented optional AI-related features:

- in-editor AI prompt generator
- structured prompt generation from title, presenters, duration, topics, and references
- guidance for AI-assisted drafting in `docs/ai-authoring-workflow.md`

No in-browser LLM is currently run by default.

### Optional caption/transcript support

Optional caption support currently includes:

- transcript-source capability detection
- hidden-unless-available caption UI
- localhost-friendly default transcript lookup for `whisper.cpp`
- explicit front matter configuration for transcript sources
- presenter and audience caption display when available
- local helper scripts for transcript mirroring and Whisper development flows

Speech-to-text UI must stay hidden when transcript capability is not available.

## Local-First and Offline-Oriented Features

This repository actively maintains a local-first model.

Current local-first features:

- browser-local deck persistence
- no required account or login
- no required network service for basic authoring
- browser export for long-term retention and sharing
- same-origin presenter/audience synchronization
- support for local transcript files on localhost

Important current caveat:

- some exports may still depend on networked assets when external CSS or remote QR/image resources are used

## Testing and Validation

Current automated validation includes:

- Node built-in unit tests
- semantic export checks via `scripts/check-semantic-output.js`

Current test coverage areas include:

- parser behavior
- rendering behavior
- export generation
- AI prompt generation
- accessibility lint logic
- slide layout fitting
- presenter layout behavior
- presenter timer behavior
- storage fallback behavior
- deep-link hash parsing

Current manual validation expectations are documented and include:

- editor flow
- audience flow
- presenter flow
- one-page handout review
- accessibility review
- export verification

## Maintained Constraints

The following constraints are intentional and maintained:

- no required backend for baseline use
- no SSR
- no required framework or bundler
- no required AI dependency
- GitHub Pages compatibility
- semantic HTML preferred over custom ARIA-heavy widgets
- local browser storage prioritized over server state for the default workflow

## Current Non-Goals / Known Gaps

The following are not yet fully implemented or are intentionally limited:

- no full `whisper-slides` runtime parity yet
- no automated `axe` or `pa11y` pipeline yet
- no first-class embedded video directive yet
- no complete local asset bundling for export archives
- no browser E2E test suite yet
- no fully self-contained offline export when remote CSS or remote QR/image assets are referenced
- no integrated AI chat revision workflow yet
- no undo/redo system mature enough for AI-assisted editing workflows yet

## Maintenance Standard

This file should be updated when features are materially added, removed, or re-scoped.

At a minimum, update `FEATURES.md` when changes affect:

- source format
- editor capabilities
- presenter behavior
- audience runtime behavior
- exports
- accessibility guarantees
- theming
- AI/caption availability
- testing and validation expectations
