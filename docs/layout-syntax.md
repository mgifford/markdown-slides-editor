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

## Quotes

Use `::quote` for a pull quote or emphasized quotation.

```md
::quote
Accessibility is a quality issue, not a feature request.
::
```

## Accessibility guidance

- Always include meaningful alt text for images.
- Keep columns readable and balanced.
- Do not overload columns with dense text.
- Make sure centered or callout text remains meaningful out of context.
- Use media layouts to support understanding, not just decoration.
- If a layout starts to feel crowded, split it into more slides.

## HTML

Markdown is still the base format.

Raw HTML is not the primary layout mechanism in the current editor. The preferred approach is to use these layout directives so the output remains easier to style, test, and keep accessible.
