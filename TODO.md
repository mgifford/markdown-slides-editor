# TODO

Future ideas and follow-up work for the final project.

## Product direction

- Build for production use, not training or demo-only scenarios.
- Help presenters improve clarity, confidence, and credibility when presenting.
- Favor reusable patterns that other teams such as CivicActions and W3C could adopt, without making their adoption a dependency for success.

## Runtime and integration

- Integrate the `whisper-slides` runtime instead of the temporary in-repo presentation shell.
- Reuse the accessible HTML patterns from the W3C slide markup as closely as possible.
- Preserve keyboard behavior, presenter notes, and slide navigation semantics from `whisper-slides`.
- Audit the generated HTML against the structure used in [`whisper-slides`](https://github.com/mgifford/whisper-slides).
- Add optional Cloudflare Worker + D1 integration for authenticated online save/load and comments without making cloud save the baseline.
- Keep any Cloudflare-backed sync model aligned with `docs/cloudflare-sync-plan.md`, especially around secure session cookies, private deck ownership, and local-first fallback.
- htmx was evaluated and found unsuitable for the static baseline (no server to return HTML fragments). See `docs/technology-decisions.md` for full reasoning. Revisit only if the Cloudflare Worker UI layer grows complex enough to benefit from server-rendered HTML fragments.

## Accessibility

- Turn the accessibility checklist into enforceable validation rules in the editor.
- Add stronger heading structure checks, including repeated headings and empty headings.
- Add checks for semantic list usage and suspicious fake-list patterns.
- Add checks that discourage or reject layout tables in authored content.
- Add checks that flag slides whose essential meaning appears to exist only in notes.
- Add link-quality checks beyond generic phrases such as context-free URLs.
- Add image guidance for decorative images versus informative images.
- Add theme-level contrast validation instead of relying on manual review.
- Add automated accessibility regression checks for exported presentations.
- Add rendered-output validation to ensure semantic HTML instead of container-heavy markup.
- Add guardrails against unnecessary or incorrect ARIA role usage.
- Add Sa11y to the manual accessibility review workflow for browser-accessible decks.
- Make motion-reduction defaults explicit in themes and presentation runtime behavior.
- Disable auto-advance by default and avoid decorative transition effects.
- Compare output markup with the accessible patterns used in W3C presentation examples.

## AI and speech-to-text

- Treat Whisper speech-to-text as an optional enhancement, not a baseline feature.
- Only expose Whisper-related UI when AI is actually available.
- Support local Whisper execution when running outside GitHub Pages.
- Optionally support API-based transcription when an API key is configured.
- Keep GitHub Pages mode explicit: no local Whisper execution, no misleading AI controls.
- Add capability detection so captioning controls appear only for valid local or API-backed configurations.
- Document the privacy tradeoffs between local transcription and API-based transcription.
- Add an AI-assisted deck review workflow for improving clarity, accessibility, pacing, and slide density.
- Prioritize local-first LLM integrations such as Ollama for private review and editing support.
- Allow deck-level review prompts so an author can ask for feedback on the whole presentation, not just one slide.
- Add slide-level and deck-level rewrite suggestions that can be accepted, rejected, or partially applied.
- Explore an integrated AI chat panel for discussing edits without leaving the editor.
- Support copy-and-paste workflows so authors can move deck content into external LLM tools when preferred.
- Add comment-style AI suggestions so feedback can appear alongside slides instead of replacing content immediately.
- Keep AI suggestions non-destructive by default and require explicit author approval before applying changes.

## Editor and authoring

- Aim for a "Google Slides, but with Markdown" experience for authoring speed, responsiveness, and review workflows.
- Add a better slide outline and slide sorter in the editor.
- Add template insertion for title slides, section slides, and resource slides.
- Add a dedicated notes editor rather than relying only on `Note:` separators in raw Markdown.
- Add autosave status, undo-friendly editing, and deck version history in-browser.
- Add explicit undo and redo support for editor changes, AI-assisted edits, and slide-structure operations.
- Preserve a full edit history so authors can confidently experiment with AI-assisted revisions.
- Add comment and suggestion modes so edits can be reviewed before they are merged into source.
- Add richer copy/paste support between slides, notes, comments, and external tools.
- Add stricter JSON import/export for machine-readable deck workflows.

## Presentation workflow

- Improve presenter view with timer controls, elapsed/remaining time, and slide thumbnails.
- Add stronger sync resilience between editor, audience view, and presenter view.
- Add a portable export mode that can bundle local assets alongside the generated HTML.
- Add print and PDF export paths that preserve accessible reading order as much as possible.

## Documentation

- Document which accessibility ideas come from W3C slide markup patterns and which come from local project decisions.
- Document the difference between static GitHub Pages mode and local AI-enabled mode.
- Add contributor guidance for evaluating whether a feature belongs in the static baseline or the optional AI layer.
