# Milestone 1: Live Companion

## Goal

Enable audience members to join a live presentation from their own device using nothing more than a browser.

This milestone focuses on delivering immediate accessibility improvements through live captioning while establishing the architecture that future features can build upon.

The objective is not to create a complete conference platform. It is to establish a simple, reliable foundation that can later support richer interaction.

---

# User Story

A presenter begins a presentation.

A QR code and short session code appear on the title slide or can be displayed on demand.

An attendee scans the QR code or enters the session code.

Their browser immediately connects to the presentation.

Within seconds they receive:

- live captions
- the current slide number
- the current presentation title
- accessibility preferences stored on their own device

No application needs to be installed.

No account needs to be created.

The presenter continues presenting exactly as they normally would.

---

# Goals

Deliver a useful accessibility improvement with minimal additional effort for presenters.

Build an architecture that can later support:

- translations
- synchronized slides
- resources
- questions
- polls
- AI features

without requiring major redesign.

---

# Success Criteria

A presenter can:

- start a presentation
- enable a live companion
- display a QR code
- broadcast captions

An attendee can:

- join in less than 30 seconds
- receive captions with low latency
- adjust presentation preferences
- reconnect automatically if the connection drops

---

# Scope

## Included

- QR code generation
- Short session codes
- Browser-based audience companion
- Live caption distribution
- WebSocket communication
- Caption history
- Personal display preferences
- Automatic reconnect

## Not Included

- Translation
- Polls
- Questions
- AI summaries
- Speaker identification
- Authentication
- Conference management

Those belong to later milestones.

---

# Architecture

```
Presenter Browser
    │
    │ Speech-to-Text
    ▼
Caption Stream
    │
    ▼
Cloudflare Worker
    │
    ▼
Durable Object
    │
    ├──────────────┐
    ▼              ▼
Audience        Audience
Browser         Browser
```

Speech recognition remains inside the presenter's browser.

Only caption events are transmitted.

This minimizes bandwidth while preserving privacy.

---

# Why WebSockets?

Although Server-Sent Events could support one-way caption delivery, WebSockets establish the communication model required for future milestones.

Future capabilities include:

- audience questions
- live polls
- reactions
- moderation
- synchronized resources
- presenter feedback

Using WebSockets from the beginning avoids replacing the transport layer later.

---

# Session Lifecycle

## Presenter

Creates a presentation session.

Receives:

- Session ID
- QR code
- Short join code

Example:

```
https://slides.example.org/session/A4PK

Join code:

A4PK
```

---

## Audience

Connects using:

- QR code
- short session code
- direct URL

Immediately receives:

- latest caption buffer
- current slide
- presentation metadata

---

## End Session

Presenter ends the presentation.

Audience members may:

- keep transcript
- export notes
- disconnect

The session is removed from the relay server after a configurable timeout.

---

# Caption Events

The first milestone intentionally keeps the protocol simple.

Example:

```json
{
  "type": "caption",
  "id": "seg-102",
  "timestamp": 1751909322,
  "text": "Welcome everyone.",
  "final": true,
  "language": "en"
}
```

Only finalized captions are initially transmitted.

Future milestones may also support interim captions.

---

# Audience Companion

The audience interface should remain intentionally minimal.

Features include:

- live captions
- pause scrolling
- resume live
- font size adjustment
- dark mode
- light mode
- high contrast
- caption history
- connection status

Preferences should be stored locally using browser storage.

---

# Presenter Experience

Presenters should not need to think about infrastructure.

The workflow should be:

1. Open presentation.
2. Enable Live Companion.
3. Display QR code.
4. Present normally.

Speech-to-text continues working exactly as it does today.

---

# Infrastructure

Initial investigation should focus on:

## Cloudflare Workers

HTTP endpoints.

---

## Durable Objects

Session management.

Caption fan-out.

Shared state.

---

## WebSockets

Low-latency event delivery.

---

## Browser Storage

Persist:

- theme
- font size
- accessibility preferences

without requiring user accounts.

---

# Accessibility

The companion itself should meet high accessibility standards.

Requirements include:

- full keyboard support
- screen reader compatibility
- responsive layout
- high contrast support
- zoom up to 400%
- reduced motion support
- semantic HTML
- accessible status updates

Accessibility is a requirement, not a future enhancement.

---

# Open Questions

## Session IDs

Random IDs?

Human-friendly codes?

Both?

---

## QR Codes

Should the QR code update if the session changes?

Should it always be visible?

Should presenters control when it appears?

---

## Caption History

How many previous captions should be retained?

30 seconds?

2 minutes?

Entire presentation?

---

## Reconnection

How much history should a reconnecting attendee receive?

---

## Local Network

Can the companion work entirely on a local Wi-Fi network?

Could conference venues avoid external internet entirely?

---

## Privacy

Should caption data ever be stored on the server?

Or should the relay only maintain temporary in-memory state?

---

# Stretch Goals

If implementation is straightforward, investigate:

- slide synchronization
- presenter avatar
- presentation metadata
- browser notifications when reconnecting

These should not delay completion of the milestone.

---

# Related Vision

This milestone implements the first practical step toward the ideas described in:

```
docs/vision/OPEN_PRESENTATION_COMPANION.md
```

The goal is not simply to display captions on another screen.

It is to demonstrate that a browser can become every attendee's personal presentation companion while laying the groundwork for a broader, interoperable ecosystem.
