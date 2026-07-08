# Milestone 4: Intelligent Companion

## Goal

Help attendees remember, understand, and act on what they learned.

This milestone uses AI to assist attendees after and during a presentation without replacing the speaker or collecting unnecessary personal information.

The focus is on **personal knowledge management**, not simply AI-generated summaries.

Every attendee should leave with a personalized record of the presentations they attended.

---

# User Story

An attendee has spent a day at a conference.

Throughout the day they have accumulated:

- captions
- bookmarks
- questions
- resources
- glossary terms
- image descriptions
- presentation metadata

Instead of manually organizing everything, they ask:

> "Summarize today's talks."

or

> "What were the main themes about AI governance?"

or

> "Create a follow-up email for my team."

The companion uses the attendee's own presentation history to generate answers.

---

# Goals

Help attendees:

- retain information
- organize notes
- discover relationships between presentations
- review talks later
- prepare reports
- share knowledge

Whenever practical, AI should operate on the attendee's own device.

---

# Success Criteria

An attendee can:

- generate summaries
- search previous presentations
- organize bookmarks
- compare presentations
- export notes
- choose their preferred AI provider

The system should remain useful even if AI features are disabled.

---

# Scope

## Included

- personal summaries
- transcript search
- AI prompts
- local knowledge base
- Markdown export
- structured presentation archive
- user-selected AI providers

## Not Included

- mandatory cloud AI
- conference analytics
- recommendation engines
- advertising
- user profiling

---

# Architecture

```
Presentation Archive
        │
        ▼
 Local Knowledge Store
        │
        ▼
 Search
        │
        ▼
 AI Assistant
        │
        ▼
 User
```

The AI operates on information already collected by previous milestones.

No additional data collection is required.

---

# Personal Presentation Archive

Each completed presentation becomes a structured record.

Example:

```text
Presentation
├── Metadata
├── Transcript
├── Resources
├── Glossary
├── Image Descriptions
├── Questions
├── Poll Results
├── Bookmarks
└── Notes
```

The archive should remain under the attendee's control.

---

# AI Summaries

Attendees may request summaries such as:

- five bullet points
- executive summary
- technical summary
- beginner summary
- action items
- key quotations
- references

Summaries should always be generated from the attendee's own copy of the presentation whenever practical.

---

# Search

Support searching across:

- captions
- notes
- bookmarks
- glossary
- resources
- image descriptions
- presentation titles
- presenters

Example queries:

> Which presentations mentioned accessibility?

> Find every talk about WebRTC.

> Which speaker discussed local AI?

---

# Presentation Comparison

Attendees may compare multiple presentations.

Examples:

- Compare today's accessibility talks.
- What ideas appeared in both presentations?
- Which talks discussed open standards?
- Show conflicting viewpoints.

---

# Knowledge Graph

As more presentations are collected, the companion begins connecting ideas.

Relationships may include:

- presenters
- organizations
- projects
- standards
- technologies
- people
- recurring themes

This creates a personal knowledge graph rather than isolated transcripts.

---

# AI Assistant

Possible prompts include:

## Understanding

- Explain this concept.
- Simplify this section.
- Define unfamiliar terminology.

---

## Review

- What were my biggest takeaways?
- What should I read next?
- What questions remain unanswered?

---

## Writing

- Draft a blog post.
- Create meeting notes.
- Write a LinkedIn post.
- Prepare a report for my team.

---

## Research

- Compare these talks.
- Find disagreements.
- Identify recurring themes.
- Build a reading list.

---

# AI Providers

Users should choose their preferred provider.

Possible options include:

## Local Models

- Ollama
- llama.cpp
- browser models

---

## Hosted Models

- OpenAI
- Anthropic
- Google
- Mistral
- Hugging Face
- user-defined endpoints

The companion should not require a particular vendor.

---

# Prompt Templates

The system should include reusable prompt templates.

Examples:

- conference summary
- social media post
- meeting notes
- action items
- blog article
- executive briefing
- accessibility review

Templates should be editable.

---

# Export

Attendees should be able to export:

- Markdown
- HTML
- PDF
- JSON
- plain text

The archive should remain portable.

---

# Local Knowledge Base

Rather than simply saving transcripts, the companion should help users build a long-term personal knowledge base.

Possible organization:

```
Conference
    ├── Sessions
    ├── Presenters
    ├── Topics
    ├── Notes
    ├── Resources
    └── Summaries
```

Over time this becomes a searchable personal library.

---

# Privacy

Privacy becomes even more important once AI is introduced.

The companion should follow these principles:

- local-first whenever practical
- user chooses AI provider
- no automatic uploads
- transparent prompts
- exportable data
- easy deletion

Users should understand exactly what information is sent to an external AI service.

---

# Accessibility

AI should improve accessibility rather than complicate it.

Examples include:

- simplify technical language
- explain jargon
- summarize long discussions
- generate easy-read versions
- translate notes
- answer questions about the presentation

Accessibility remains the primary goal.

---

# Open Questions

## Local Storage

How should presentation archives be stored?

Possible approaches:

- IndexedDB
- browser filesystem
- local files
- synchronized cloud storage

---

## Embeddings

Should semantic search use:

- browser embeddings?
- local models?
- external services?

---

## Vector Search

Should every presentation automatically generate embeddings?

Or should this happen on demand?

---

## Prompt Library

Should prompt templates be:

- built in?
- community contributed?
- downloadable?

---

## AI Transparency

How should prompts and model choices be presented to users?

---

## Offline Operation

Can all AI features work without internet access if a local model is available?

---

# Stretch Goals

If implementation is straightforward, investigate:

- local RAG
- semantic search
- timeline visualization
- concept maps
- flashcards
- spaced repetition
- citation generation
- multilingual summaries

These should not delay completion of the milestone.

---

# Risks

## AI Hallucinations

Generated summaries may be inaccurate.

Users should always have access to the original transcript and supporting material.

---

## Vendor Lock-in

The project should never depend on a single AI provider.

---

## Privacy

Users must remain in control of their own presentation history.

---

## Complexity

The companion should continue working well for users who never enable AI.

AI should remain an enhancement, not a dependency.

---

# Relationship to Future Milestones

This milestone demonstrates how structured presentation data can become long-term knowledge.

The final milestone focuses on moving beyond Markdown Slides Editor and establishing an open standard that allows many presentation systems to participate in the same ecosystem.

---

# Related Vision

This milestone advances the ideas described in:

```text
docs/vision/OPEN_PRESENTATION_COMPANION.md
```

The previous milestones established a live, accessible, interactive presentation companion.

Milestone 4 turns that companion into a personal learning assistant that helps attendees understand, retain, organize, and share what they have learned while preserving user choice, privacy, and interoperability.

Ultimately, the goal is not to build "AI for presentations."

It is to help people learn more effectively from presentations using open web technologies and AI that remains under the attendee's control.
