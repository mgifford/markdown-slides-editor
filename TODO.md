# TODO

Future ideas and follow-up work for the final project.

## Runtime and integration

- Integrate the `whisper-slides` runtime instead of the temporary in-repo presentation shell.
- Reuse the accessible HTML patterns from the W3C slide markup as closely as possible.
- Preserve keyboard behavior, presenter notes, and slide navigation semantics from `whisper-slides`.
- Audit the generated HTML against the structure used in [`whisper-slides`](https://github.com/mgifford/whisper-slides).

## Accessibility

- Turn the accessibility checklist into enforceable validation rules in the editor.
- Add stronger heading structure checks, including repeated headings and empty headings.
- Add link-quality checks beyond generic phrases such as context-free URLs.
- Add image guidance for decorative images versus informative images.
- Add theme-level contrast validation instead of relying on manual review.
- Add automated accessibility regression checks for exported presentations.
- Compare output markup with the accessible patterns used in W3C presentation examples.

## AI and speech-to-text

- Treat Whisper speech-to-text as an optional enhancement, not a baseline feature.
- Only expose Whisper-related UI when AI is actually available.
- Support local Whisper execution when running outside GitHub Pages.
- Optionally support API-based transcription when an API key is configured.
- Keep GitHub Pages mode explicit: no local Whisper execution, no misleading AI controls.
- Add capability detection so captioning controls appear only for valid local or API-backed configurations.
- Document the privacy tradeoffs between local transcription and API-based transcription.

## Editor and authoring

- Add a better slide outline and slide sorter in the editor.
- Add template insertion for title slides, section slides, and resource slides.
- Add a dedicated notes editor rather than relying only on `Note:` separators in raw Markdown.
- Add autosave status, undo-friendly editing, and deck version history in-browser.
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
