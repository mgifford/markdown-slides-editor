# Layout Syntax

Markdown remains the base authoring format in this project, but the editor also supports a small set of layout directives for common presentation patterns.

These directives are meant to cover frequent slide-layout needs without requiring arbitrary HTML.

## Principles

- Use Markdown for most content.
- Use layout directives for common visual structure.
- Keep the visible content concise.
- Prefer semantic content over decorative layout.
- Do not use layout tricks to hide too much text on a slide.

## Centered content

Use `::center` to center content horizontally within a block.

```md
::center
![Alt text](https://example.com/image.jpg)
::
```

```md
::center
Short centered statement.
::
```

Current behavior:

- centers content left-to-right
- centers text alignment inside that block
- does not vertically center the entire slide

## SVG figures

Use `::svg` when you want to present an SVG asset as a figure block.

```md
::svg
![Architecture diagram](./images/architecture.svg)
::
```

You can also use a raw `<img>` tag when you need to reference an external SVG by URL:

```md
::svg
<img src="https://example.com/diagram.svg" alt="Architecture diagram">
::
```

This is useful for:

- diagrams exported as SVG
- icons and branded vector illustrations
- custom visuals that need to scale cleanly on large screens

## Mermaid diagrams

Use `::mermaid` for MermaidJS diagram source.

```md
::mermaid
flowchart LR
  A[Author] --> B[Deck]
  B --> C[Audience]
::
```

Current behavior:

- Mermaid source is stored directly in the slide
- the editor and exported HTML try to render the diagram in the browser
- Mermaid rendering depends on loading MermaidJS from a CDN at runtime
- if Mermaid cannot load, the source text remains in place instead of breaking the slide

## Two columns

Use paired column directives for left and right column content.

Basic version:

```md
::column-left
- Point one
- Point two
::

::column-right
Supporting text or links.
::
```

Custom widths:

```md
::column-left-75%
- Main content
::

::column-right-300px
Secondary content
::
```

Supported width values currently include common values like:

- percentages such as `75%`
- pixel values such as `300px`
- `rem` values such as `22rem`
- viewport-width values such as `30vw`

### Revealing a column on click

Add the `on-click` modifier to reveal a column progressively, one click at a time. Columns with `on-click` are hidden initially and revealed in source order as the presenter advances.

```md
::column-left
- Replaceable components
- Auditable systems
- Long-term flexibility
::

::column-right on-click
- Replaceable components
- Auditable systems
- Long-term flexibility
::
```

In this example the left column is always visible. The right column is hidden until the presenter clicks forward once.

Both columns can have `on-click`:

```md
::column-left on-click
First column, revealed on click one.
::

::column-right on-click
Second column, revealed on click two.
::
```

The `on-click` modifier also works with a custom-width column:

```md
::column-left-75% on-click
Main content, revealed on first click.
::

::column-right-300px
Always-visible sidebar.
::
```

## Media left or right

Use `::media-left` or `::media-right` when you want an image or other visual beside text.

Separate the visual and the text using a line that contains only `---`.

```md
::media-left
![Alt text](https://example.com/image.jpg)
---
- Bullet one
- Bullet two
::
```

```md
::media-right
![Alt text](https://example.com/image.jpg)
---
Supporting text beside the image.
::
```

This is the recommended way to place an image on the left or right with text beside it.

## Callouts

Use `::callout` for a highlighted point.

```md
::callout
Important message or takeaway.
::
```

Add `on-click` to reveal the callout on click:

```md
::callout on-click
Revealed when the presenter advances.
::
```

## Quotes

Use `::quote` for a pull quote or emphasized quotation.

```md
::quote
Accessibility is a quality issue, not a feature request.
::
```

Add `on-click` to reveal the quote on click:

```md
::quote on-click
Revealed when the presenter advances.
::
```

## The `on-click` modifier

Any layout directive that renders a block element supports the `on-click` modifier:

- `::column-left on-click`
- `::column-right on-click`
- `::callout on-click`
- `::quote on-click`
- `::center on-click`
- `::media-left on-click`
- `::media-right on-click`

Blocks marked with `on-click` are hidden when the slide first appears. Each click (or arrow-key advance) reveals the next `on-click` block in source order. `on-click` blocks and `[>]` progressive list items are interleaved by DOM order: the reveal sequence follows the source top-to-bottom, so a `[>]` list item that appears before an `on-click` block in the source will be revealed first.

In the one-page handout export all `on-click` elements are always visible.

## Accessibility guidance

- Always include meaningful alt text for images.
- Always give Mermaid diagrams enough surrounding context that the audience can understand the point of the diagram.
- Prefer SVG for diagrams and illustrations that need to stay sharp at different sizes.
- Keep columns readable and balanced.
- Do not overload columns with dense text.
- Make sure centered or callout text remains meaningful out of context.
- Use media layouts to support understanding, not just decoration.
- If a layout starts to feel crowded, split it into more slides.

## HTML

Markdown is still the base format.

Raw HTML is not the primary layout mechanism in the current editor. The preferred approach is to use these layout directives so the output remains easier to style, test, and keep accessible.

## Section directives: notes, resources, and script

Speaker notes, references, and speaker scripts can be written using `::` directives for consistency with other layout blocks.

```md
# Slide title

Visible body content.

::notes
Speaker notes go here.
::

::resources
- [Reference article](https://example.com/article)
::

::script
Optional full spoken script for delivery support.
::
```

The `Note:`, `Resources:`, and `Script:` colon-style labels are also still supported. Both forms are equivalent.

Rules:

- The closing `::` is optional. If omitted, the section runs to the end of the slide.
- Labels are case-insensitive: `::Notes`, `::NOTE`, `::RESOURCES`, etc. all work.
- Singular and plural forms are both accepted:
  - Notes: `::note` or `::notes`
  - Resources: `::resource`, `::resources`, `::reference`, or `::references`
  - Script: `::script` or `::scripts`
- Nested layout directives (e.g. `::callout`) inside a section are passed through to the section renderer unchanged.
