# Editor Vision

This document captures the longer-term product direction for the Markdown Slides Editor.

It is not a sprint plan. It is a guide for choosing features, rejecting distractions, and keeping the project coherent as it grows.

## Product aim

Build a production-ready slide editor that feels practical and responsive like a mainstream presentation tool, while keeping Markdown as the editable source of truth and accessible HTML as the presentation output.

This project is closer to "Google Slides, but with Markdown" than to a simple Markdown-to-slides converter.

## Primary users

- presenters who want fast, credible slide authoring
- authors who care about accessibility and clean HTML output
- teams who want a reusable, inspectable presentation workflow
- people who want local-first authoring without a required server

## Core product promise

- author slides in a browser with immediate feedback
- store work locally by default
- keep the source portable and machine-readable
- present from accessible HTML
- export a bundle that can travel outside the editor
- use AI only as an optional assistant, never as a hidden dependency

## Experience goals

## Fast authoring

The editor should feel immediate. Changes should appear quickly in preview, and common actions should not require technical setup, build tools, or a backend.

## Credible presentation output

The audience view should feel like a real presentation surface, not like an editor wearing a disguise. Presenter tools should stay separate from audience-facing content.

## Accessibility by design

Accessibility should be part of authoring, preview, export, and review. It should be easier to do the right thing than to publish a cluttered or semantically weak deck.

## Safe iteration

Authors should be able to experiment, revise, and recover. Undo, redo, reversible AI suggestions, and clear export paths are part of this direction.

## Static-first architecture

The default experience must run on GitHub Pages without a server. Local browser storage, browser cache, and portable export should remain first-class.

## Product pillars

## 1. Editor

The editor is the main workspace.

It should support:

- Markdown editing with live preview
- notes, script, and references alongside visible slide content
- lightweight slide layout directives for common presentation patterns
- deck-level navigation and review
- local-first save behavior that is clearly explained to users
- strong import and export workflows

Longer term:

- undo and redo
- deck-level comments and revision history
- slide duplication, reordering, and templates
- stronger density and readability warnings

## 2. Presentation runtime

The runtime should stay grounded in accessible HTML and keyboard support.

It should support:

- clean audience view
- capable presenter view
- predictable navigation
- optional generated title and closing slides
- print-friendly output and portable snapshot export

Longer term:

- better outline and table-of-contents navigation
- stronger runtime parity with whisper-slides where it improves accessibility and presenter confidence
- optional local or API-backed captioning only when AI capability is actually available

## 3. Accessibility workflow

Accessibility is not only about the exported slide markup.

The full workflow should include:

- linting in the editor
- semantic HTML checks in tests
- manual review using tools such as Sa11y
- accessible print and HTML publishing paths
- documented expectations for notes, motion, density, and reading order

Longer term:

- automated `axe` and `pa11y` coverage
- stronger contrast validation
- better warnings for layout misuse and overloaded slides

## 4. AI-assisted authoring

AI should help authors think, draft, and improve. It should not silently replace their judgment.

Promising uses include:

- structured prompt generation for LLM briefing
- whole-deck review
- suggestions for slide clarity, density, and ordering
- speaker-note and script drafting
- references and resource-slide support

Rules for AI in this project:

- AI must remain optional
- AI use must be disclosed
- browser-based AI is not assumed
- local-first AI options such as Ollama are preferred when possible
- suggestions should be reviewable and reversible

## Success criteria

The project is succeeding when:

- a presenter can start a deck quickly without setup friction
- the editor helps keep slides concise and readable
- the audience view feels polished and distraction-free
- presenter view improves confidence without becoming a crutch
- the exported HTML is inspectable, semantic, and shareable
- accessibility review is built into the normal workflow

## Non-goals

These are not current priorities:

- server-required collaboration as a baseline feature
- decorative animation-heavy slide effects
- replacing semantic HTML with canvas or image-only output
- making AI mandatory for authoring or presenting
- optimizing for training demos over production use

## Decision filter

When evaluating a new feature, ask:

- Does this improve real authoring or presentation work?
- Does it preserve or improve accessibility?
- Does it keep the static baseline intact?
- Does it reduce friction without hiding important complexity?
- Does it help presenters feel more credible and in control?

If the answer is mostly no, the feature is probably not part of the core product direction.
