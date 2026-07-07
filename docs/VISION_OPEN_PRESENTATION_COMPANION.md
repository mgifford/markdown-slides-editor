# Open Presentation Companion

## A Vision for Accessible, Connected, and Open Presentations

## Executive Summary

Presentations are still largely one-way experiences.

A speaker projects slides onto a screen. Attendees attempt to follow along, take notes, search unfamiliar terms, collect links, ask questions, and remember what was said after the session ends.

Accessibility features such as captions, sign language interpretation, CART services, or translated transcripts are often treated as separate services rather than integrated parts of the presentation itself.

Modern web technologies allow us to rethink this model.

The **Open Presentation Companion** is a proposal for an open, browser-based protocol that allows presentations to publish structured, live information to audience devices. Instead of limiting attendees to what appears on a projector, every participant receives a personalized companion experience on their own device.

The goal is **not** to replace presentation software.

The goal is to define an open ecosystem that any presentation software can support.

---

# Why

The web has standards for documents, video, audio, forms, maps, and real-time communication.

There is no widely adopted standard for live presentations.

Every presentation platform reinvents:

- captions
- audience questions
- polls
- handouts
- links
- speaker notes
- translations
- accessibility support

These capabilities should be interoperable.

Just as HTML allows many browsers to display the same document, an Open Presentation Companion should allow many presentation tools to share the same live presentation experience.

---

# Vision

Imagine attending a conference.

You scan a QR code displayed on the first slide.

Immediately your phone becomes your personal presentation companion.

You choose:

- language
- font size
- colour theme
- reduced motion
- caption behaviour

As the speaker talks, you receive:

- live captions
- translated captions
- current slide
- links mentioned by the presenter
- glossary definitions
- image descriptions
- references
- downloadable resources

You bookmark important ideas.

You ask questions anonymously.

You answer polls.

After the presentation you leave with:

- searchable transcript
- personal notes
- exported Markdown
- AI-generated summary
- list of resources
- glossary
- action items

None of this requires an app.

Everything works inside a browser.

---

# Design Principles

## Open Standards

The protocol should be openly documented and freely implementable.

No proprietary software should be required.

Multiple compatible implementations should be encouraged.

---

## Browser First

A modern browser should be sufficient.

No dedicated application should be required.

The browser should become the universal presentation companion.

---

## Progressive Enhancement

Presentations should continue to work without a companion device.

The companion enhances the experience rather than replacing the presentation.

---

## Accessibility by Default

Accessibility should be built into the protocol rather than added afterwards.

Examples include:

- captions
- synchronized image descriptions
- keyboard support
- screen reader compatibility
- language selection
- personalization
- high contrast
- reduced motion
- simplified reading modes

Accessibility is not a feature.

It is a core design requirement.

---

## Privacy First

Attendees should not need to create accounts.

Preferences should remain on the user's device whenever possible.

Analytics should be optional rather than assumed.

Conference organizers should not need to collect personal information simply to provide an accessible experience.

---

## Local First

Whenever practical:

- speech recognition
- translation
- summarization
- note taking
- AI assistance

should happen on the attendee's own device.

This improves privacy, reduces infrastructure costs, and allows functionality even with unreliable internet connections.

---

## Interoperability

The protocol should be usable by many presentation systems, including:

- markdown-slides-editor
- Reveal.js
- Marp
- Slidev
- Quarto
- PowerPoint
- Keynote
- Google Slides
- conference platforms
- museum exhibits
- classrooms
- government meeting systems

The goal is an ecosystem rather than a single implementation.

---

# The Presentation Companion

Instead of thinking about a presentation as a slideshow, think about it as a stream of structured events.

Slides are only one of those events.

Others include:

- captions
- translations
- glossary terms
- references
- image descriptions
- polls
- questions
- downloadable resources
- speaker changes
- bookmarks
- announcements

Each attendee chooses which events they want to receive.

The projector shows one view.

Every attendee sees the presentation in the way that best meets their own needs.

---

# Example Experience

An attendee scans a QR code.

Their browser opens:

```
https://slides.example.org/session/A4PK
```

They immediately receive:

- the current slide
- the latest captions
- synchronized presentation state

They choose:

- English
- Large text
- Dark mode
- High contrast
- Auto-scroll captions

As the presentation continues they receive:

- live captions
- translated captions
- glossary explanations
- image descriptions
- links shared by the presenter
- downloadable resources

At the end of the presentation they already have:

- searchable transcript
- personal notes
- bookmarked moments
- references
- exported Markdown
- AI-generated summary

No app installation.

No account.

No email signup.

