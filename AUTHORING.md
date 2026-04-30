# Authoring Guide

This tool lets you write slide decks in Markdown, preview them in the browser, and present or export them without any server. You write plain text; the editor handles the layout, theming, and accessibility checks.

## Source format

A deck is a Markdown file with optional front matter at the top and `---` between slides.

```md
---
title: My presentation
lang: en
theme: default-high-contrast
durationMinutes: 20
slideWidth: 1280
slideHeight: 720
themeStylesheet: https://example.com/presentation-theme.css
captionsProvider: whisper.cpp
captionsSource: http://localhost:4173/whisper-demo/transcript.json
titleSlide: true
subtitle: A better slide workflow
date: 2026-03-22
location: Toronto
speakers: Alice Example; Bob Example
titleSlideQr: true
closingSlide: true
closingTitle: Questions?
closingPrompt: Thanks for listening.
contactEmail: hello@example.com
contactUrl: https://ox.ca
socialLinks: Mastodon @[email protected]; Bluesky @ox.ca
presentationUrl: https://ox.ca/slides/demo-deck
---

# Slide title

Visible content.

- Visible point
- [>] Reveal this point later in presentation mode

Note:
Speaker notes go here.

Resources:
- [Reference article](https://example.com/article)

Script:
Optional full script text can go here for delivery support or to share with attendees in advance.

---

# Next slide
```

### Front matter fields

