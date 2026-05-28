# Comparison: markdown-slides-editor vs the Markdown Presentation Ecosystem

This document compares `markdown-slides-editor` with the most widely-used Markdown-based presentation tools, identifies what each project does well, surfaces potential areas for cross-pollination, and analyses license compatibility and strategic direction.

---

## Tool landscape at a glance

| Tool | Primary model | Requires install | Browser editor | Export formats | Stars (approx.) | License |
|------|--------------|-----------------|----------------|----------------|-----------------|---------|
| [markdown-slides-editor](https://github.com/mgifford/markdown-slides-editor) | Static web app | ❌ | ✅ Full live editor | HTML, PDF, ODP, ZIP | — | AGPLv3 |
| [Marp CLI / core](https://marp.app/) | CLI conversion pipeline | ✅ Node.js / npx | ❌ (VS Code ext adds preview) | HTML, PDF, PPTX, images | ~14k | MIT |
| [Marp.live](https://marp.live/) | Browser live editor for Marp | ❌ | ✅ Editor + preview | (browser-only; exports via clipboard/download) | — | MIT |
| [Slidev](https://sli.dev/) | Dev-server + Vue | ✅ Node.js ≥ 20 | ✅ Browser sidebar | PDF, PNG, PPTX | ~34k | MIT |
| [Reveal.js](https://revealjs.com/) | HTML/JS framework | ❌ (CDN) | ❌ (Slides.com is a paid cloud editor) | HTML, PDF (print) | ~68k | MIT |
| [Remark.js](https://remarkjs.com/) | In-browser runtime | ❌ (single JS file) | ❌ | — (browser only) | ~13k | MIT |
| [Pandoc + Beamer](https://pandoc.org/) | Document converter | ✅ Pandoc + LaTeX | ❌ | PDF (LaTeX), HTML, reveal.js, PPTX | — | GPL / various |
| [MkSlides](https://martenbe.github.io/mkslides/) | CLI (Reveal.js wrapper) | ✅ Python pip | ❌ | HTML | ~0.5k | MIT |

---

## What is markdown-slides-editor?

`markdown-slides-editor` is a **static, browser-based slide authoring system** that runs entirely in the browser on GitHub Pages. It combines an editor, a parser/renderer, an audience runtime, and a presenter view in a single deployable app with no required backend, build step, or CLI dependency.

The project goal is closer to "Google Slides, but with Markdown" than to a Markdown-to-HTML converter.

---

## Marp ecosystem

Marp is a suite of libraries and tools that convert Markdown files into presentation slides. Its major components are:

| Component | Role | License |
|-----------|------|---------|
| [Marpit](https://github.com/marp-team/marpit) | Core framework: Markdown + CSS → static HTML + CSS | MIT |
| [marp-core](https://github.com/marp-team/marp-core) | Extended converter: themes, emoji, math, auto-scaling | MIT |
| [marp-cli](https://github.com/marp-team/marp-cli) | CLI interface: batch convert to HTML, PDF, PPTX, images | MIT |
| [marp-vscode](https://github.com/marp-team/marp-vscode) | VS Code extension: preview and export from the editor | MIT |
| [Marp.live](https://marp.live/) | Browser-based live editor: real-time preview, theme selector, plugin support | MIT |

Marp is primarily a **conversion pipeline**: you author in a text editor and run a CLI (or extension) to produce output. **Marp.live** adds a browser-based WYSIWYG-style editor on top of the same core, with support for the full Marpit/marp-core plugin ecosystem, custom themes, and direct download.

---

## Slidev

[Slidev](https://sli.dev/) (by Anthony Fu) is a **developer-focused presentation tool** built on Vite + Vue 3. You run a local dev server and edit a Markdown file in your preferred editor; the browser reloads instantly. Vue components can be embedded directly in slides.

**Strengths:**
- Rich plugin and npm theme ecosystem; themes are npm packages
- First-class code highlighting (Shiki + Monaco live-coding)
- Built-in KaTeX math, Mermaid diagrams, and icon libraries
- Presenter mode, drawing/annotation, and built-in screen recording
- Export: PDF (via Playwright), PNG, PPTX
- Try-online at [sli.dev/new](https://sli.dev/new) (StackBlitz)

**Limitations:**
- Requires Node.js ≥ 20 installed locally; not a zero-install tool
- No persistent in-browser editor; content lives on the file system
- Vue/Vite knowledge needed for advanced customisation
- Not designed for non-developers

---

## Reveal.js

[Reveal.js](https://revealjs.com/) is the most widely-used open-source HTML presentation framework (~68k stars). It renders slides from HTML markup, with optional Markdown loaded from an external file or inline `<section data-markdown>` elements.

**Strengths:**
- Largest ecosystem: hundreds of plugins, themes, and integrations
- Nested (vertical) slides for structured navigation
- Auto-Animate for smooth element transitions between slides
- LaTeX/KaTeX support, syntax-highlighted code blocks
- Speaker notes with separate presenter window
- PDF export via print stylesheet
- [Slides.com](https://slides.com): commercial cloud editor built on top of Reveal.js

**Limitations:**
- Markdown support is secondary to HTML authoring; deep customisation requires writing HTML
- No built-in in-browser Markdown editor
- Slides.com cloud editor is a paid subscription service
- No built-in accessibility lint or structured presenter notes (`Note:`, `Resources:`, `Script:`)

---

## Remark.js

[Remark.js](https://remarkjs.com/) is the simplest entry in this list: a **single JavaScript file** that turns a `<textarea>` of Markdown into a slideshow inside any HTML page. No build step, no dependencies, no CLI.

**Strengths:**
- Absolute minimum setup: one HTML file, one `<script>` tag
- Presenter mode with speaker notes and cloned display window
- Slide scaling for consistent appearance on any screen
- Syntax highlighting out of the box

**Limitations:**
- No persistent editor, export, or offline capability beyond what the browser provides
- Development is largely dormant; no active release cadence
- Customisation (themes, advanced layout) requires hand-crafted CSS and HTML
- No export beyond browser print/PDF

---

## Pandoc + Beamer

[Pandoc](https://pandoc.org/) is a universal document converter that accepts Markdown (and many other formats) and outputs, among many targets, LaTeX Beamer PDF slides and Reveal.js HTML.

**Strengths:**
- Produces publication-quality PDF via LaTeX Beamer — used widely in academia
- Can also target Reveal.js, Slidy, DZSlides, and PPTX
- Extremely powerful citation, bibliography, and cross-reference support
- Scriptable: part of any document-processing pipeline

**Limitations:**
- Requires Pandoc and a full LaTeX installation; significant dependency footprint
- No browser-based editing or live preview
- Beamer styling is complex; producing visually polished slides requires LaTeX knowledge
- Not appropriate for non-technical authors

---

## Other notable tools

| Tool | Notes |
|------|-------|
| [MkSlides](https://martenbe.github.io/mkslides/) | Python CLI; successor to the dormant `reveal-md`; converts Markdown to Reveal.js HTML | 
| [Deckset](https://www.deckset.com/) | Polished macOS-only paid app; great defaults, limited customisation; no open-source | 
| [Obsidian Advanced Slides](https://github.com/MSzturc/obsidian-advanced-slides) | Reveal.js inside Obsidian; ideal for Obsidian-based knowledge bases | 
| [GitPitch](https://gitpitch.com/) | Was GitHub-hosted Markdown presentations; effectively discontinued for new users |

---

## Detailed feature comparison

The tables below compare `markdown-slides-editor` against the four most directly relevant tools.

### Authoring model

| Capability | markdown-slides-editor | Marp CLI | Marp.live | Slidev | Reveal.js |
|------------|------------------------|----------|-----------|--------|-----------|
| In-browser live editor | ✅ | ❌ | ✅ | ❌ (file system) | ❌ (Slides.com = paid) |
| CLI conversion pipeline | ❌ | ✅ | ❌ | ✅ dev server | ❌ |
| VS Code integration | ❌ | ✅ marp-vscode | ❌ | ✅ Slidev extension | ❌ |
| Docker / CI pipeline | ❌ | ✅ | ❌ | ✅ | ❌ |
| No install required | ✅ | ✅ (npx) | ✅ | ❌ | ✅ (CDN) |
| Works without Node.js | ✅ | ❌ | ✅ | ❌ | ✅ |

### Markdown support

| Capability | markdown-slides-editor | Marp | Slidev | Reveal.js | Remark.js |
|------------|------------------------|------|--------|-----------|-----------|
| Full CommonMark | ❌ Controlled subset | ✅ via markdown-it | ✅ | ✅ | ✅ |
| GFM tables | ❌ | ✅ | ✅ | ✅ | ✅ |
| Strikethrough | ❌ | ✅ | ✅ | ✅ | ✅ |
| Math (KaTeX / MathJax) | ❌ | ✅ | ✅ KaTeX | ✅ KaTeX | ❌ (plugins) |
| Diagrams (Mermaid) | ✅ `::mermaid` | ❌ native (plugins exist) | ✅ | ❌ native (plugins) | ❌ |
| Emoji shortcodes + twemoji | ❌ | ✅ | ✅ | ❌ | ❌ |
| Auto-heading IDs | ❌ | ✅ | ✅ | ✅ | ✅ |
| Arbitrary raw HTML | ❌ (blocked) | ✅ opt-in | ✅ | ✅ | ✅ |
| Inline SVG directives | ✅ `::svg`, `::slide-bg` | ❌ | ✅ (Vue components) | ❌ | ❌ |

### Slide layout and directives

| Capability | markdown-slides-editor | Marp | Slidev | Reveal.js | Remark.js |
|------------|------------------------|------|--------|-----------|-----------|
| `---` slide separator | ✅ | ✅ | ✅ | ✅ | ✅ |
| Front matter (YAML) | ✅ Rich (title, subtitle, date, speakers, QR, etc.) | ✅ Basic (theme, size, math, paginate) | ✅ Rich | ✅ | ❌ |
| Auto-generated title slide | ✅ | ❌ | ❌ | ❌ | ❌ |
| Auto-generated closing slide | ✅ | ❌ | ❌ | ❌ | ❌ |
| `::center` / `::callout` / `::quote` | ✅ | ❌ | ✅ (Vue layouts) | ❌ | ❌ |
| Two-column layouts | ✅ `::column-left/right` | ❌ native | ✅ built-in layout | ❌ native | ❌ |
| `::image-hero` (full-bleed cinematic) | ✅ pan, blur, saturation, timed | ❌ | ❌ | ❌ | ❌ |
| `::slide-bg` SVG background | ✅ | ❌ | ❌ | ❌ | ❌ |
| Image slide backgrounds | ❌ | ✅ Marpit `bg` keyword | ✅ | ✅ data-background | ✅ |
| Auto-fit header to width | ❌ | ✅ `<!--fit-->` | ❌ | ❌ | ❌ |
| Auto-shrink code / math | ❌ | ✅ | ❌ | ❌ | ❌ |
| Progressive disclosure | ✅ `- [>]` | ❌ | ✅ click fragments | ✅ fragments | ❌ |
| Presenter notes | ✅ `Note:` section | ✅ HTML comment | ✅ `---` after slide | ✅ Note: syntax | ✅ `???` |
| `Resources:` / `Script:` sections | ✅ | ❌ | ❌ | ❌ | ❌ |
| Nested / vertical slides | ❌ | ❌ | ❌ | ✅ | ❌ |

### Presentation runtime

| Capability | markdown-slides-editor | Marp | Slidev | Reveal.js | Remark.js |
|------------|------------------------|------|--------|-----------|-----------|
| Audience view | ✅ `/present/` | ✅ exported HTML | ✅ built-in | ✅ | ✅ |
| Presenter view (notes + next-slide) | ✅ `/presenter/` | ✅ CLI server / HTML export | ✅ | ✅ | ✅ |
| Audience ↔ presenter sync | ✅ BroadcastChannel | ❌ | ✅ | ✅ | ✅ `C` key clone |
| Countdown timer + pace indicator | ✅ | ❌ | ✅ | ❌ | ❌ |
| Progressive disclosure (click-to-reveal) | ✅ | ❌ | ✅ | ✅ | ❌ |
| Deep-linkable slide hashes | ✅ `#4`, `#4.1` | ❌ | ✅ | ✅ | ✅ |
| Body text auto-fit | ✅ | ✅ auto-scaling | ❌ | ❌ | ✅ (scale) |
| Inline SVG pixel-perfect scaling | ❌ | ✅ Marpit SVG container | ❌ | ❌ | ✅ |
| Drawing / annotation on slides | ❌ | ❌ | ✅ | ❌ | ❌ |
| Screen recording | ❌ | ❌ | ✅ | ❌ | ❌ |
| Keyboard navigation | ✅ | ✅ | ✅ | ✅ | ✅ |

### Export formats

| Capability | markdown-slides-editor | Marp | Slidev | Reveal.js | Remark.js |
|------------|------------------------|------|--------|-----------|-----------|
| Standalone HTML | ✅ | ✅ | ✅ | ✅ | ✅ |
| PDF | ✅ browser print | ✅ headless Chrome, with notes/bookmarks | ✅ via Playwright | ✅ print stylesheet | ✅ browser print |
| PPTX | ❌ | ✅ (experimental editable) | ✅ | ❌ | ❌ |
| ODP | ✅ | ❌ | ❌ | ❌ | ❌ |
| PNG / JPEG per slide | ❌ | ✅ | ✅ | ❌ | ❌ |
| ZIP bundle (MD + JSON + HTML + ODP) | ✅ | ❌ | ❌ | ❌ | ❌ |
| One-page handout (print-ready) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Offline presenter + audience HTML | ✅ | ❌ | ❌ | ❌ | ❌ |
| Embedded source payload in HTML | ✅ | ❌ | ❌ | ❌ | ❌ |

### Theming and appearance

| Capability | markdown-slides-editor | Marp | Slidev | Reveal.js | Remark.js |
|------------|------------------------|------|--------|-----------|-----------|
| Built-in theme presets | ✅ Multiple | ✅ Default, Gaia, Uncover | ✅ npm theme gallery | ✅ ~10 themes | ❌ CSS only |
| Custom themes via CSS | ✅ URL-based override | ✅ `@theme` CSS metadata | ✅ npm packages | ✅ | ✅ |
| Light / dark mode | ✅ system + manual | ❌ | ✅ | ✅ (some themes) | ❌ |
| Reduced-motion support | ✅ | ❌ | ❌ | ❌ | ❌ |

### Accessibility

| Capability | markdown-slides-editor | Marp | Slidev | Reveal.js | Remark.js |
|------------|------------------------|------|--------|-----------|-----------|
| In-editor a11y lint (headings, links, alt text, density) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Semantic HTML output | ✅ (intentional constraint) | ✅ | ✅ | ✅ | ✅ |
| Keyboard navigation | ✅ | ✅ | ✅ | ✅ | ✅ |
| Visible focus states | ✅ | ❌ | ✅ | ✅ | ❌ |
| Accessibility documentation | ✅ `ACCESSIBILITY.md` | ❌ | ❌ | ❌ | ❌ |
| Repo-level a11y review skills / automation | ✅ | ❌ | ❌ | ❌ | ❌ |

### Local-first and offline

| Capability | markdown-slides-editor | Marp | Slidev | Reveal.js | Remark.js |
|------------|------------------------|------|--------|-----------|-----------|
| Browser-local deck persistence (IndexedDB) | ✅ | ❌ | ❌ (file system) | ❌ | ❌ |
| Service worker / offline after first load | ✅ | ❌ | ❌ | ❌ | ❌ |
| No required account or login | ✅ | ✅ | ✅ | ✅ | ✅ |
| No required build step | ✅ | ❌ | ❌ | ✅ (CDN) | ✅ |

### AI and captions

| Capability | markdown-slides-editor | Marp | Slidev | Reveal.js | Remark.js |
|------------|------------------------|------|--------|-----------|-----------|
| In-editor AI prompt generator | ✅ | ❌ | ❌ | ❌ | ❌ |
| Optional live captions (whisper.cpp / transcript) | ✅ | ❌ | ❌ | ❌ | ❌ |
| In-browser LLM | ❌ (planned) | ❌ | ❌ | ❌ | ❌ |

---

## What We Could Contribute to the Ecosystem

The following capabilities from this project are absent from the broader ecosystem and could potentially be contributed upstream or offered as plugins/integrations:

1. **Accessibility lint layer** — The in-editor checks for skipped headings, missing alt text, generic link text, and slide density are original to this project. This could be contributed as a Marpit plugin (`marp-a11y`), a Slidev add-on, or a standalone `remark-a11y-slides` package that works across tools.

2. **Structured presenter notes (`Resources:`, `Script:`)** — The structured section types extend presenter notes beyond the single-level `Note:` / `???` pattern present in all compared tools. These could be proposed as an optional Marpit or marp-core feature, or published as a standalone `remark-presenter-sections` plugin.

3. **Progressive disclosure syntax (`- [>]`)** — Click-to-reveal list items are a common presentation pattern not native to Marp or Remark.js. Reveal.js and Slidev have fragment support but require per-item markup; a cleaner `- [>]` syntax could be contributed as a Marpit Markdown extension or a Remark plugin.

4. **Auto-generated title and closing slides from front matter** — All compared tools leave title and closing slide content to the author. A front matter → generated slide system could be proposed to marp-core or implemented as a plugin.

5. **ODP export** — No other open-source tool in this list generates OpenDocument Presentation output alongside HTML. Contributing an ODP path to Marp CLI or Slidev would complement their existing PPTX export.

6. **Offline self-contained presenter HTML** — A single-file offline HTML that bundles a synchronized presenter view and audience view would be a useful addition to Marp CLI, Slidev, or Reveal.js export targets.

7. **`::image-hero` cinematic treatment** — The timed pan/blur/saturation hero directive is a distinctive visual pattern that could be published as a reusable Marpit plugin or a Slidev layout component.

---

## What We Could Import From the Ecosystem

The following capabilities from other tools would strengthen this project:

### From Marp

1. **Math typesetting (MathJax / KaTeX)** — Marp's `math` global directive and marp-core's math rendering pipeline could be adapted for the in-browser renderer.

2. **GFM tables and strikethrough** — Revisiting the controlled Markdown subset to adopt GFM-compatible extensions would expand authoring expressiveness.

3. **Emoji shortcode support (twemoji)** — Converting shortcodes and Unicode emoji to twemoji SVGs would improve cross-platform visual consistency.

4. **`# <!--fit-->` fitting header** — Marp's auto-scaling heading is a useful authoring escape hatch; a compatible version could be added to the directive system.

5. **Inline SVG slide container (Marpit architecture)** — Wrapping each slide in an `<svg>` element with `<foreignObject>` enables pixel-perfect CSS scaling without JavaScript layout calculations.

6. **Advanced image backgrounds** — Marpit's `bg` image keyword supports sizing and position modifiers inline in Markdown. A simplified version could complement `::image-hero`.

7. **PDF with note annotations and bookmarks** — Marp CLI's `--pdf-notes` and `--pdf-outlines` flags produce PDFs that match professional output expectations.

### From Slidev

1. **npm theme ecosystem model** — Slidev themes are regular npm packages with a defined metadata contract. Adopting this model would let theme authors publish and maintain themes independently.

2. **Drawing / annotation** — The ability to draw on slides during a live presentation (via Drauu) is a useful presenter tool.

3. **Built-in screen recording** — Slidev's integrated recording with camera overlay supports recording presentations without a separate tool.

4. **Monaco live-coding** — The Monaco editor integration in Slidev lets code blocks be edited live during a presentation; useful for developer-facing talks.

### From Reveal.js

1. **Nested / vertical slides** — Reveal.js's two-dimensional navigation (horizontal chapters, vertical sub-slides) is a structural model worth evaluating for long presentations with sub-sections.

2. **Auto-Animate** — Smooth element transitions between slides are achievable in Reveal.js by matching element IDs across adjacent slides; a browser-based equivalent would enrich the runtime.

3. **Plugin API** — Reveal.js has the most mature plugin registration API of any tool in this list; modelling a plugin API on it would make markdown-slides-editor extensible without requiring core changes.

---

## License analysis

### Current licenses

| Project | License |
|---------|---------|
| markdown-slides-editor | **AGPLv3** |
| Marp (all components) | MIT |
| Slidev | MIT |
| Reveal.js | MIT |
| Remark.js | MIT |
| Pandoc | GPL v2+ |
| MkSlides | MIT |

### Incorporating other tools' code

All of the above MIT-licensed projects can be incorporated as dependencies or adapted into an AGPLv3 project. MIT grants broad permission including commercial and network use without requiring reciprocal sharing.

### Contributing this project's code upstream

Code from an AGPLv3 project **cannot be copied into an MIT project** without either the original author relicensing that contribution as MIT, or the receiving project accepting the AGPLv3 code under a compatible licence. In practice:

- Contributing ideas, patterns, and algorithms without copying verbatim code is always possible.
- Contributing code verbatim from this project requires explicit dual-licensing or a CLA permitting MIT relicensing.

### License options

| Option | Pros | Cons |
|--------|------|------|
| **Stay with AGPLv3** | Strong copyleft protects the hosted web app; maximises community contribution reciprocity | Blocks direct code contributions to MIT projects; may discourage institutional forks |
| **Switch to MIT** | Maximum reuse freedom; direct code sharing with the entire ecosystem; lower barrier for forks | Removes the network-service sharing requirement |
| **Switch to Apache 2.0** | Adds explicit patent grant; still permissive and compatible with all compared tools | Same SaaS copyleft gap as MIT |
| **Dual licence (AGPLv3 + commercial)** | Keeps copyleft default; allows commercial exceptions | Adds complexity; requires contributor CLAs |
| **MPL 2.0** | File-level copyleft; widely adopted; compatible with MIT dependencies | Less familiar; Marp still cannot copy-paste MPL code into MIT files without a licence note |

**Recommendation:** If the primary goal is enabling upstream contributions and broad institutional reuse, switching to **MIT or Apache 2.0** removes the most friction. If the goal is ensuring hosted deployments remain open, **AGPLv3** is the right choice.

---

## Strategic direction

The problem statement raises an honest question: *is it better to extend this project or find an open-source community with more features to build on?*

### Strengths of continuing independently

- The browser-first, no-install model is genuinely distinct from every tool in this list.
- The accessibility-first posture (in-editor lint, structured notes, a11y docs) is not replicated anywhere.
- The local-first offline architecture (IndexedDB + service worker + BroadcastChannel sync) is unique.
- The audience + presenter sync workflow without a server is unique.

### Arguments for building on an existing community

- **Slidev** has the most active developer ecosystem (~34k stars, regular releases, Discord, docs in six languages). Vue/Vite expertise translates to the whole frontend ecosystem. Its npm theme/plugin model enables a sustainable extension community. The main gap is: it is not a zero-install browser app, and it is not designed for non-developers.
- **Reveal.js** has the largest reach (~68k stars) and the most plugins. Slides.com shows there is commercial interest in a hosted editor on top of it. The plugin API is the most mature.
- **Marp.live** is the closest to this project's UX model (browser editor, no install), but is a thin wrapper around Marp's CLI pipeline and does not attempt to be a full authoring environment.

### A pragmatic path forward

1. **Keep the browser-based editor** as the primary differentiator. None of the compared tools provides a comparable zero-install editing experience.
2. **Adopt MIT or compatible library dependencies** from Marp, Slidev, and Reveal.js to close capability gaps (math, tables, emoji) without rewriting them.
3. **Publish accessibility tooling as standalone packages** (`remark-a11y-slides`, `marp-a11y`) to contribute back to the ecosystem and build reputation.
4. **Consider Reveal.js or Slidev as the rendering target** for exported HTML, replacing the custom renderer. This would give users access to all Reveal.js/Slidev runtime features (fragments, auto-animate, plugins) while the editor remains the differentiating layer.
5. **Engage with the Marp and Slidev communities** — both are MIT-licensed, both have documented plugin APIs, and both have active maintainers who are open to third-party contributions.

---

## Summary

| Dimension | markdown-slides-editor | Marp | Slidev | Reveal.js | Remark.js |
|-----------|------------------------|------|--------|-----------|-----------|
| Authoring experience | In-browser editor, live preview, local persistence | CLI batch, VS Code integration | Dev server, VS Code, Vue components | HTML-first, cloud editor (paid) | Minimal, file-based |
| Accessibility | Built-in lint, visible focus, a11y docs | Not a focus | Not a focus | Not a focus | Not a focus |
| Presenter workflow | Synced presenter+audience, timer, captions | Notes in PDF, CLI server | Presenter mode, drawing, recording | Presenter view, speaker notes | Clone window |
| Export flexibility | ZIP bundle, ODP, offline HTML, handout | PDF (notes/bookmarks), PPTX, images | PDF, PNG, PPTX | HTML, PDF print | Browser print |
| Markdown richness | Layout directives, auto-generated slides | Full CommonMark, math, emoji, GFM | CommonMark + math + Mermaid + Vue | CommonMark via plugin | CommonMark |
| CI/CD integration | ❌ | ✅ CLI + Docker | ✅ CLI | ❌ | ❌ |
| Plugin ecosystem | ❌ | ✅ Marpit plugins | ✅ npm packages | ✅ largest ecosystem | ❌ |
| Theming system | External CSS, light/dark | Pure CSS `@theme` | npm packages | ~10 built-in themes | Custom CSS |
| Offline / local-first | Service worker, IndexedDB | File system + CLI | File system + CLI | ✅ CDN no install | ✅ single JS file |
| License | AGPLv3 | MIT | MIT | MIT | MIT |
| Zero install | ✅ | ❌ (npx) | ❌ | ✅ (CDN) | ✅ |
| Community size | Small / early | Medium | Large (34k ⭐) | Very large (68k ⭐) | Medium (13k ⭐) |
