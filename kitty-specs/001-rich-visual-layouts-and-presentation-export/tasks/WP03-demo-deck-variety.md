---
work_package_id: WP03
title: Demo Deck Visual Variety
lane: planned
dependencies: []
subtasks:
- T013
- T014
- T015
- T016
- T017
phase: Phase 2 - Content and Polish
assignee: ''
agent: ''
shell_pid: ''
review_status: ''
reviewed_by: ''
history:
- timestamp: '2026-05-24T18:00:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
---

# Work Package Prompt: WP03 – Demo Deck Visual Variety

## ⚠️ IMPORTANT: Review Feedback Status

**Read this first if you are implementing this task!**

- **Has review feedback?**: Check the `review_status` field above. If it says `has_feedback`, scroll to the **Review Feedback** section immediately.

---

## Review Feedback

*[This section is empty initially.]*

---

## Objectives & Success Criteria

Rewrite the demo deck (`deck.md`) to showcase the full range of available layout directives with visually distinct slides that demonstrate what the editor can produce.

**Success criteria**:
- Demo deck includes at least one example of each layout: `::image-hero` (with working timed transition), `::media-left`, `::media-right`, `::column-left`/`::column-right` with image, `::center`, `::callout`, `::quote`
- Hero slides are visually distinct from each other (different text positions, timings, effects)
- Multiple slides include `Note:`, `Resources:`, and `Script:` sections (needed for WP05 testing)
- Demo deck works correctly in both light and dark mode
- No two layout types look the same when paged through
- All existing tests pass

## Context & Constraints

**Current state**: The demo deck at `deck.md` (239 lines) has many hero slides that look similar — same placeholder image colors, limited layout variety. It doesn't showcase `::media-left` or `::media-right` effectively.

**Depends on WP01 + WP02**: The demo needs working hero transitions and themed overlays to showcase them properly.

**Layout syntax reference**: See `docs/layout-syntax.md` for the full directive syntax.

**Available directives**: `::image-hero`, `::column-left`, `::column-right`, `::column-middle`, `::column-left-N%`, `::media-left`, `::media-right`, `::center`, `::callout`, `::quote`, `::svg`, `::mermaid`, `on-click` modifier.

**Placeholder images**: Use `https://dummyimage.com/WxH/BGCOLOR/TEXTCOLOR.png&text=LABEL` with distinct colors per slide type. Choose colors that work well in both light and dark mode contexts.

**Constitution constraints**: Keep slides accessible — meaningful alt text, good heading structure, one H1 per slide, descriptive link text.

## Subtasks & Detailed Guidance

### Subtask T013 – Rewrite demo deck structure

**Purpose**: Create a new deck structure that demonstrates layout variety in a logical progression.

**Steps**:
1. Rewrite `deck.md` with this approximate structure:
   - Front matter with title, subtitle, theme, timing, title/closing slide config
   - **Slide 1**: Standard content slide (heading, bullets, text) — baseline
   - **Slide 2**: Hero with timed transition (`stay-3 transition-8 final-0.25`) — showcase the transition
   - **Slide 3**: `::media-left` — image on left, analysis on right
   - **Slide 4**: `::media-right` — text first, visual support on right
   - **Slide 5**: `::column-left` / `::column-right` with image in one column
   - **Slide 6**: Hero billboard style (`stay-0 transition-0 final-0.3`) — instant, centered quote
   - **Slide 7**: `::callout` and `::quote` showcase
   - **Slide 8**: Three-column comparison layout
   - **Slide 9**: Hero with different text position and effects (`text-top-left pan-right blur-2px`)
   - **Slide 10**: `on-click` progressive reveal demo
   - **Slide 11**: `::center` with SVG or diagram
   - **Slide 12**: Image-only hero pause (no text overlay)
2. Keep it to ~12-15 content slides — enough variety without being tedious
3. Use the presentation as a meta-demo: the content should explain what each layout does while demonstrating it

**Files**: `deck.md`

### Subtask T014 – Add `::media-left` and `::media-right` demo slides

**Purpose**: The current demo doesn't effectively showcase these layout directives.

**Steps**:
1. Create a `::media-left` slide with:
   - A placeholder image on the left (distinct color from hero images)
   - Bullet points or analysis text on the right
   - Separator `---` between visual and text inside the directive
2. Create a `::media-right` slide with:
   - Text content first, then image support on the right
   - Different placeholder image color
3. Use alt text that describes what the placeholder represents (not "placeholder image")
4. Include a `Note:` section on at least one of these slides

**Files**: `deck.md`

### Subtask T015 – Add visually distinct hero configurations

**Purpose**: Current hero slides look mostly the same — same colors, similar configurations.

**Steps**:
1. Use at least 3 hero configurations that are visually distinct:
   - **Timed transition hero**: `stay-3 transition-8 final-0.25 pan-left` — the audience sees the image first, then text fades in. Use a warm-toned placeholder.
   - **Billboard hero**: `stay-0 transition-0 final-0.35` — instant reveal with centered text. Use a dark/cinematic placeholder.
   - **Image-only pause**: No overlay text, just a full-bleed image as a visual breather. Cool-toned placeholder.
2. Use different text positions: `text-bottom-left`, `text-top-left`, `text-center`
3. Use different placeholder image colors so they're visually distinguishable at a glance
4. Include at least one hero with `show-title` or `show-subtitle` to demonstrate that variant

**Files**: `deck.md`

### Subtask T016 – Add notes, resources, and script sections

**Purpose**: WP05 (notes export) needs demo content with these sections to test against.

**Steps**:
1. Add `Note:` sections to at least 6 slides (mix of detailed and brief)
2. Add `Resources:` sections to at least 2 slides with actual reference links (can be example.com links with descriptive text)
3. Add `Script:` sections to at least 1 slide with a fuller spoken script
4. Use both the colon syntax (`Note:`) and the directive syntax (`::notes`) to demonstrate both forms
5. Leave at least 2 slides without any notes (to test the "no notes" case in export)

**Files**: `deck.md`

### Subtask T017 – Verify demo deck in light and dark mode

**Purpose**: Confirm the rewritten demo looks correct in both color modes.

**Steps**:
1. Start the local server: `python3 -m http.server 4173`
2. Open `http://localhost:4173/present/` in a browser
3. Page through all slides in light mode — verify:
   - Hero overlays use light background with dark text
   - Non-hero slides use standard theming
   - All placeholder images are visible and distinct
   - Text is readable on every slide
4. Toggle to dark mode and repeat
5. Verify hero background images look the same in both modes
6. Test the timed transition hero — watch for the delay and fade
7. Run `npm test` to verify no regressions

**Files**: None (manual verification)

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Placeholder images don't differentiate well in both modes | Choose high-contrast placeholder colors that work on both light and dark backgrounds |
| Demo deck is too long and tedious | Keep to 12-15 slides — variety over volume |
| Existing tests reference default deck content | Check if any tests depend on specific `deck.md` content (unlikely — tests use inline source strings) |

## Review Guidance

- Page through the entire demo in both light and dark mode
- Verify no two layout types look the same
- Confirm timed hero transition is visually apparent
- Check that notes/resources/script sections are present for export testing
- Run `npm test` to verify no regressions

## Activity Log

- 2026-05-24T18:00:00Z – system – lane=planned – Prompt created.
