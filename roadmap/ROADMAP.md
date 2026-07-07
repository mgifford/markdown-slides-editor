# Roadmap

This roadmap describes the planned evolution of **Markdown Slides Editor**.

The project began as a Markdown-first presentation editor with an emphasis on accessible authoring, browser-based speech-to-text, and AI-assisted presentation workflows.

The long-term vision is considerably broader.

Rather than becoming another presentation application, Markdown Slides Editor aims to become a reference implementation for an **Open Presentation Companion**: an open, browser-based ecosystem that improves accessibility, learning, and audience engagement across many presentation platforms.

This roadmap intentionally separates **today's implementation** from the **long-term vision**.

---

# Current Status

Today the project already provides a number of capabilities that are uncommon in presentation software.

## Presentation Authoring

- Markdown-first editing
- Live preview
- Browser-based presentation mode
- Speaker notes
- Theme support
- Static presentation export

## Speech-to-Text

- Browser speech recognition
- Local Whisper.cpp support
- Live captions
- Transcript generation
- AI-ready transcript prompts

## AI Workflows

Presenters can immediately use their transcript together with their slide deck to:

- generate presentation summaries
- write articles
- produce social media posts
- create follow-up documentation
- refine transcripts
- generate AI prompts

This significantly reduces the work required after giving a presentation.

---

# Guiding Principles

Every new feature should support one or more of these goals.

## Accessibility First

Accessibility is a core requirement.

It should never be treated as an optional enhancement.

---

## Browser First

Modern browsers continue to become more capable.

Whenever practical, features should work without requiring native applications.

---

## Local First

Processing should happen locally whenever practical.

This improves:

- privacy
- performance
- resilience
- sustainability
- cost

Cloud services should enhance local functionality rather than replace it.

---

## Open Standards

The project should build on existing web standards wherever possible.

Where standards do not exist, new ones should be developed in the open.

The long-term goal is interoperability between many presentation systems, not exclusive features within Markdown Slides Editor.

---

## Progressive Enhancement

The editor should remain useful without AI.

The companion should remain useful without cloud services.

Every feature should degrade gracefully.

---

## Small, Independent Features

Large architectural changes should be avoided.

Features should be implemented incrementally.

Each milestone should deliver real user value.

---

# Milestone 1: Live Companion

## Goal

Allow audience members to join a presentation from their own device.

The companion should initially focus on accessibility through live captions.

## User Experience

The presenter starts a presentation.

A QR code appears.

Audience members scan the code or enter a short session code.

Their browser connects to the live session.

They immediately receive:

- live captions
- current presentation state
- personalization settings

No installation required.

No accounts required.

## Features

### Session Management

- presentation session IDs
- QR code generation
- short join codes
- reconnect support
- session lifecycle

### Caption Distribution

- publish browser-generated captions
- distribute captions using WebSockets
- support late joins
- reconnect automatically
- maintain a short caption history

### Audience Companion

- responsive interface
- adjustable font size
- dark mode
- high contrast
- caption history
- pause scrolling
- local preferences

### Infrastructure

Investigate:

- Cloudflare Workers
- Durable Objects
- WebSockets
- Server-Sent Events

The implementation should remain transport-independent wherever possible.

---

# Milestone 2: Accessible Companion

## Goal

Move beyond captions.

Support richer accessibility information synchronized with the presentation.

## Features

### Slide Synchronization

Audience devices know:

- current slide
- presentation progress
- slide titles

Late arrivals synchronize automatically.

---

### Resources

Presenters publish:

- URLs
- GitHub repositories
- PDFs
- standards
- videos
- references

Resources appear on audience devices automatically.

---

### Glossary

Presenters define:

- acronyms
- technical terminology
- organizations
- people
- projects

Audience members can expand unfamiliar terms without interrupting the presentation.

---

### Image Descriptions

Presenters optionally provide synchronized image descriptions.

Audience members may:

