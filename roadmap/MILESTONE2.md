# Milestone 2: Accessible Companion

## Goal

Move beyond live captions and make the audience companion genuinely useful for accessibility, comprehension, and follow-up.

This milestone adds structured presentation context to the companion experience.

The audience should not only read what the speaker says. They should also receive supporting information that helps them understand the presentation in the way that works best for them.

---

# User Story

An attendee joins a presentation using a QR code or short session code.

They receive live captions from Milestone 1.

As the presentation continues, their device also updates with:

- current slide title
- shared links
- glossary terms
- image descriptions
- accessible slide context
- downloadable resources

The attendee can adjust how this information appears.

They can save useful items locally for later review.

---

# Goals

Improve access for people who may need:

- larger text
- higher contrast
- reduced motion
- captions on a personal device
- image descriptions
- glossary support
- contextual explanations
- links that do not require photographing slides

Make the companion useful even for people who do not identify as disabled.

---

# Success Criteria

A presenter can:

- define slide titles
- share resources
- define glossary terms
- add image descriptions
- publish structured metadata to connected audience devices

An attendee can:

- see the current slide title
- receive links and resources
- expand glossary terms
- read image descriptions
- save useful items locally
- retain their display preferences

---

# Scope

## Included

- slide synchronization
- presentation metadata
- resource events
- glossary events
- image description events
- local saving of useful items
- improved audience personalization

## Not Included

- audience questions
- polls
- reactions
- AI-generated summaries
- live translation
- speaker identification

Those belong to later milestones.

---

# Architecture

Milestone 2 builds on the live event channel from Milestone 1.

```text
Presenter Browser
    │
    ├── Caption Events
    ├── Slide Events
    ├── Resource Events
    ├── Glossary Events
    └── Image Description Events
        │
        ▼
Live Companion Relay
        │
        ▼
Audience Companion
```

The key change is that the companion is no longer only a caption viewer.

It becomes a structured event receiver.

---

# Event Types

## Slide Event

Sent when the current slide changes.

```json
{
  "type": "slide",
  "slide": 12,
  "title": "Why Open Standards Matter",
  "section": "Governance",
  "timestamp": 1751909400
}
```

Audience devices use this to:

- show current slide context
- organize notes
- support late joins
- attach bookmarks to slides

---

## Resource Event

Sent when a slide or presenter provides a resource.

```json
{
  "type": "resource",
  "id": "res-004",
  "title": "Web Content Accessibility Guidelines",
  "url": "https://www.w3.org/TR/WCAG22/",
  "description": "W3C accessibility guidelines for web content.",
  "slide": 12
}
```

Resources may include:

- websites
- standards
- GitHub repositories
- PDFs
- videos
- datasets
- reading lists

---

## Glossary Event

Sent when the deck defines a term that may need explanation.

```json
{
  "type": "glossary",
  "id": "term-002",
  "term": "OSPO",
  "definition": "Open Source Program Office.",
  "slide": 8,
  "language": "en"
}
```

Glossary entries should support:

- acronym expansion
- plain-language definitions
- links to further reading
- localization in later milestones

---

## Image Description Event

Sent when a slide contains an image, chart, diagram, screenshot, or visual explanation.

```json
{
  "type": "imageDescription",
  "id": "img-006",
  "slide": 14,
  "text": "A line chart showing a steady increase in software maintenance costs over five years.",
  "longDescription": "The chart compares initial development cost with long-term maintenance cost. Maintenance rises each year and eventually exceeds the original development cost.",
  "language": "en"
}
```

Audience devices may:

- display the description
- expose it to screen readers
- allow the user to save it
- associate it with notes

---

# Presentation Metadata

The companion should receive basic presentation metadata.

```json
{
  "type": "presentation",
  "title": "AI Is Rewriting the Rules. Who Controls the Outcome?",
  "presenter": "Mike Gifford",
  "event": "Conference session",
  "language": "en"
}
```

This helps organize:

- saved sessions
- local transcripts
- exported notes
- future summaries

---

# Authoring Model

Markdown Slides Editor should support structured metadata inside or alongside the slide deck.

Possible approaches include:

## Front Matter

```yaml
title: AI Is Rewriting the Rules
presenter: Mike Gifford
language: en
resources:
  - title: Web Sustainability Guidelines
    url: https://www.w3.org/TR/web-sustainability-guidelines/
```

## Slide-Level Metadata

```markdown
---

# Why Open Standards Matter

<!--
resource:
  title: Web Content Accessibility Guidelines
  url: https://www.w3.org/TR/WCAG22/

glossary:
  term: WCAG
  definition: Web Content Accessibility Guidelines.
-->
```

## Dedicated Sidecar File

```text
presentation.companion.yml
```

This may eventually be preferable if the metadata becomes extensive.

---

# Audience Companion Features

The audience interface should include:

- live captions
- current slide title
- resource panel
- glossary panel
- image descriptions panel
- saved items
- accessibility settings

It should remain simple.

The interface should not become cluttered or distracting.

---

# Local Saving

Audience members should be able to save:

- resources
- glossary terms
- image descriptions
- selected captions
- slide references

Storage should be local by default.

No account should be required.

---

# Accessibility Requirements

The companion must support:

- keyboard navigation
- screen readers
- semantic landmarks
- readable focus states
- high contrast
- reduced motion
- text resizing
- caption controls
- no reliance on colour alone

Image descriptions must be easy to find but should not interrupt caption reading.

---

# Privacy Requirements

The relay should not need to know:

- attendee identity
- accessibility preferences
- saved resources
- notes
- reading history

These should remain local to the attendee device unless the user explicitly exports or shares them.

---

# Open Questions

## Metadata Format

Should metadata live inside the Markdown deck, in YAML front matter, or in a sidecar file?

---

## Resource Timing

Should resources appear:

- when the relevant slide appears?
- all at the beginning?
- only when the presenter pushes them?

---

## Glossary Timing

Should glossary terms appear automatically when first used?

Or only when associated with a slide?

---

## Image Descriptions

Should every slide support:

- short description?
- long description?
- chart data?
- speaker explanation?

---

## Presenter Control

Should presenters manually push resources during the talk?

Or should all metadata publish automatically as slides change?

---

## Saved Items

Should saved items be exportable as:

- Markdown?
- JSON?
- HTML?
- plain text?

---

# Stretch Goals

If implementation is straightforward, explore:

- downloadable resource bundle
- Markdown export of saved items
- slide thumbnails
- per-slide notes
- structured bibliography
- local session archive

These should not delay the main milestone.

---

# Risks

## Interface Complexity

Too much information can overwhelm users.

The companion must prioritize captions and make other information available without clutter.

---

## Authoring Burden

If metadata is too hard to add, presenters will not use it.

The authoring model must remain lightweight.

---

## Accessibility Regression

Adding panels and controls may make the companion harder to use.

Accessibility testing should happen throughout implementation.

---

# Related Vision

This milestone advances the ideas described in:

```text
docs/vision/OPEN_PRESENTATION_COMPANION.md
```

Milestone 1 proves that audience devices can receive live captions.

Milestone 2 demonstrates that the same channel can carry structured accessibility and learning information.

The larger goal is to show that presentations can become richer, more accessible, and more useful without requiring a proprietary platform.
