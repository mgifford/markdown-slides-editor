# Milestone 3: Interactive Companion

## Goal

Transform the audience companion from a passive viewing experience into an interactive communication channel.

Presentations should no longer be limited to one-way communication.

This milestone introduces audience participation while respecting the flow of the presentation and maintaining accessibility as a first-class requirement.

The presenter remains in control of the session, while attendees gain meaningful opportunities to participate.

---

# User Story

An attendee joins a presentation using the companion.

They are already receiving:

- live captions
- synchronized slides
- resources
- glossary entries
- image descriptions

They can now:

- ask questions
- respond to polls
- bookmark important moments
- react when they are confused or want the presenter to slow down
- follow shared discussion threads

The presenter sees audience engagement without being overwhelmed.

---

# Goals

Improve communication between presenters and audiences.

Reduce barriers to participation.

Support attendees who may not feel comfortable asking questions publicly.

Provide useful feedback to presenters.

Lay the foundation for collaborative presentations.

---

# Success Criteria

Presenters can:

- publish polls
- receive audience questions
- moderate discussion
- see audience engagement
- answer questions during or after the presentation

Attendees can:

- submit questions
- answer polls
- bookmark moments
- react to the presentation
- participate anonymously if permitted

---

# Scope

## Included

- audience questions
- moderation
- live polls
- simple reactions
- bookmarks
- presentation timeline
- presenter dashboard

## Not Included

- AI moderation
- automatic translation
- multi-speaker conversations
- persistent user accounts
- conference-wide messaging

Those belong to later milestones.

---

# Architecture

```text
Presenter Browser
        │
        ▼
 Companion Publisher
        │
        ▼
 Companion Relay
   (WebSocket)
        │
 ┌──────┼───────────────┐
 ▼      ▼               ▼
Questions Polls     Reactions
        │
        ▼
 Presenter Dashboard
```

The communication channel is now bidirectional.

The presenter continues publishing events.

Audience members can also publish selected event types.

---

# Audience Questions

Attendees should be able to submit questions throughout the presentation.

Questions may be:

- anonymous
- identified
- moderated
- upvoted
- archived

Example:

```json
{
  "type": "question",
  "id": "q-42",
  "timestamp": 1751909450,
  "text": "Could this protocol work for museum exhibits?",
  "anonymous": true
}
```

Questions should appear in a moderation queue before being shown publicly unless moderation is disabled.

---

# Polls

Presenters should be able to create simple polls.

Example:

```json
{
  "type": "poll",
  "id": "poll-3",
  "question": "Have you used browser speech recognition before?",
  "options": [
    "Yes",
    "No"
  ]
}
```

Audience responses:

```json
{
  "type": "pollResponse",
  "poll": "poll-3",
  "answer": 0
}
```

Polls should support:

- multiple choice
- single choice
- ratings
- simple quizzes

---

# Reactions

Simple reactions allow presenters to gauge audience understanding without interrupting the presentation.

Possible reactions:

- 👍
- 👏
- ❤️
- 🤔
- 😕
- 🐢 Slow down
- 🚀 Speed up

These should remain intentionally lightweight.

The goal is communication rather than entertainment.

---

# Accessibility Feedback

Accessibility-specific reactions may prove especially valuable.

Examples include:

- captions too fast
- audio too quiet
- unable to read slide
- image needs description

Rather than generic emoji, these become actionable accessibility feedback.

Example:

```json
{
  "type": "feedback",
  "category": "captions",
  "value": "too_fast"
}
```

This could eventually allow presenters to adjust pacing in real time.

---

# Bookmarks

Attendees should be able to bookmark interesting moments.

Bookmarks automatically capture:

- timestamp
- slide
- caption
- optional personal note

Example:

```json
{
  "type": "bookmark",
  "slide": 18,
  "caption": "Open standards reduce long-term costs.",
  "timestamp": 1751909530
}
```

Bookmarks remain local unless explicitly exported.

---

# Presentation Timeline

The audience companion should begin constructing a timeline.

Each event contributes:

- slide changes
- captions
- bookmarks
- questions
- resources
- glossary entries

This timeline becomes useful for later searching and summarization.

---

# Presenter Dashboard

Presenters should receive a simple companion dashboard.

Possible panels:

## Questions

Pending questions.

Answered questions.

Popular questions.

---

## Poll Results

Live responses.

Participation rate.

---

## Audience Feedback

Examples:

- captions too small
- slow down
- repeat that
- microphone issue

Feedback should remain aggregated.

Presenters should not be overwhelmed by individual notifications.

---

# Moderation

Questions should support moderation.

Possible workflow:

```
Audience

↓

Question Queue

↓

Approve

↓

Visible to Presenter

↓

Answered

↓

Archived
```

Moderation may be performed by:

- presenter
- moderator
- conference staff

---

# Personal Conference Record

This milestone begins creating a richer conference experience.

Attendees may leave with:

- bookmarks
- answered questions
- poll responses
- transcript
- resources

Everything remains associated with the presentation.

---

# Accessibility Requirements

Interactive features must remain fully accessible.

Requirements include:

- keyboard navigation
- screen reader compatibility
- accessible forms
- semantic controls
- clear focus management
- live region announcements
- sufficient colour contrast

Interaction should never reduce accessibility.

---

# Privacy Requirements

Interaction should require the minimum amount of personal information.

Anonymous participation should remain possible.

Personal notes, bookmarks, and reading history should remain local unless explicitly shared.

Conference organizers should not need attendee accounts simply to support interaction.

---

# Open Questions

## Identity

Should users have names?

Random identifiers?

Remain anonymous?

---

## Moderation

Should moderation happen:

- locally?
- on the relay?
- through another moderator interface?

---

## Poll History

Should completed polls remain available?

Should they disappear after completion?

---

## Questions

Should audience members see one another's questions?

Should voting be supported?

Should duplicate questions merge automatically?

---

## Accessibility Feedback

Should accessibility feedback be private to the presenter?

Or visible to moderators?

---

## Notifications

How should presenters be notified without becoming distracted?

---

# Stretch Goals

If implementation is straightforward, investigate:

- threaded discussions
- presenter announcements
- collaborative note taking
- shared bookmarks
- session chat
- audience networking

These should not delay completion of the milestone.

---

# Risks

## Presenter Overload

Too much audience interaction may distract presenters.

The dashboard should prioritize important information.

---

## Abuse

Anonymous participation can be abused.

Moderation tools should be simple but effective.

---

## Interface Complexity

The audience companion should remain focused.

Interaction should enhance the presentation rather than becoming a social platform.

---

# Relationship to Future Milestones

This milestone creates the interactive communication layer that later AI features can build upon.

Future milestones may use:

- bookmarks
- questions
- poll responses
- accessibility feedback
- presentation timeline

to generate personalized summaries, searchable conference archives, and learning tools.

---

# Related Vision

This milestone advances the ideas described in:

```text
docs/vision/OPEN_PRESENTATION_COMPANION.md
```

Milestone 1 proved that live captions can be shared.

Milestone 2 demonstrated that structured presentation information can accompany the talk.

Milestone 3 establishes that presentations can become collaborative experiences while remaining browser-based, accessible, privacy-respecting, and built on open web technologies.
