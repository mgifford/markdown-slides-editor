# LaTeX Math Formulas

This project renders mathematical notation written in LaTeX. You can paste
expressions straight from an existing LaTeX document, and in most cases they
render without any rewriting.

Math is typeset by [MathJax 4](https://www.mathjax.org/). MathJax is loaded only
for decks that actually contain math, and only when a slide with math is shown,
so decks without math carry no extra cost. Each expression keeps its LaTeX source
and is announced to screen readers via assistive MathML; if MathJax cannot load,
the readable LaTeX source is shown instead of a broken equation.

Every example below is ready to copy and paste into the editor.

## Quick start

Copy this into a slide to see inline and display math together:

```md
# Math test

Inline math sits in the sentence, like \( E = mc^2 \).

Display math gets its own centered line:

\[
\int_0^1 x^2 \, dx = \frac{1}{3}
\]
```

## Delimiters

Four delimiter styles are supported. The native LaTeX forms `\( \)` and `\[ \]`
are first-class — they are the most reliable when pasting from a paper, because a
dollar sign is never ambiguous.

| Purpose | Delimiter | Example |
|---------|-----------|---------|
| Inline (native) | `\( ... \)` | `\( a^2 + b^2 = c^2 \)` |
| Display (native) | `\[ ... \]` | see below |
| Display (Markdown) | `$$ ... $$` | see below |
| Inline (dollar) | `$ ... $` | `$a^2 + b^2 = c^2$` |

### Inline math

```md
The Pythagorean theorem states \( a^2 + b^2 = c^2 \) for a right triangle.
```

### Display math (native)

```md
\[
e^{i\pi} + 1 = 0
\]
```

### Display math (Markdown convention)

```md
$$
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}
$$
```

## Single dollars and the currency caveat

Single dollars work for inline math, but `$` is also a currency sign, so
single-dollar math is **guarded** to avoid turning prices into equations:

- A `$` immediately followed by a space or a digit is treated as currency.
- To write a literal dollar next to math-like text, escape it: `\$5`.
- Math that genuinely starts with a digit should use `\( ... \)`.

Copy this to see the guard in action — the prices stay literal, the formula does not:

```md
The budget grew from $50 to $100 this quarter.

The growth rate is $r = \frac{p_1 - p_0}{p_0}$.
```

When in doubt, prefer `\( ... \)` and `\[ ... \]`: they are never ambiguous.

## Formula examples to copy

### Fractions and roots

```md
\[
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
\]
```

### Subscripts and superscripts

```md
Indices such as \( a_{i,j} \) and powers such as \( x^{2n} \) render as expected.
```

### Greek letters and operators

```md
\[
\alpha + \beta = \gamma \qquad \nabla \cdot \vec{E} = \frac{\rho}{\varepsilon_0}
\]
```

### Sums, integrals, and limits

```md
\[
\lim_{x \to 0} \frac{\sin x}{x} = 1
\qquad
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
\]
```

### Matrices

```md
\[
\begin{bmatrix}
a & b \\
c & d
\end{bmatrix}
\begin{bmatrix} x \\ y \end{bmatrix}
=
\begin{bmatrix} ax + by \\ cx + dy \end{bmatrix}
\]
```

### Aligned equations

```md
\[
\begin{aligned}
(a + b)^2 &= a^2 + 2ab + b^2 \\
(a - b)^2 &= a^2 - 2ab + b^2
\end{aligned}
\]
```

### Quantum notation (asterisks stay intact)

Characters that mean something in both LaTeX and Markdown — `*`, `_`, `#`, `\`,
braces, brackets, ampersands — are protected inside math, so this renders as a
formula rather than being read as Markdown emphasis:

```md
\[
\langle \psi^*(x) \, | \, \psi(x) \rangle = 1
\]
```

## Highlighting part of an equation

Sometimes you want to draw attention to one element of an equation, or step
through a derivation with a specific term called out. Two approaches are
supported.

### Semantic emphasis (recommended)

Wrap a part of the equation in `\class{math-emph}{...}` to call it out. This is
the recommended way, because the emphasis is **never conveyed by colour alone**:
the highlighted part is shown in the theme accent colour **and** in bold **and**
underlined, so the call-out survives greyscale printing, colour blindness, and
Windows High Contrast.

```md
\[
E = \class{math-emph}{m} c^2
\]
```

When stepping through an equation you can use a second, visually distinct
call-out (`math-emph-2`, a dotted underline) and fade surrounding context with
`math-muted` (dimmed and italic):

```md
\[
F = \class{math-muted}{m}\,\class{math-emph}{a}
\]
```

| Class | Purpose | Visual cues (not colour alone) |
|-------|---------|--------------------------------|
| `math-emph` | Primary call-out | accent colour + bold + solid underline |
| `math-emph-2` | Second, distinct call-out | accent + bold + dotted underline |
| `math-muted` | Fade context | dimmed + italic |

A note on screen readers: the highlight is a **visual** aid. The equation's
spoken and Braille output (from MathJax) reads the full expression in order, so
no one misses a term — but the *fact that a part is highlighted* is not spoken.
If a specific term is important to your point, say so in your narration or
speaker notes as well; do not rely on the highlight alone to carry meaning.

### Raw colour

You can also use LaTeX's `\color` directly for a one-off colour:

```md
\[
E = \color{teal}{m} c^2
\]
```

Prefer `\class{math-emph}{...}` over raw `\color`: a bare colour carries meaning
by colour alone, which fails for many readers and in high-contrast modes.

## Showing LaTeX as source (not as a formula)

To document math syntax without rendering it, use code — inline code or a fenced
code block keeps the LaTeX visible as source:

````md
Use `\( E = mc^2 \)` to write inline math.

```latex
\[
E = mc^2
\]
```
````

## Accessibility

Mathematics is rendered as **structured, explorable math** — never flattened to
an image or an opaque object.

### Screen readers

MathJax 4 attaches assistive MathML with generated speech and (where the
assistive technology supports it) Braille. Screen readers announce the
mathematics — "E equals m c squared" — rather than reading the raw LaTeX. The
editor does not add its own competing label once MathJax has rendered, so the
mathematical semantics are what reach the user. Before rendering (and if
rendering fails) the LaTeX source is used as the accessible name so nothing is
ever silent.

### Keyboard exploration

A rendered equation is focusable. With it focused you can use MathJax's
interactive explorer to step through sub-expressions with the arrow keys, and
Escape leaves the explorer. Focus is shown with a visible outline.

In **presentation and presenter modes**, the slide-navigation keys (arrows,
space, Page Up/Down, Home/End) are handed to MathJax while an equation is
focused, so exploring an equation does not also change slides. Move focus off the
equation (Tab, or Escape then Tab) to return those keys to slide navigation.

### Zoom, reflow, and long equations

Math scales with browser zoom and larger default text sizes. Wide display
equations reflow onto multiple lines where the mathematics allows; when an
equation still cannot fit, its container scrolls horizontally rather than
clipping, and that scroll container is keyboard-focusable and labelled so a
keyboard user can reach the whole equation. The page itself never scrolls
sideways.

### Colour and contrast

Math inherits the current text colour, so it adapts to the default, light, dark,
high-contrast, and author-override themes without hard-coded colours. Emphasis
classes pair colour with non-colour cues (see above) and map to system colours
under Windows High Contrast / forced-colors.

### Failure state

If MathJax cannot load, the readable LaTeX source is shown in place of the
equation, with a note that mathematical rendering is unavailable, so the meaning
is never lost.

## Related

- [AUTHORING.md](../AUTHORING.md) — the "Mathematics (LaTeX)" section
- [ACCESSIBILITY.md](../ACCESSIBILITY.md) — the "Mathematics" section
- [Layout Syntax](layout-syntax.md) — other slide-layout directives