---

# Core Capabilities

## Live Captions

Real-time speech-to-text from one or more speakers.

---

## Translation

Translate captions into the attendee's preferred language.

Translation may happen:

- locally
- using a trusted service
- using a local LLM
- using browser capabilities

---

## Speaker Identification

Support multiple speakers.

Useful for:

- panels
- workshops
- meetings
- conversations
- classroom discussions

---

## Slide Synchronization

Audience devices know which slide is active.

Late arrivals immediately synchronize.

---

## Resources

Presenters can publish:

- URLs
- GitHub repositories
- PDFs
- datasets
- videos
- standards
- documentation

Attendees no longer need to photograph slides containing URLs.

---

## Glossary

Technical terms are explained as they appear.

Examples:

- WCAG
- WebRTC
- SBOM
- SPDX
- OSPO

Definitions may be localized.

---

## Image Descriptions

Presenters publish descriptions separately from visible slides.

Audience devices may:

- display them
- read them aloud
- translate them
- save them

This benefits blind attendees, people taking notes, and anyone who briefly looked away.

---

## Polls

Interactive audience participation.

---

## Questions

Audience members submit questions.

Questions may be:

- anonymous
- identified
- moderated
- voted on

---

## Personal Notes

Attendees bookmark:

- captions
- slides
- resources
- glossary terms

Everything remains associated with the presentation.

---

## AI Assistance

After the presentation attendees may request:

- summarize this talk
- explain unfamiliar concepts
- compare with another presentation
- generate meeting notes
- create social media posts
- produce action items

These features should operate on the attendee's own copy of the presentation whenever practical.

---

# Beyond Conferences

This protocol is useful anywhere information is presented.

## Education

Students receive synchronized lecture notes, diagrams, and references.

---

## Government

Public consultations become multilingual and accessible by default.

Supporting documents arrive alongside the discussion.

---

## Museums

Visitors receive contextual information and accessible descriptions while exploring exhibits.

---

## Community Meetings

Participants receive captions, documents, and summaries without requiring specialized equipment.

---

## Public Hearings

Citizens receive legislation references, supporting documents, transcripts, and links as discussions happen.

---

## Hybrid Events

Remote and in-person attendees receive the same experience.

---

# Architecture

```
Presenter

Speech Recognition

Presentation Software

↓

Presentation Companion Publisher

↓

Open Presentation Companion Protocol

↓

Optional Relay Service

↓

Audience Devices
```

Possible transport mechanisms include:

- WebSockets
- Server-Sent Events
- WebRTC
- ActivityPub
- Local network services

The transport mechanism is intentionally separate from the protocol.

---

# Event Model

Everything is an event.

Examples include:

- caption
- slide
- resource
- glossary
- image description
- poll
- question
- transcript segment
- bookmark
- announcement

Clients choose which event types they support.

New event types can be added over time without changing the overall architecture.

---

# Relationship to Existing Standards

The Open Presentation Companion should build upon existing standards wherever possible.

Potential relationships include:

- HTML
- ARIA
- WCAG
- WebRTC
- WebSockets
- Server-Sent Events
- Web Speech API
- Media Session API
- JSON-LD
- RDF
- ActivityPub
- Web Sustainability Guidelines

The goal is integration rather than replacement.

---

# Reference Implementation

The first implementation is expected to be developed within **markdown-slides-editor**.

That implementation serves as a proof of concept.

The long-term objective is for multiple independent projects to implement the protocol.

The implementation should never become the specification.

---

# Roadmap

## Phase 1

- QR code audience companion
- live captions
- responsive companion interface
- personalization
- local preferences

## Phase 2

- synchronized slides
- resources
- glossary
- image descriptions

## Phase 3

- audience questions
- polls
- bookmarks
- note taking

## Phase 4

- translation
- AI summaries
- personal knowledge base
- export formats

## Phase 5

- independent specification
- reference libraries
- multiple implementations
- community governance
- W3C Community Group or similar standards venue

---

# Long-Term Vision

The Open Presentation Companion is not about one presentation tool.

It is about defining a common language for presentations.

Just as HTML transformed documents into interoperable web pages, an open presentation protocol could transform presentations into rich, accessible, interactive experiences that work across browsers, devices, presentation software, and conference platforms.

The objective is not simply better captions.

It is to create an open ecosystem where accessibility, personalization, multilingual participation, AI assistance, and knowledge sharing become natural parts of every presentation.

The browser becomes each attendee's personal companion, while presenters remain free to choose whichever presentation software best suits their needs.

The projector shows one presentation.

Every attendee experiences their own.
