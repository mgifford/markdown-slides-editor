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
| `::big-stat` | Large centred statistic with equal spacing above and below |
| `::column-left` / `::column-right` | Two-column layout |
| `::media-left` / `::media-right` | Image or media beside text |
| `::image-hero` | Full-bleed background image with short overlay text and optional corner logo |
| `::split-left` / `::split-right` | Magazine-style 50/50 layout with edge-to-edge image |
| `::large` | Increase text size for sparse, high-impact content |
| `::small` | Decrease text size for dense reference content |
| `::callout` | Highlighted callout box |
| `::quote` | Styled blockquote |
| `::mermaid` | Inline Mermaid diagram |
| `::svg` | SVG figure wrapper for scalable custom graphics |
| `::slide-bg` | Inline SVG rendered as a background layer behind slide text |

### `::large` / `::small` — text size variants

Use `::large` to increase text size for slides with sparse content that should fill the available space. Use `::small` when you need to fit denser reference material on a single slide.

```md
::large
One clear idea deserves the full attention of the room.
::
```

```md
::small
| Feature | A | B | C |
|---------|---|---|---|
| Speed   | Fast | Medium | Slow |
::
```

These wrap the content in a size-adjusted container. `::large` scales text to roughly 1.4× body size; `::small` scales to roughly 0.7×. Both work alongside the auto-scaling system, which still adjusts the overall body text to fill the slide.

### `::split-left` / `::split-right` — magazine-style 50/50 layout

Use `::split-left` or `::split-right` for a full-height, edge-to-edge image beside a text column. The image fills exactly half the slide with no padding, and the text column is vertically centered in the other half.

Separate the image and text sections with `---`:

```md
::split-left
![Descriptive alt text](https://example.com/photo.jpg)
---
### Heading

Body text beside the image.
::
```

```md
::split-right
![Descriptive alt text](https://example.com/photo.jpg)
---
Text on the left, image on the right.
::
```

`::split-left` places the image on the left; `::split-right` places it on the right. The image uses `object-fit: cover` to fill its half without distortion. Alternate between left and right across slides for visual variety.

### `::big-stat` — key number slides

Use `::big-stat` to present a single large statistic with equal spacing above and below the number. Separate the content into sections with `---`. Two sections give a stat number and body text; three sections add an optional visual element above the number.

```md
# Key number

::big-stat
**73%**
---
of people retain a message better when it is paired with one strong visual.
::
```

Three-section variant with an inline SVG visual above the number:

```md
# Key number

::big-stat
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true">
  <!-- your icon here -->
</svg>
---
**73%**
---
of people retain a message better when it is paired with one strong visual.
::
```

The bold text (`**…**`) in the number section is rendered at a large display size (roughly 5× body text) and coloured with the accent colour. The body section text is kept smaller to create clear visual hierarchy.

### `::image-hero` — image-first slides

Use `::image-hero` to fill the entire slide with a background image, with an optional short text overlay and a corner logo (for example, an organisation SVG mark).

```md
# Slide title (kept for navigation/aria-label; hidden on-screen by default)

::image-hero text-bottom-left logo-top-right
![Descriptive alt text for accessibility](https://example.com/photo.jpg)
---
**Short** overlay (≤ 25 chars)
---
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40">
  <!-- your SVG logo here -->
</svg>
::

Note:
Full argument, background context, and references go here.
They appear in presenter view but not on screen.

Resources:
- [Source](https://example.com)
```

Complete demo slide showing all option types together:

```md
# Hero title
## Hero subtitle

::image-hero text-bottom-right logo-top-left show-title show-subtitle stay-3 transition-8 final-0.2
![Descriptive alt text for accessibility](https://example.com/photo.jpg)
---
**Short** overlay (≤ 25 chars)
---
<img src="https://example.com/logo.svg" alt="">
::

Note:
Use notes/resources/script for the full spoken content while keeping the on-screen overlay short.

Resources:
- [Source](https://example.com)

Script:
Optional fuller script text for delivery support.
```

