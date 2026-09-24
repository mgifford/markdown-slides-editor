# AI Authoring for markdown-slides-editor

This guide is the compact, machine-readable contract for generating valid slide
decks for this editor. If you are an external AI system drafting a presentation,
follow the syntax rules exactly — the parser is strict about a handful of things
and forgiving in others, and getting the strict ones wrong silently collapses
slides. Validate any deck you generate before returning it (see
[Validating a deck](#validating-a-deck)).

Human-readable background lives in [`AUTHORING.md`](AUTHORING.md) and the full
layout reference in [`docs/layout-syntax.md`](docs/layout-syntax.md). The
definitive machine source of truth is `src/modules/directives.js`, which drives
the parser, the validator, and the AI prompt generator; do not invent syntax
beyond what it declares.

## The rules that break if you ignore them

1. **`---` separates slides only at "directive depth zero".** A `---` line is a
   slide boundary only when no layout directive is currently open.
2. **Every layout directive you open with `::name` MUST be closed with its own
   `::` line.** An unclosed directive (for example `::callout` with no matching
   `::`) swallows every slide that follows it in the source. This is the most
   common reason an AI-generated deck comes back as a single giant slide.
3. **`---` is never a decorative horizontal rule.** A bare `---` is always a
   slide separator or an internal section separator — never a visual divider.
4. **Only these directives may contain internal `---` sections**
   (specifically as their documented count):

   | Directive | Allowed internal `---` | Required |
   |---|---|---|
   | `::media-left` / `::media-right` | exactly 1 | required |
   | `::split-left` / `::split-right` | exactly 1 | required |
   | `::figure` | 0 or 1 | no |
   | `::big-stat` | 0–2 | no |
   | `::image-hero` | 0–2 | no |

   A `---` inside any other directive is silently swallowed and can collapse
   slides.
5. **Speaker-support sections end at the next slide.** `::notes`, `::resources`,
   `::script` (and their singular/plural aliases) do NOT need a closing `::`;
   they run to the next `---`. Do not put a rendered directive inside them
   without closing that inner directive with `::`.
6. **Title and closing slides come from front matter**, not from Markdown
   slides you write. Set `titleSlide: true`, `closingSlide: true`, and the
   related `title:` / `speakers:` / `closingTitle:` / `contactUrl:` fields. The
   runtime generates them; do not add extra "thank you" or "title" slide bodies.
7. **Never invent directives.** An unknown `::anything` line is treated as an
   open directive and breaks slide splitting; contain yourself to the
   directives below.

## The result of a well-formed deck

- Slide boundaries are unambiguous: every `---` is either a boundary or a
  documented internal section.
- Sparse on screen: well under 65 visible words, at most 4 bullets per slide.
- One `H1` per slide, no skipped heading levels.
- Meaningful alt text on every image.
- The argument, references, and spoken lines live in `Note:` / `Resources:` /
  `Script:`, not only in the visible body.

## Deck skeleton

```md
---
title: My presentation
titleSlide: true
speakers: Alice Example
durationMinutes: 20
closingSlide: true
closingTitle: Questions?
contactUrl: https://example.com
---

# Slide one

Visible content stays short.

- One point
- [>] Second point revealed on advance

Note:
Speaker notes for presenter view.

Resources:
- [Reference](https://example.com)

---

# Slide two

::callout
One memorable sentence per callout.
::
```

## Layout directives

The following is the complete authorable set.
Every row requires its own closing `::` unless stated otherwise.

| Directive syntax | Closes with `::` | Internal `---` | Purpose | Best for | Avoid |
|---|---|---|---|---|---|
| `::center` … `::` | yes | no | Centre one image, statement, or short line | A single visual moment, one emphatic sentence, a transition | More than a few words; centering hides hierarchy |
| `::svg` … `::` | yes | no | Present an SVG asset as a figure block | Diagrams, icons, sharp vector illustrations | Decorative SVG that only adds noise |
| `::mermaid` … `::` | yes | no | Render a Mermaid diagram from source | A small flowchart the audience reads at a glance | Diagrams a screen reader cannot convey |
| `::large` … `::` | yes | no | Scale text to about 1.4× body size | Sparse, high-impact statements | Dense copy |
| `::small` … `::` | yes | no | Scale text to about 0.7× body size | Dense reference material, small tables | Making the main point small |
| `::callout` … `::` | yes | no | Highlight one short conclusion or takeaway | One memorable sentence (`on-click` supported) | A paragraph or a list of several ideas |
| `::quote` … `::` | yes | no | Styled attributed pull quote | One memorable quotation | Two quotes, or a long block quotation |
| `::big-stat` … `::` | yes | 0–2 | One number is the whole argument | A single statistic that proves the point | Comparing several stats on one slide |
| `::media-left` / `::media-right` … `::` | yes | 1 | Visual beside text (left or right) | An image that materially explains the point | Decorative images |
| `::split-left` / `::split-right` … `::` | yes | 1 | Full-height edge-to-edge image beside a text column | Magazine-style strong visual + a vertical line of text | Dense text columns |
| `::figure` … `::` | yes | 0–1 | Image with optional caption | A chart or diagram plus its interpretation | A caption that only repeats the image |
| `::table` … `::` | yes | no | A pipe-delimited Markdown table | Wide-but-short comparisons | Long tables; prefer resources |
| `::step` … `::` | yes | no | Group lines into one progressive reveal block (`on-click`) | A heading + supporting line advancing together | Revealing everything |
| `::code javascript` … `::` | yes | no | Code block with an optional language class | A short snippet to read | Long listings; put the full source in resources |
| `::slide-bg` … `::` | yes | no | `aria-hidden` inline SVG behind all content | Subtle branded background (`opacity-0.12`) | Meaningful content; it is hidden from screen readers |
| `::image-hero` … `::` | yes | 0–2 | Full-bleed background image + short overlay + optional logo | One strong photograph with ≤25-character overlay text | Evidence-heavy slides |
| `::iframe title:Demo` … `::` | yes | no | Embed one HTTP(S) page | A live demo or tool | Pages that block embedding |
| `::column-left` / `::column-right` … `::` | yes | no | Half of a side-by-side comparison | Real before/after or A/B contrast | Sequential ideas that belong on separate slides |

### Column width variant

`::column-left-75%` and `::column-right-30%` accept a percentage suffix
(`px`, `%`, `rem`, `vw` accepted) that sets that column's width.

### Progressive reveal modifiers

Append `on-click` to reveal the block on the next advance, or `off-click` to
hide a block that starts visible on the next advance. Supported on every layout
directive except `::large` and `::small` (which ignore modifiers).

```md
::callout on-click
Revealed on advance.
::
```

### `::image-hero` modifiers

- Text position: `text-bottom-left` (default), `text-bottom-right`,
  `text-top-left`, `text-top-right`, `text-center`, plus shorthand orderings.
- Logo position: `logo-top-right` (default), `logo-top-left`, `logo-bottom-left`,
  `logo-bottom-right`, plus shorthand orderings.
- Heading visibility: `show-title`, `show-subtitle`, `show-all`.
- Timed reveal: `stay-N`, `transition-N`, `final-N` (decimal opacity).
- Note: an H1 heading on the slide keeps navigation/accessibility working even
  when it is hidden on screen.

### `::slide-bg` modifier

- `opacity-N` — decimal opacity between `0` and `1` (default `0.12`); keep it
  in 0.08–0.20 so it does not compete with text.

### `::iframe` modifiers

- `width:...`, `height:...`, `title:...`, and the URL itself, or a URL on the
  first content line.

## Speaker-support sections

All are case-insensitive, their closing `::` is optional (each runs to the next
slide boundary), and singular/plural forms are accepted:

| Directive | Contains |
|---|---|
| `::note` / `::notes` | Speaker notes for presenter view |
| `::resource` / `::resources` / `::reference` / `::references` | Reference links and URLs |
| `::script` / `::scripts` | Fuller spoken script |

The colon labels `Note:` / `Resources:` / `Script:` are the equivalent and can
be used instead.

## Designing for the audience

- **Sparse is correct.** Fit the visible takeaway on the slide; move prose to
  notes and resources. Aim for the same you would write on a poster.
- **One idea per slide.** If a slide has two independent ideas, split it.
- **Density targets:** `::center`, `::callout`, `::quote`, `::large` are for one
  short idea; `::media-*` / `::split-*` pair a visual with a sentence or two;
  `::small` and `::table` are the only homes for genuinely dense reference
  material.
- **Accessibility is part of the format.** `H1` per slide, no skipped levels,
  alt text everywhere, never hide meaning behind colour or visuals, and keep
  the background `::slide-bg` purely decorative.

## Validating a deck

Reproduce the parser's exact rules before delivering a deck:

```sh
npm run validate:deck -- examples/government-policy.md
npm run validate:deck -- < deck.md
```

Exit code `0` and `valid: true` means every slide boundary and directive is
unambiguous. Treat warnings as meaningful — they flag modifiers the renderer
ignores and media/split directives missing their internal `---`.

## Canonical examples

Read these before generating content; they are valid decks that exercise the
syntax correctly:

- `examples/government-policy.md` — civic narrative with `::callout`,
  `::media-right`, `::table`, and heavy `Note:` / `Resources:` support.
- `examples/technical-talk.md` — technical demo with `::code`, `::mermaid`,
  `::figure`, and a data `::table`.
- `examples/evidence-report.md` — evidence review with `::big-stat`,
  `::quote`, `::column-left` / `::column-right`, and `::image-hero`.
- `examples/keynote.md` — brand-keynote pacing with `::center`, `::split-left`,
  `::split-right`, and sparse, high-impact text.