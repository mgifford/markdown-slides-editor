Here’s how I would write it. I would deliberately avoid making this read like a project roadmap. Instead, I’d write it as a vision document that could eventually live in its own repository. It should make it clear that markdown-slides-editor is simply the first implementation.

Open Presentation Companion

A Vision for Accessible, Connected, and Open Presentations

Executive Summary

Presentations are still largely one-way experiences.

A speaker projects slides onto a screen. Attendees attempt to follow along, take notes, search unfamiliar terms, collect links, ask questions, and remember what was said after the session ends.

Accessibility features such as captions, sign language interpretation, CART services, or translated transcripts are often treated as separate services rather than integrated parts of the presentation itself.

Modern web technologies allow us to rethink this model.

The Open Presentation Companion is a proposal for an open, browser-based protocol that allows presentations to publish structured, live information to audience devices. Instead of limiting attendees to what appears on a projector, every participant receives a personalized companion experience on their own device.

The goal is not to replace presentation software.

The goal is to define an open ecosystem that any presentation software can support.

⸻

Why

The web has standards for documents, video, audio, forms, maps, and real-time communication.

There is no widely adopted standard for live presentations.

Every presentation platform reinvents:

* captions
* audience questions
* polls
* handouts
* links
* speaker notes
* translations
* accessibility support

These capabilities should be interoperable.

Just as HTML allows many browsers to display the same document, an Open Presentation Companion should allow many presentation tools to share the same live presentation experience.

⸻

Vision

Imagine attending a conference.

You scan a QR code displayed on the first slide.

Immediately your phone becomes your personal presentation companion.

You choose:

* language
* font size
* colour theme
* reduced motion
* caption behaviour

As the speaker talks, you receive:

* live captions
* translated captions
* current slide
* links mentioned by the presenter
* glossary definitions
* image descriptions
* references
* downloadable resources

You bookmark important ideas.

You ask questions anonymously.

You answer polls.

After the presentation you leave with:

* searchable transcript
* personal notes
* exported Markdown
* AI-generated summary
* list of resources
* glossary
* action items

None of this requires an app.

Everything works inside a browser.

⸻

Principles

Open Standards

No proprietary protocol should be required.

The specification should be openly documented and freely implementable.

⸻

Browser First

A modern browser should be sufficient.

No dedicated application should be required.

⸻

Progressive Enhancement

Presentations should still function without companion devices.

The companion should enhance rather than replace the presentation.

⸻

Accessibility by Default

Accessibility should be built into the protocol rather than added afterwards.

Examples include:

* captions
* synchronized image descriptions
* keyboard support
* screen reader compatibility
* language selection
* personalization
* high contrast
* reduced motion

⸻

Privacy First

Audience participation should not require creating accounts.

Personal preferences should remain on the user’s device whenever possible.

Analytics should be optional rather than assumed.

⸻

Local First

Whenever practical:

* speech recognition
* translation
* summarization
* note taking

should happen on the user’s own device.

This reduces costs, improves privacy, and increases resilience.

⸻

Interoperability

The protocol should work with:

* Reveal.js
* Marp
* Slidev
* Quarto
* PowerPoint
* Keynote
* Google Slides
* markdown-slides-editor
* conference platforms
* digital signage
* museums
* classrooms

The goal is an ecosystem, not a single implementation.

⸻

Potential Capabilities

Live Captions

Real-time speech-to-text.

⸻

Translation

Translate captions into the audience’s preferred language.

Translation may occur:

* locally
* on a relay server
* using external services

⸻

Speaker Identification

Support multiple speakers.

Useful for:

* panels
* meetings
* workshops
* informal discussions

⸻

Slide Synchronization

Audience devices know which slide is currently active.

Late arrivals immediately synchronize.

⸻

Resources

Presenters publish:

* URLs
* GitHub repositories
* PDFs
* videos
* datasets

without requiring attendees to photograph slides.

⸻

Glossary

Technical terms are explained automatically.

Examples:

* WCAG
* WebRTC
* OSPO
* SPDX
* SBOM