| Field | Description |
|---|---|
| `title` | Deck title |
| `lang` | BCP 47 language code (e.g. `en`) |
| `theme` | Built-in theme name (see [Theming](#theming)) |
| `durationMinutes` | Presentation length used by the countdown timer |
| `slideWidth` / `slideHeight` | Fixed presentation surface size (default 1280×720) |
| `themeStylesheet` | URL of an external CSS stylesheet loaded after the built-in theme |
| `captionsProvider` | Caption source type (`whisper.cpp` or `service`) |
| `captionsSource` | URL of the transcript JSON endpoint |
| `titleSlide` | `true` to generate an opening title slide from front matter fields |
| `subtitle` | Shown on the generated title slide |
| `date` | Shown on the generated title slide |
| `location` | Shown on the generated title slide |
| `speakers` | Semicolon-separated speaker names shown on the title slide |
| `titleSlideQr` | `true` to show a QR code for `presentationUrl` on the title slide |
| `titleSlideQrUrl` | Override URL for the title-slide QR code |
| `closingSlide` | `true` to generate a final questions/follow-up slide |
| `closingTitle` | Heading on the closing slide (e.g. `Questions?`) |
| `closingPrompt` | Body text on the closing slide |
| `contactEmail` | Shown on the closing slide |
| `contactUrl` | Shown on the closing slide |
| `socialLinks` | Semicolon-separated social handles shown on the closing slide |
| `presentationUrl` / `publishedUrl` | Published deck URL; used for the closing-slide QR code |

### Speaker support sections

Each slide can include optional sections after the visible content. These do not appear to the audience but are available in the editor and presenter panels.

| Label | Purpose |
|---|---|
| `Note:` | Speaker notes |
| `Resources:` | Reference links and URLs |
| `Script:` | Fuller written script for delivery support or advance sharing |

The `::` directive style is equivalent and can be used interchangeably:

```md
# Slide title

Visible content.

::notes
Speaker notes go here.
::

::resources
- [Reference article](https://example.com/article)
::

::script
Optional full script text.
::
```

The closing `::` is optional. Labels are case-insensitive (`::Notes`, `::NOTE`, etc.), and singular/plural forms are all accepted (`::note`/`::notes`, `::resource`/`::resources`, `::reference`/`::references`, `::script`/`::scripts`).

## Progressive disclosure

Use `- [>]` inside a list item to mark content for step-by-step reveal in audience and snapshot presentation modes:

```md
- First point (visible immediately)
- [>] Revealed on next advance
- [>] Revealed on the advance after that
```

## Layout directives

The editor supports layout directives for more complex slide arrangements. See [`docs/layout-syntax.md`](docs/layout-syntax.md) for the full reference with examples.

Quick reference:

| Directive | Effect |
|---|---|
| `::center` | Centre-align content vertically and horizontally |
| `::column-left` / `::column-right` | Two-column layout |
| `::media-left` / `::media-right` | Image or media beside text |
| `::callout` | Highlighted callout box |
| `::quote` | Styled blockquote |
| `::mermaid` | Inline Mermaid diagram |
| `::svg` | SVG figure wrapper for scalable custom graphics |

## Theming

Select a theme from the editor UI or set `theme` in front matter.

Available built-in themes:

- `default-high-contrast`
- `paper-warm`
- `night-slate`
- `civic-bright`

For custom branding, set `themeStylesheet` to a CSS URL. That stylesheet loads after the built-in theme and can override colors, typography, spacing, and other styles.

A CivicActions-inspired external theme is available in this repository:

```
https://mgifford.github.io/markdown-slides-editor/styles/civicactions-ox.css
```

Example front matter combining both:

```md
---
theme: default-high-contrast
themeStylesheet: https://mgifford.github.io/markdown-slides-editor/styles/civicactions-ox.css
---
```

## Color mode

The editor and presenter interfaces support accessible light and dark modes.

- By default, the app follows the browser or operating system preference.
- A manual toggle is available in the editor and presenter headers.
- The selected mode is saved locally in the browser.
- Audience view respects the saved choice and supports `D` as a keyboard toggle.

## Presenter view

Open presenter view at `/presenter` while your audience sees `/present`.

Presenter view includes:

- Current slide and next slide panels
- A configurable countdown timer based on `durationMinutes`
- `-1 min`, `+1 min`, `Pause`, and `Reset` controls
- A bottom progress bar that shifts from green to red as time runs down
- Presenter support content from `Note:`, `Resources:`, and `Script:`

## Audience view

Audience view keeps the slide surface clean. Text zoom is controlled from presenter view so you can adjust readability without putting extra controls on the audience screen.

| Presenter view control | Effect |
|---|---|
| `A-` button or `-` key | Make slide text smaller in both views |
| `A` button or `0` key | Reset zoom in both views |
| `A+` button or `+` key | Make slide text larger in both views |

## Export

The primary export action downloads a ZIP bundle containing:

| File | Contents |
|---|---|
| `deck.md` | Markdown source for future editing |
| `deck.json` | Machine-readable deck for workflows and integrations |
| `presentation.html` | Portable snapshot for presenting or sharing |
| `presentation.odp` | OpenDocument Presentation for PowerPoint import |
| `presentation-one-page.html` | Single-file one-page handout |
| `presentation-offline.html` | Self-contained offline presenter |

`Advanced` also includes `Email Deck`, which opens a mail draft with the editor URL and, when the deck is short enough, the Markdown source. This is a practical mobile-to-desktop handoff aid and may be limited by mail client body-size limits.

The exported HTML is portable, but not always fully self-contained. If you use `themeStylesheet` or QR-code features that depend on remote resources, the exported presentation still needs network access to load those external assets.

For PDF output, use `Print / Save PDF`. That opens a printable snapshot and triggers the browser print dialog so you can print or save the deck as a PDF. HTML is the preferred accessible format, but the print stylesheet aims to produce a clean one-slide-per-page PDF when needed. Browser-generated PDFs vary in how much accessibility structure they preserve.

## Optional captions

Live captions are optional and stay hidden unless a transcript source is actually available.

Two supported paths:

- Local `whisper.cpp`, typically writing `whisper-demo/transcript.json`
- A compatible service endpoint exposed through `captionsSource`

Expected transcript shape:

```json
{
  "active": true,
  "generated": "2026-03-22T16:00:00Z",
  "text": "Current live transcript text"
}
```

If you run the app on `localhost`, it automatically checks `./whisper-demo/transcript.json` and only shows caption UI when that file becomes available.

For explicit configuration, add to front matter:

```md
---
captionsProvider: whisper.cpp
captionsSource: http://localhost:4173/whisper-demo/transcript.json
---
```

or:

```md
---
captionsProvider: service
captionsSource: https://captions.example.com/presentation/transcript.json
---
```

Local helper scripts:

- `npm run dev:whisper` — starts a `whisper.cpp` `whisper-stream` process and writes `whisper-demo/transcript.json`
- `npm run dev:transcript -- --src ./some-transcript.txt` — mirrors a text or JSON file into the same transcript format for testing

This follows the same local-first pattern used in `whisper-slides`: the deck stays static while a local or service-backed transcript source is polled only when available.
