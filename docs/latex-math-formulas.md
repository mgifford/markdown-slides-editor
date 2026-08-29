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

## Accessibility notes

- Every expression is given an `aria-label` from its LaTeX source, and MathJax
  attaches assistive MathML so screen readers announce the mathematics rather
  than the raw source.
- Math inherits the current text colour, so it adapts to light and dark modes.
- Wide display math scrolls horizontally within its own container so it never
  forces the slide to overflow.
- If MathJax cannot load, the LaTeX source is shown with a note that rendering is
  unavailable, so the meaning is never lost.

## Related

- [AUTHORING.md](../AUTHORING.md) — the "Mathematics (LaTeX)" section
- [ACCESSIBILITY.md](../ACCESSIBILITY.md) — the "Mathematics" section
- [Layout Syntax](layout-syntax.md) — other slide-layout directives