**Section order inside `::image-hero`:** image → `---` → overlay text → `---` → logo SVG or img.  
The overlay and logo sections are optional.

**Text position modifiers:** `text-top-left`, `text-top-right`, `text-bottom-left` (default), `text-bottom-right`, `text-center`.  
Also accepted: shorthand/reordered forms such as `text-top`, `text-right`, or `text-right-top` (normalized to the nearest canonical position).

**Logo position modifiers:** `logo-top-left`, `logo-top-right` (default), `logo-bottom-left`, `logo-bottom-right`.  
Also accepted: shorthand/reordered forms such as `logo-left`, `logo-bottom`, or `logo-left-bottom`.

**Optional heading visibility:** `show-title` (show first `#` heading), `show-subtitle` (show first `##` heading), and `show-all` (show all slide text in a readable text layer over the hero image; implies both heading options).  
Without these modifiers, hero headings remain available for accessibility/navigation but are hidden visually.

#### Timed cinematic reveal

Add `stay-N`, `transition-N`, and/or `final-N` modifiers to create a timed reveal effect:

- **`stay-N`** — number of seconds the image is shown alone before the text appears (default `0`).
- **`transition-N`** — number of seconds the overlay takes to expand from hidden to full-screen (default `5`).
- **`final-N`** — final opacity of the background image as a decimal between `0` and `1` (default `0.15`).

```md
::image-hero stay-5 transition-10 final-0.2
<img src="https://example.com/photo.jpg" alt="Descriptive alt text">
---
**Short** overlay (≤ 25 chars)
::
```

The sequence:
1. **Stay phase** (`stay-N` seconds): the image fills the entire slide; no overlay is visible.
2. **Transition phase** (`transition-N` seconds): the overlay expands from invisible to full-screen while the background image fades to `final-N` opacity.
3. **Final state**: the overlay covers the slide with the text prominently displayed; the image shows through at reduced opacity.

Any combination of the three modifiers activates timed mode. They can be combined with text position and logo modifiers. Because the overlay fills the whole screen in the final state, text position modifiers do not affect the visual placement — the text is always centered.

**Accessibility notes:**
- Always provide descriptive `alt` text on the background image.
- Use a direct public image file URL (for example `https://raw.githubusercontent.com/your-org/your-repo/main/path/image.jpg`) rather than a repository page URL.
- Add an `H1` heading to the slide for screen-reader navigation (it can be the same as or longer than the overlay text). Use `show-title` if you want it visible on-screen.
- Keep the overlay text as a short phrase and **25 characters or fewer** — the editor will warn you if it is longer.
- Overlay text supports inline Markdown emphasis (for example `**keyword**`) so you can highlight only the words you want on screen.
- Put the full argument, references, and context in `Note:` / `Resources:` so the offline export and presenter view carry the complete story.
- The timed animation plays through once each time the slide becomes active. It does not loop and cannot be paused. Ensure your content is readable at the start and end states.

### `::slide-bg` — SVG background layer

Use `::slide-bg` to place an inline SVG behind all slide content. The SVG is absolutely positioned to fill the slide and is marked `aria-hidden` so screen readers skip it.

```md
# My slide heading

Body text sits on top of the background.

::slide-bg opacity-0.12
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="45" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2"/>
</svg>
::
```

**Modifier:**

- `opacity-N` — background opacity as a decimal between `0` and `1` (default `0.12`). Keep it low (0.08–0.20) so the background is noticeable but does not compete with the text.

**Light/dark mode:** Use `fill="currentColor"` to inherit the current text colour, or reference design tokens directly in your SVG attributes (`fill="var(--ink)"`, `fill="var(--accent)"`, `fill="var(--accent-soft)"`, etc.). These tokens are already defined for both light and dark modes in the app stylesheet, so your background adapts automatically whenever the colour mode changes.

**Accessibility note:** The background layer is `aria-hidden="true"`, so it is invisible to screen readers. Do not put meaningful content (such as text) inside it.

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