- display descriptions
- read them aloud
- translate them
- save them

---

### Personalization

Audience members choose:

- preferred language
- font size
- colour theme
- reduced motion
- caption behaviour

These preferences remain on the attendee's device.

---

# Milestone 3: Interactive Companion

## Goal

Turn presentations into two-way experiences.

## Features

### Questions

Audience members submit questions.

Possible modes:

- anonymous
- identified
- moderated
- voting

---

### Polls

Support:

- live polls
- multiple choice
- ratings
- quizzes

Results appear immediately.

---

### Reactions

Simple interaction:

- applause
- slower please
- faster please
- confused
- interesting

Useful for remote and hybrid events.

---

### Shared Notes

Audience members create bookmarks.

Bookmarks include:

- slide
- timestamp
- transcript
- personal notes

---

### Conference Memory

Each attendee builds a personal record of presentations attended.

This history remains local whenever practical.

---

# Milestone 4: Intelligent Companion

## Goal

Use AI to help attendees retain and understand information.

AI should assist rather than replace the presentation experience.

## Features

### Local Summaries

Generate:

- presentation summaries
- key points
- action items

---

### Transcript Search

Search:

- captions
- notes
- bookmarks

---

### Personal Knowledge Base

Allow attendees to build a searchable archive of:

- presentations
- notes
- bookmarks
- summaries

---

### AI Assistant

Possible prompts include:

- explain this concept
- compare today's talks
- generate meeting notes
- write a social media post
- create follow-up questions

Whenever practical these should use local models or user-selected AI services.

---

# Milestone 5: Open Presentation Companion

## Goal

Separate the ideas from the implementation.

Markdown Slides Editor should become one implementation of a broader open ecosystem.

## Activities

Develop:

- event model
- JSON schema
- protocol documentation
- reference libraries
- interoperability tests

Support implementations for:

- Markdown Slides Editor
- Reveal.js
- Marp
- Slidev
- Quarto
- PowerPoint
- Keynote
- Google Slides

Encourage community participation.

Explore governance through an open standards organization, W3C Community Group, OpenJS Foundation, or similar collaborative venue.

---

# Future Ideas

The following ideas are intentionally not scheduled.

They should be explored through prototypes and community discussion.

## Live Translation

Translate captions into attendee-selected languages.

Possible implementations:

- browser APIs
- local models
- user-selected AI providers
- hosted translation services

---

## Multi-Speaker Conversations

Support:

- meetings
- workshops
- hallway discussions
- networking events

Investigate:

- speaker identification
- multiple microphones
- synchronized transcripts

---

## Hybrid Conferences

Support both in-person and remote attendees equally.

---

## Museum and Exhibition Guides

Use the same protocol to provide:

- exhibit descriptions
- translations
- accessibility information

---

## Education

Support:

- lectures
- classrooms
- online teaching
- workshops

---

## Government Meetings

Support:

- council meetings
- consultations
- parliamentary committees
- public hearings

---

## Offline Operation

Improve functionality when internet access is unavailable.

Possible approaches include:

- local WebSocket servers
- peer-to-peer networking
- local AI models
- browser storage

---

# Relationship to the Open Presentation Companion

Markdown Slides Editor is expected to be the first reference implementation of the ideas described in:

> `docs/vision/OPEN_PRESENTATION_COMPANION.md`

Not every capability described in the vision belongs inside this repository.

Some ideas may eventually move into independent projects, shared libraries, or open standards.

Success is not measured by how many features this application contains.

Success is measured by whether the ideas become useful across many presentation tools.

---

# Contributing

Contributions should favor:

- small, focused pull requests
- progressive enhancement
- accessibility improvements
- browser standards
- interoperability
- privacy-preserving design

Large architectural changes should generally begin as GitHub Discussions before implementation.

The roadmap is intended to evolve.

As the project grows, milestones may be reordered, expanded, or split into dedicated design documents.
