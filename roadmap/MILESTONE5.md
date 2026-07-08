# Milestone 5: Open Presentation Companion

## Goal

Transition the ideas developed within Markdown Slides Editor into an open, community-governed ecosystem.

Markdown Slides Editor should remain an important implementation, but it should not become the only implementation.

The long-term success of this work will be measured by adoption across many presentation systems, conference platforms, educational tools, and accessibility technologies.

This milestone shifts the focus from building features to enabling an ecosystem.

---

# Vision

The web has open standards for:

- documents (HTML)
- graphics (SVG)
- audio and video
- forms
- accessibility (ARIA)
- real-time communication (WebRTC, WebSockets)

Presentations deserve the same treatment.

An attendee should be able to use the same companion application regardless of whether the presenter is using:

- Markdown Slides Editor
- Reveal.js
- Marp
- Slidev
- Quarto
- PowerPoint
- Keynote
- Google Slides
- a conference platform
- a classroom platform

The presentation software becomes interchangeable.

The companion experience becomes portable.

---

# Success Criteria

At least one additional presentation platform successfully implements the protocol.

The protocol is documented independently from Markdown Slides Editor.

Developers can implement compatible clients and servers without reading the Markdown Slides Editor source code.

Community discussion begins around governance, interoperability, and future evolution.

---

# Scope

## Included

- protocol specification
- reference implementation
- interoperability testing
- example clients
- example servers
- governance proposal
- community engagement
- implementation guides

## Not Included

- vendor-specific extensions
- proprietary APIs
- mandatory cloud infrastructure

---

# Reference Architecture

```
Presentation Software
        │
        ▼
Open Presentation Companion Publisher
        │
        ▼
Open Presentation Companion Protocol
        │
        ├──────────────┐
        ▼              ▼
 Companion App     Conference Platform
        │              │
        └──────┬───────┘
               ▼
          Audience Devices
```

The protocol should remain independent of:

- programming language
- framework
- hosting platform
- transport mechanism

---

# Standardization

The protocol should define:

- event model
- message formats
- session lifecycle
- versioning
- extensibility
- interoperability requirements

The protocol should intentionally avoid prescribing implementation details.

For example, it should not require:

- Cloudflare
- Node.js
- WebSockets
- a particular AI provider

Those remain implementation choices.

---

# Event Model

The protocol should define common event types such as:

- presentation
- slide
- caption
- transcript
- resource
- glossary
- image description
- poll
- question
- bookmark
- feedback
- announcement

Future event types should be easy to add without breaking existing implementations.

---

# Companion Applications

Markdown Slides Editor should not be the only companion.

Possible implementations include:

- browser applications
- mobile applications
- accessibility tools
- museum guides
- educational platforms
- conference applications
- note-taking tools

All should be able to consume the same protocol.

---

# Reference Libraries

Develop reusable libraries for:

- JavaScript
- TypeScript
- Python
- Rust
- Go

These libraries should simplify implementing the protocol.

---

# Interoperability

Provide a test suite that verifies:

- event compatibility
- protocol compliance
- accessibility requirements
- backward compatibility

Implementations should be able to validate themselves automatically.

---

# Accessibility

Accessibility should be part of the protocol itself.

The specification should encourage:

- semantic events
- image descriptions
- captions
- language metadata
- personalization
- reduced motion
- keyboard navigation
- screen reader compatibility

Accessibility should never become an optional extension.

---

# Sustainability

The protocol should encourage sustainable implementation.

Examples include:

- local-first processing
- efficient message formats
- minimal network traffic
- browser-native capabilities
- user-controlled AI
- reusable infrastructure

These goals align closely with the W3C Web Sustainability Guidelines.

---

# Privacy

Privacy should be a core design principle.

The protocol should avoid requiring:

- user accounts
- persistent identifiers
- centralized analytics
- unnecessary data collection

Users should remain in control of:

- notes
- bookmarks
- transcripts
- AI providers
- exported data

---

# Governance

The protocol should eventually move beyond a single GitHub repository.

Possible governance models include:

- W3C Community Group
- OpenJS Foundation
- Linux Foundation
- Open Source Initiative community
- independent GitHub organization

The exact governance model is less important than ensuring:

- transparent decision making
- open participation
- multiple implementations
- public issue tracking
- consensus-based evolution

No single organization should control the future of the protocol.

---

# Community

Success depends on participation from many communities.

Potential collaborators include:

- accessibility experts
- conference organizers
- educators
- open source communities
- browser vendors
- AI researchers
- digital preservation specialists
- standards organizations

The protocol should solve real problems experienced by presenters and attendees.

---

# Documentation

Publish documentation aimed at different audiences.

## Users

How the companion improves presentations.

## Presenters

How to enable companion support.

## Developers

How to implement the protocol.

## Accessibility Professionals

How companion applications improve accessibility.

## Conference Organizers

How to deploy and support companion services.

---

# Adoption Strategy

The project should grow through practical implementations rather than formal specification work alone.

Suggested progression:

1. Markdown Slides Editor demonstrates the ideas.
2. Additional presentation systems experiment with compatibility.
3. Common protocol elements emerge.
4. The specification stabilizes.
5. Governance broadens.
6. Multiple interoperable implementations become available.

Real-world experience should shape the standard.

---

# Open Questions

## Governance

Where should the specification ultimately live?

---

## Versioning

How should protocol evolution be managed?

---

## Extensions

How can vendors add new event types without fragmenting the ecosystem?

---

## Compatibility

What level of backward compatibility should be expected?

---

## Certification

Should implementations be able to claim compliance?

Should an interoperability test suite exist?

---

## Relationship to Existing Standards

How can the protocol build upon:

- HTML
- ARIA
- WebRTC
- WebSockets
- ActivityPub
- JSON-LD
- RDF
- Web Speech APIs

without duplicating existing work?

---

# Stretch Goals

Future possibilities include:

- digital museum guides
- classroom companions
- government consultation platforms
- hybrid meeting systems
- public hearings
- accessibility overlays
- collaborative learning environments
- multilingual community events

These demonstrate that the protocol is broader than presentations alone.

---

# Risks

## Premature Standardization

The protocol should not be standardized before there is implementation experience.

Real software should guide the specification.

---

## Overengineering

The protocol should remain simple.

Only common capabilities should become part of the core standard.

Specialized features should remain optional extensions.

---

## Fragmentation

Too many incompatible extensions would reduce interoperability.

The core protocol should remain stable and well documented.

---

## Vendor Influence

No single company or project should dominate the protocol.

Multiple independent implementations should remain a core objective.

---

# Measuring Success

Success is **not** measured by:

- GitHub stars
- downloads
- AI features
- the number of capabilities in Markdown Slides Editor

Success is measured by questions like:

- Can attendees use the same companion with different presentation software?
- Can presenters choose their preferred tools without losing accessibility?
- Can conference organizers deploy companion services without vendor lock-in?
- Can developers build new tools without asking permission?
- Have accessibility, privacy, and interoperability improved?

If the answer to those questions becomes "yes," then the Open Presentation Companion has achieved its purpose.

---

# Looking Beyond Markdown Slides Editor

Markdown Slides Editor began this journey by exploring browser-based speech recognition, accessible authoring, and AI-assisted presentation workflows.

Those ideas naturally evolved into a broader question:

> What if presentations themselves were open, interactive, accessible, and interoperable?

This milestone is the point where that question becomes a community effort rather than a single project's roadmap.

The hope is that Markdown Slides Editor will be remembered not simply as another presentation tool, but as one of the first practical demonstrations that presentations can become part of the open web, where every attendee has a personalized, accessible companion experience regardless of the software used to create the presentation.
