---
work_package_id: "WP05"
subtasks:
  - "T023"
  - "T024"
  - "T025"
  - "T026"
title: "Export with Speaker Notes"
phase: "Phase 3 - Enhancement"
lane: "done"
assignee: ""
agent: "claude-opus"
shell_pid: ""
review_status: ""
reviewed_by: ""
dependencies: []
history:
  - timestamp: "2026-05-24T18:00:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2026-05-24T22:45:00Z"
    lane: "done"
    agent: "claude-opus"
    shell_pid: ""
    action: "Implemented T023-T026: buildNotesExportHtml function, Notes Export button in editor UI, omits empty supplemental sections, 3 new tests"
---

# Work Package Prompt: WP05 – Export with Speaker Notes

## ⚠️ IMPORTANT: Review Feedback Status

**Read this first if you are implementing this task!**

- **Has review feedback?**: Check the `review_status` field above. If it says `has_feedback`, scroll to the **Review Feedback** section immediately.

---

## Review Feedback

*[This section is empty initially.]*

---

## Objectives & Success Criteria

Add an export option that produces a standalone HTML document with each slide's visual content followed by its speaker notes, resources, and script sections.

**Success criteria**:
- A new "Export with notes" action is available in the editor export UI
- The exported HTML document shows each slide followed by its supporting sections
- Slides without notes/resources/script show only the slide content (no placeholder)
- The exported document is a standalone HTML file that works offline
- The document is well-structured with clear visual separation between slides and notes
- All existing tests pass
- New test verifies notes export includes all authored support content

## Context & Constraints

**Current export infrastructure**: `src/modules/export.js` (1,677 lines) already generates:
- ZIP bundle with Markdown, JSON, HTML, ODP, MHTML
- Standalone HTML snapshot
- One-page handout

**Existing helper**: `buildSupplementalHtml()` in `src/modules/views/shared.js:50-66` already generates HTML for notes/resources/script sections. This can be reused or adapted.

**Rendered slide data**: Each `renderedSlide` object has `notesHtml`, `resourcesHtml`, and `scriptHtml` fields that contain the rendered HTML for support sections.

**No dependencies on other WPs**: This work package is independent and can be implemented in parallel with WP01-WP04.

**Constitution constraints**: No new dependencies. Keep the export as standalone HTML. The existing export UI approach (dropdown or modal) should guide the UX pattern.

**References**:
- [spec.md](../spec.md) — User Story 5, FR-007
- [plan.md](../plan.md) — WP05 section
- [research.md](../research.md) — R4: Notes Export Format

## Subtasks & Detailed Guidance

### Subtask T023 – Create notes export HTML generation function

**Purpose**: Generate a standalone HTML document that interleaves slide content with supporting material.

**Steps**:
1. In `src/modules/export.js`, add a new function (e.g., `generateNotesExportHtml(compiledDeck, options)`) that:
   - Generates a complete standalone HTML document
   - Iterates through `compiledDeck.renderedSlides`
   - For each slide, renders:
     - A section with the slide's visual content (from `slide.html`)
     - Below it, the supplemental sections (notes, resources, script) if present
   - Includes the app's CSS inline for standalone viewing
   - Includes a simple print-friendly layout

2. Document structure for each slide:
   ```html
   <section class="notes-export__slide">
     <header class="notes-export__slide-header">
       <span class="notes-export__slide-number">Slide N</span>
     </header>
     <div class="notes-export__content">
       <!-- slide.html content -->
     </div>
     <!-- Only if notes/resources/script exist -->
     <div class="notes-export__supplemental">
       <div class="notes-export__notes">
         <h3>Notes</h3>
         <!-- notesHtml -->
       </div>
       <div class="notes-export__resources">
         <h3>Resources</h3>
         <!-- resourcesHtml -->
       </div>
       <div class="notes-export__script">
         <h3>Script</h3>
         <!-- scriptHtml -->
       </div>
     </div>
   </section>
   ```

3. Add basic CSS for the notes export layout:
   - Clear visual separator between slides (horizontal rule or spacing)
   - Supplemental sections indented or visually distinct from slide content
   - Print-friendly: one slide per page (optional, `page-break-after: always`)
   - Slide content area styled to be readable at document width (not fixed slide dimensions)

4. Include the deck title and metadata at the top of the document.

**Files**: `src/modules/export.js`
**Notes**: Follow the pattern of the existing `generateSnapshotHtml()` function for standalone HTML structure. Reuse the same CSS embedding approach.

### Subtask T024 – Wire notes export into editor export UI

**Purpose**: Make the notes export accessible from the editor's export controls.

**Steps**:
1. In `src/modules/views/editor-view.js`, find the existing export UI (search for "export" or "Export")
2. Add a new option for "Export with notes" alongside the existing export actions
3. When clicked, call the new `generateNotesExportHtml()` function and trigger a download
4. The download should produce a file like `deck-notes.html`
5. Follow the existing pattern for how other exports trigger downloads (likely creating a Blob and using `URL.createObjectURL`)

**Files**: `src/modules/views/editor-view.js`, `src/modules/export.js` (for any download helper)
**Notes**: The export UI currently uses a dropdown or button group. Add the new option in the same pattern — don't introduce a different UX approach.

### Subtask T025 – Omit placeholder text for slides without notes

**Purpose**: Slides that have no speaker notes should not show a "No speaker notes" placeholder in the export.

**Steps**:
1. In the notes export function, check each slide's `notesHtml`, `resourcesHtml`, and `scriptHtml`
2. Only render the supplemental section if at least one of these fields has content
3. Within the supplemental section, only render individual subsections (Notes, Resources, Script) that have content
4. A slide with no supplemental content should show just its visual content with no extra section

**Files**: `src/modules/export.js`
**Notes**: The existing `buildSupplementalHtml()` in `shared.js` outputs "No speaker notes for this slide." as a fallback. The notes export should NOT reuse this fallback — it should simply omit the section.

### Subtask T026 – Add export test for notes export content

**Purpose**: Verify the notes export function includes all authored support content.

**Steps**:
1. In `tests/export.test.js` (or a new test file), add tests that:
   - Create a compiled deck with slides that have notes, resources, and script content
   - Call the notes export function
   - Assert the output HTML contains the notes text
   - Assert the output HTML contains the resources text
   - Assert the output HTML contains the script text
   - Assert that a slide without notes does NOT produce a supplemental section
2. Follow the existing test pattern in `tests/export.test.js` for how compiled decks are constructed in tests.

**Files**: `tests/export.test.js` (or new test file)

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Export HTML is very large due to inline CSS | Reuse the existing CSS embedding approach — it's already accepted for snapshot exports |
| Hero slide rendering in notes export looks broken without presentation container | Use simplified slide rendering in the notes export — slide content without the `slide-card` wrapper, or use the wrapper with `active` class for final state |
| Editor export UI is complex and hard to extend | Find the existing export pattern first and follow it exactly |

## Review Guidance

- Export a deck with notes, resources, and script content
- Verify the exported HTML shows all supplemental content
- Verify slides without notes don't show placeholders
- Open the exported file standalone in a browser — it should work offline
- Print the exported file — it should be readable
- Run `npm test` including the new export test

## Activity Log

- 2026-05-24T18:00:00Z – system – lane=planned – Prompt created.