Definitions may be localized.

⸻

Image Descriptions

Presenters publish image descriptions separately from visible slides.

Audience devices may:

* display them
* read them aloud
* translate them
* save them

⸻

Polls

Interactive audience participation.

⸻

Questions

Anonymous or identified audience questions.

Moderation optional.

⸻

Personal Notes

Attendees bookmark:

* captions
* slides
* resources
* questions

Everything remains associated with the presentation.

⸻

AI Assistance

After a session attendees might request:

* summarize this talk
* list action items
* compare this presentation with another
* generate social media posts
* explain unfamiliar concepts
* export meeting notes

These functions should be optional and should operate on the user’s own copy of the presentation data whenever practical.

⸻

Example Architecture

Presenter
Speech Recognition
Presentation Software
↓
Presentation Companion Publisher
↓
Open Companion Protocol
↓
Presentation Relay (optional)
↓
Audience Devices

The relay may be:

* WebSocket
* Server-Sent Events
* WebRTC
* ActivityPub
* local network

The transport mechanism is less important than the message format.

⸻

Event Model

Everything is an event.

Examples include:

* caption
* slide
* glossary
* resource
* poll
* question
* image description
* transcript segment

Clients decide which event types they support.

⸻

Beyond Conferences

This model applies to far more than conference presentations.

Examples include:

Education

Students receive synchronized lecture notes and accessible diagrams.

Government

Public consultations become multilingual and accessible by default.

Museums

Visitors receive accessible descriptions and contextual information while exploring exhibits.

Community Meetings

Participants follow discussions in their preferred language and export meeting summaries afterwards.

Hybrid Events

Remote and in-person attendees receive the same companion experience.

Public Hearings

Citizens receive captions, supporting documents, legislation references, and live transcripts.

⸻

Relationship to Existing Standards

This work should build upon existing standards wherever possible.

Potential relationships include:

* HTML
* ARIA
* WebSockets
* Server-Sent Events
* WebRTC
* Media Session API
* Web Speech API
* JSON-LD
* RDF
* ActivityPub
* WCAG
* Web Sustainability Guidelines

The protocol should complement these standards rather than replace them.

⸻

Initial Reference Implementation

The first implementation is expected to be developed within markdown-slides-editor.

This is intended to demonstrate feasibility, gather feedback, and validate the protocol.

The long-term objective is for the protocol to be adopted by many presentation systems.

The implementation should never become the specification.

⸻

Roadmap

Phase 1

* QR code audience companion
* live captions
* responsive companion interface
* local preferences

Phase 2

* synchronized slides
* resources
* glossary
* image descriptions

Phase 3

* audience questions
* polls
* bookmarks
* note taking

Phase 4

* translation
* AI summaries
* local knowledge base
* export formats

Phase 5

* independent specification
* reference libraries
* multiple implementations
* community governance

⸻

Success Looks Like

Success is not one presentation tool supporting these features.

Success is:

* multiple compatible implementations
* an openly documented protocol
* interoperability across presentation software
* accessibility becoming the default rather than an add-on
* attendees retaining ownership of their own presentation history
* presentations becoming richer, more inclusive, and easier to learn from

When someone creates a new presentation platform, adding companion support should be as straightforward as adding HTML export or WebSocket support today.

That is the long-term goal.

I would also add a docs/spec/ directory in the future with an evolving protocol, separate from the vision:

* COMPANION_PROTOCOL.md: Wire protocol, event types, versioning, transport independence.
* EVENT_MODEL.md: JSON schemas for captions, slides, resources, polls, glossary terms, image descriptions, etc.
* ACCESSIBILITY.md: Accessibility requirements for companion clients.
* SECURITY_AND_PRIVACY.md: Local-first design, authentication, session lifecycle, data retention.
* IMPLEMENTATIONS.md: A growing list of projects that implement the protocol.

That separation keeps the vision stable while allowing the technical specification to evolve independently and eventually move into its own repository under neutral governance if the community forms around it.
