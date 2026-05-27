# Comparison: markdown-slides-editor vs Marp

This document compares `markdown-slides-editor` with the [Marp ecosystem](https://marp.app/), examines what each project does well, identifies potential areas for cross-pollination, and analyses license compatibility.

---

## What is Marp?

Marp is a suite of libraries and tools that convert Markdown files into presentation slides. Its major components are:

| Component | Role | License |
|-----------|------|---------|
| [Marpit](https://github.com/marp-team/marpit) | Core framework: Markdown+CSS → static HTML+CSS | MIT |
| [marp-core](https://github.com/marp-team/marp-core) | Extended converter: themes, emoji, math, auto-scaling | MIT |
| [marp-cli](https://github.com/marp-team/marp-cli) | CLI interface: batch convert to HTML, PDF, PPTX, images | MIT |
| [marp-vscode](https://github.com/marp-team/marp-vscode) | VS Code extension: preview and export from the editor | MIT |

Marp is primarily a **conversion pipeline**: you author in a text editor and run a CLI (or extension) to produce output. There is no bundled browser-based authoring environment.

---

## What is markdown-slides-editor?

`markdown-slides-editor` is a **static, browser-based slide authoring system** that runs entirely in the browser on GitHub Pages. It combines an editor, a parser/renderer, an audience runtime, and a presenter view in a single deployable app with no required backend, build step, or CLI dependency.

The project goal is closer to "Google Slides, but with Markdown" than to a Markdown-to-HTML converter.

---

## Feature Comparison

### Authoring model

| Capability | markdown-slides-editor | Marp |
|------------|------------------------|------|
| In-browser WYSIWYG-style editor | ✅ Full editor with live preview | ❌ No bundled editor (VS Code extension adds preview) |
| CLI conversion pipeline | ❌ | ✅ marp-cli: HTML, PDF, PPTX, images, watch mode |
| VS Code integration | ❌ | ✅ marp-vscode: preview, export, snippets |
| Docker / CI pipeline support | ❌ | ✅ Official Docker image |
| No install required | ✅ Static web app, open in browser | ✅ npx one-shot usage |
| Works without Node.js | ✅ | ❌ (npx, Homebrew, or binary needed) |

### Markdown support

| Capability | markdown-slides-editor | Marp |
|------------|------------------------|------|
| Headings, paragraphs, lists, links, images, blockquotes | ✅ | ✅ |
| Full CommonMark | ❌ Controlled subset | ✅ via markdown-it |
| GFM tables | ❌ | ✅ |
| Strikethrough | ❌ | ✅ |
| Line-break → `<br>` | ❌ | ✅ |
| Math typesetting (MathJax / KaTeX) | ❌ | ✅ |
| Emoji shortcodes + twemoji SVG | ❌ | ✅ |
| Auto-generated heading IDs (slugs) | ❌ | ✅ |
| Arbitrary raw HTML | ❌ (intentionally blocked) | ✅ opt-in |

### Slide layout and directives

| Capability | markdown-slides-editor | Marp |
|------------|------------------------|------|
| `---` slide separator | ✅ | ✅ |
| Front matter (YAML) | ✅ Extended (title, subtitle, date, speakers, QR, etc.) | ✅ Basic (theme, size, math, paginate, etc.) |
| Auto-generated title slide from front matter | ✅ | ❌ |
| Auto-generated closing slide from front matter | ✅ | ❌ |
| `::center` / `::callout` / `::quote` directives | ✅ | ❌ |
| `::column-left` / `::column-right` (width-qualified) | ✅ | ❌ native (requires custom CSS) |
| `::media-left` / `::media-right` | ✅ | ❌ |
| `::image-hero` (full-bleed cinematic reveal) | ✅ (with pan, blur, saturation, timed transitions) | ❌ |
| `::slide-bg` (inline SVG background layer) | ✅ | ❌ |
| `::mermaid` / `::svg` directives | ✅ | ❌ native (Mermaid requires plugins) |
| Slide image backgrounds (`bg` keyword in image syntax) | ❌ | ✅ Marpit advanced backgrounds |
| `# <!--fit-->` fitting header (auto-scale to width) | ❌ | ✅ |
| Auto-shrink code blocks / KaTeX blocks | ❌ | ✅ |
| `size` directive (4:3 / 16:9 presets) | ✅ via `slideWidth`/`slideHeight` front matter | ✅ via theme-defined presets |
| Progressive disclosure (`- [>]` items) | ✅ | ❌ |
| Presenter notes | ✅ `Note:` section | ✅ HTML comment syntax |
| Resources / references section | ✅ `Resources:` section | ❌ |
| Script section (full delivery text) | ✅ `Script:` section | ❌ |

### Presentation runtime

| Capability | markdown-slides-editor | Marp |
|------------|------------------------|------|
| Audience view (clean presentation surface) | ✅ `/present/` | ✅ via exported HTML |
| Presenter view (notes, timer, next-slide preview) | ✅ `/presenter/` | ✅ via `--preview` in Marp CLI / HTML export |
| Audience↔presenter synchronization | ✅ Same-origin BroadcastChannel | ❌ |
| Countdown timer with pace indicator | ✅ | ❌ |
| Progressive disclosure (click-to-reveal lists) | ✅ | ❌ |
| Deep-linkable slide hashes (`#4`, `#4.1`) | ✅ | ❌ |
| Body text auto-fit | ✅ | ✅ auto-scaling |
| Inline SVG pixel-perfect scaling | ❌ | ✅ Marpit inline SVG |
| Keyboard navigation | ✅ | ✅ |

### Export formats

| Capability | markdown-slides-editor | Marp |
|------------|------------------------|------|
| Standalone HTML | ✅ | ✅ |
| PDF | ✅ via browser print | ✅ Headless Chrome, with note annotations and bookmarks |
| PPTX | ❌ | ✅ (including experimental editable PPTX) |
| ODP (OpenDocument Presentation) | ✅ | ❌ |
| PNG / JPEG per slide | ❌ | ✅ |
| ZIP bundle (MD + JSON + HTML + ODP + one-page) | ✅ | ❌ |
| One-page handout (print/PDF-ready, 1-up or 4-up) | ✅ | ❌ |
| Offline presenter+audience HTML (self-contained) | ✅ | ❌ |
| Embedded source payload in HTML export | ✅ | ❌ |

### Theming and appearance

| Capability | markdown-slides-editor | Marp |
|------------|------------------------|------|
| Built-in theme presets | ✅ Multiple | ✅ Default, Gaia, Uncover |
| External CSS override / custom themes | ✅ URL-based override | ✅ Full custom CSS via `@theme` |
| Pure CSS theme authoring (no predefined classes) | ❌ (app CSS is opinionated) | ✅ Marpit theme system |
| Accessible light/dark mode | ✅ System preference + manual override | ❌ |
| Reduced-motion support | ✅ | ❌ |

### Accessibility

| Capability | markdown-slides-editor | Marp |
|------------|------------------------|------|
| In-editor accessibility lint (headings, links, alt text, density) | ✅ | ❌ |
| Missing-alt-text errors | ✅ | ❌ |
| Skipped heading detection | ✅ | ❌ |
| Generic link warnings | ✅ | ❌ |
| Density / overflow warnings | ✅ | ❌ |
| Semantic HTML output | ✅ (intentional constraint) | ✅ |
| Keyboard navigation | ✅ | ✅ |
| Visible focus states | ✅ | ❌ |
| Accessibility documentation | ✅ `ACCESSIBILITY.md`, checklist, manual testing guide | ❌ |
| Repo-local accessibility review skills | ✅ (a11y-planner, a11y-critic, a11y-test, etc.) | ❌ |

### Local-first and offline

| Capability | markdown-slides-editor | Marp |
|------------|------------------------|------|
| Browser-local deck persistence (IndexedDB) | ✅ | ❌ (file system via CLI) |
| Service worker / offline editing after first load | ✅ | ❌ |
| No required account or login | ✅ | ✅ |
| No required build step | ✅ | ❌ (npx/npm needed) |
| No required cloud account | ✅ | ✅ |

### AI and captions

| Capability | markdown-slides-editor | Marp |
|------------|------------------------|------|
| In-editor AI prompt generator | ✅ | ❌ |
| Optional live captions (whisper.cpp / transcript service) | ✅ | ❌ |
| In-browser LLM | ❌ (planned) | ❌ |

---

## What We Could Contribute to the Marp Ecosystem

The following capabilities from this project are absent from Marp and could potentially be contributed upstream or offered as Marp plugins/integrations:

1. **Accessibility lint layer** — The in-editor checks for skipped headings, missing alt text, generic link text, and slide density are original to this project and would make Marp's CLI (`marp-cli`) and VS Code extension more useful for authoring accessible presentations. This could be contributed as a Marpit plugin or a standalone `marp-a11y` package.

2. **Presenter notes sections (`Resources:`, `Script:`)** — The structured `Resources:` and `Script:` sections extend presenter notes beyond the single-level `Note:` pattern. These section types could be proposed as an optional Marpit or marp-core feature.

3. **Progressive disclosure syntax (`- [>]`)** — Click-to-reveal list items are a common presentation pattern. This could be contributed as a Marpit Markdown extension.

4. **Auto-generated title and closing slides from front matter** — Marp leaves title and closing slide content entirely to the author. A front matter → generated slide system could be proposed to marp-core or implemented as a plugin.

5. **ODP export** — This project generates OpenDocument Presentation output for handoff. Marp CLI supports PPTX but not ODP. Contributing an ODP conversion path would complement the existing formats.

6. **Offline self-contained presenter HTML** — A single-file offline HTML that bundles a synchronized presenter view and audience view would be a useful Marp CLI output target.

7. **`::image-hero` cinematic treatment** — The timed pan/blur/saturation hero directive is a distinctive visual pattern that could be published as a reusable Marpit plugin or marp-core theme extension.

---

## What We Could Import From Marp

The following Marp capabilities would strengthen this project:

1. **Math typesetting (MathJax / KaTeX)** — Currently absent from this project. Marp's `math` global directive and marp-core's math rendering pipeline could be adapted for the in-browser renderer. This is especially useful for technical and scientific presentations.

2. **GFM tables and strikethrough** — The controlled Markdown subset in this project intentionally excludes tables and strikethrough. Revisiting this constraint and adopting Marp's GFM-compatible extensions would expand authoring expressiveness without requiring arbitrary HTML.

3. **Emoji shortcode support (twemoji)** — Marp converts emoji shortcodes and Unicode emoji to inline twemoji SVGs for consistent cross-platform rendering. This would improve visual fidelity in exported HTML.

4. **`# <!--fit-->` fitting header** — Marp's auto-scaling heading (resize heading text to fill slide width) is a useful authoring escape hatch for titles and section dividers. The approach is clean and compatible with standard Markdown renderers.

5. **Inline SVG slide container** — Marpit wraps each slide in an `<svg>` element with a `<foreignObject>` layer, enabling pixel-perfect CSS scaling and advanced background isolation without JavaScript layout calculations. This is an architectural improvement worth evaluating as an alternative to the current `slide-layout.js` body-text-fitting approach.

6. **Theme CSS metadata system** — Marpit's `@theme`, `@size`, and `@auto-scaling` CSS metadata approach lets theme authors define size presets and opt-in to auto-scaling per element type. The current project's theming model could benefit from a more structured theme contract.

7. **Advanced image backgrounds** — Marpit's `bg` image keyword supports sizing (cover, contain, fit, auto) and position modifiers inline in Markdown image syntax. This is a simpler author-facing pattern than the current `::image-hero` directive for many background image use cases.

8. **PDF with note annotations and bookmarks** — Marp CLI uses headless Chrome to produce PDF with `--pdf-notes` (notes in margin) and `--pdf-outlines` (PDF bookmarks). The current print-to-PDF workflow has no equivalent. This could be added as an optional node-based CLI export companion.

---

## License Analysis

### Current licenses

| Project | License |
|---------|---------|
| markdown-slides-editor | **AGPLv3** (GNU Affero General Public License v3) |
| Marpit | MIT |
| marp-core | MIT |
| marp-cli | MIT |
| marp-vscode | MIT |

### Compatibility of using Marp code in this project

MIT-licensed code **can be incorporated** into an AGPLv3 project. MIT grants broad permission including commercial and network use without requiring reciprocal sharing. Including Marp's MIT libraries as dependencies is straightforward and compatible.

### Compatibility of contributing this project's code upstream to Marp

This is the harder direction. Marp's repos are MIT-licensed. Code from an AGPLv3 project **cannot be copied into an MIT project** without either:
- the original AGPLv3 author relicensing the specific contribution as MIT (or a compatible permissive license), or
- the Marp project accepting a license change for the affected files.

In practice, this means:
- Contributing ideas, patterns, and algorithms (without copying code verbatim) is always possible.
- Contributing code verbatim from this project to Marp would require explicit dual-licensing or a CLA that permits MIT relicensing of contributions.

### The AGPLv3 choice and its implications

AGPLv3 closes the "SaaS loophole" of GPL: any entity running the software over a network must share their modifications. This is intentional for a project that is a hosted web application. However it creates friction for:
- Other teams who want to fork and use portions privately as an internal tool.
- Potential library users who want to import parsing or accessibility logic into their MIT-licensed toolchain.
- Marp upstream accepting direct code contributions from this repo.

### Would switching licenses help?

| Option | Pros | Cons |
|--------|------|------|
| **Stay with AGPLv3** | Strong copyleft protects the hosted web app; aligns with open-source ecosystem values; maximizes community contribution reciprocity. | Blocks direct code contributions to MIT projects like Marp without relicensing; may discourage some institutional adopters. |
| **Switch to MIT** | Maximum reuse freedom; direct code sharing with Marp becomes straightforward; lower barrier for CivicActions, W3C, or others to fork. | Removes the network-service sharing requirement; a hosting company could run a proprietary fork without contributing back. |
| **Switch to Apache 2.0** | Adds explicit patent grant over MIT; still permissive and compatible with Marp; still allows Marp contributions. | Same as MIT regarding the SaaS copyleft gap. |
| **Dual license (AGPLv3 + commercial)** | Keeps copyleft default; allows commercial exceptions by agreement. | Adds licensing complexity; requires contributor CLAs to make dual-licensing viable. |
| **MPL 2.0 (Mozilla Public License)** | File-level copyleft (weaker than AGPL); widely adopted; compatible with MIT when used as a dependency. | Less familiar than MIT/Apache; Marp still cannot copy-paste MPL code directly into MIT files without a license note. |

**Recommendation:** If the primary goal is enabling Marp upstream contributions and broad institutional reuse, switching to **MIT or Apache 2.0** removes the most friction. If the goal is ensuring that hosted deployments (for example, a SaaS wrapper around this editor) remain open, **AGPLv3 is the right choice** and should be kept. A pragmatic middle path is to license the core parsing/rendering modules (parser, markdown, a11y) under MIT while keeping the application shell (editor-view, presenter-view, export) under AGPLv3 — though this introduces file-level complexity that requires careful management.

---

## Summary

| Dimension | markdown-slides-editor strength | Marp strength |
|-----------|--------------------------------|---------------|
| Authoring experience | In-browser editor, live preview, local persistence | CLI batch conversion, VS Code integration |
| Accessibility | Built-in lint, visible focus, a11y docs | Not a focus |
| Presenter workflow | Synced presenter+audience, timer, captions | Notes in PDF output, CLI server mode |
| Export flexibility | ZIP bundle, ODP, offline HTML, one-page handout | PDF (with notes/bookmarks), PPTX, per-slide images |
| Markdown richness | Layout directives, auto-generated slides | Full CommonMark, math, emoji, GFM tables |
| CI/CD integration | ❌ | ✅ CLI + Docker |
| Theming system | External CSS override, light/dark mode | Pure CSS, no predefined classes, multiple themes |
| Offline / local-first | Service worker, IndexedDB | File system + CLI |
| License | AGPLv3 (copyleft, network-sharing required) | MIT (permissive) |
