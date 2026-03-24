# Cloudflare Sync Plan

This document describes a practical implementation plan for adding optional Cloudflare-backed save, load, and comment support to `markdown-slides-editor`.

The goal is to extend the current local-first editor, not replace it.

## Why this exists

The editor already works well as a static GitHub Pages app with browser-local storage.

What it does not yet provide is:

- optional online save/load across devices
- authenticated commenting
- a lightweight collaboration layer
- a place to store AI or reviewer suggestions without pushing to Git

Cloudflare Workers plus D1 are a strong fit for that gap because they can provide:

- a small HTTP API
- SQL-backed storage
- GitHub-authenticated identity
- low-cost hosting
- a clean separation between the static editor and optional cloud services

## Product constraints

This integration must preserve the existing product principles.

Required constraints:

- the editor must still work fully without Cloudflare
- GitHub Pages remains the baseline deployment target
- browser-local save remains the default
- online save must be optional, not mandatory
- AI and comment features must remain clearly disclosed and capability-based
- users must not be misled into thinking local autosave is cloud sync

## Recommended architecture

The recommended model is:

- GitHub Pages hosts the editor UI
- a Cloudflare Worker provides API endpoints
- Cloudflare D1 stores decks, revisions, and comments
- GitHub OAuth provides user identity
- the Worker issues a secure session cookie after OAuth

This keeps the browser app simple:

- no Git commits
- no repo writes
- no required backend for baseline use
- optional authenticated save when configured

## Do not return raw GitHub tokens to the browser

The earlier sample pattern of returning the OAuth access token to `window.opener` is useful for experimentation, but it should not be the maintained implementation here.

Recommended production model:

1. the editor opens the Worker login URL
2. GitHub redirects back to the Worker callback
3. the Worker exchanges the code for a GitHub access token
4. the Worker fetches the GitHub user profile
5. the Worker creates a signed session
6. the Worker sets an `HttpOnly`, `Secure`, `SameSite=Lax` cookie
7. the Worker redirects or posts a lightweight success signal back to the editor

This avoids:

- storing a GitHub token in `localStorage`
- exposing the token to browser scripts
- broadening the impact of an XSS issue

## Proposed data model

The pasted `slides` and `comments` tables are a reasonable start, but this repo will likely need a slightly richer schema.

### Decks

```sql
CREATE TABLE decks (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  title TEXT,
  slug TEXT,
  markdown_content TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private',
  theme TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Revisions

```sql
CREATE TABLE deck_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deck_id TEXT NOT NULL,
  saved_by TEXT NOT NULL,
  markdown_content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Comments

```sql
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deck_id TEXT NOT NULL,
  github_handle TEXT NOT NULL,
  content TEXT NOT NULL,
  slide_index INTEGER,
  reveal_index INTEGER,
  selection_start INTEGER,
  selection_end INTEGER,
  status TEXT NOT NULL DEFAULT 'open',
  source TEXT NOT NULL DEFAULT 'human',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Why this is better:

- decks are more explicit than generic `slides`
- revisions create a foundation for history and rollback
- comments can later support AI suggestions as well as human review
- `visibility` allows a deliberate privacy model

## Visibility model

This needs to be explicit before implementation.

Recommended first model:

- `private`: only owner can load/edit
- `shared`: anyone with the link can read, only owner can edit/comment unless policy changes
- `public`: readable by anyone

Do not leave load behavior ambiguous.

The earlier example exposed `/load/:id` without an ownership check. That should not be the default here.

## Recommended API shape

Use resource-oriented routes rather than only `save/load/comment`.

### Auth

- `GET /auth/login`
- `GET /auth/callback`
- `POST /auth/logout`
- `GET /me`

### Decks

- `POST /decks`
- `GET /decks/:id`
- `PUT /decks/:id`
- `GET /decks/:id/revisions`

### Comments

- `GET /decks/:id/comments`
- `POST /decks/:id/comments`
- `PATCH /comments/:id`

This is easier to extend once the app supports comments, suggestions, history, or deck settings.

## CORS and origin model

The Worker should restrict requests to the deployed editor origins.

Expected origins:

- `https://mgifford.github.io`
- optionally `http://localhost:4173` for development

Recommended:

- configure allowed origins explicitly
- echo only validated origins
- include `Vary: Origin`
- handle `OPTIONS` cleanly

## Session model

Recommended Worker session behavior:

- sign session payloads with a Worker secret
- store session state server-side or use signed, short-lived stateless cookies
- keep session TTL conservative
- include logout support
- rotate secrets carefully

If session complexity grows, consider using Workers KV or Durable Objects for session metadata, but D1 plus signed cookies is likely enough for the first version.

## Browser integration plan

The editor should add online save as an optional capability layer.

### New UI states

- `Login with GitHub`
- `Save online`
- `Open online deck`
- `Comments`
- `Online status`

Only show these when the app is configured with a Worker endpoint.

### Local-first behavior

The app should continue to:

- autosave locally without login
- export regardless of online state
- work fully when the Worker is unavailable

Online save should feel like an enhancement, not a replacement for local work.

## Suggested implementation phases

### Phase 1: Authenticated cloud save/load

Build:

- Worker with GitHub OAuth
- secure session cookie
- `POST /decks`
- `PUT /decks/:id`
- `GET /decks/:id`
- minimal deck ownership checks
- optional editor UI for login/save/load

User value:

- one person can move decks across devices

### Phase 2: Revisions and online deck picker

Build:

- `deck_revisions`
- save history
- deck list for the current user
- restore previous revision

User value:

- safer experimentation
- less fear of losing cloud-saved work

### Phase 3: Comments

Build:

- comment API
- per-slide comments
- comment display in editor support UI
- comment composer

User value:

- collaboration without Git
- notes and review attached to the deck

### Phase 4: AI suggestion comments

Build:

- `source='ai'` comment support
- comment-style AI recommendations
- accept/reject/apply workflow

User value:

- AI review without destructive overwrites

## Security requirements

Before shipping, ensure:

- no raw GitHub token is exposed to the frontend as the maintained path
- ownership checks exist for deck reads and writes
- comments require authenticated identity if that is the chosen policy
- inputs are validated and length-limited
- rate limiting exists for auth and write endpoints
- SQL is always parameterized
- secrets are stored via Worker secrets, not source control

## Repo impact

This integration would likely add:

- a separate `cloudflare-worker/` or `worker/` directory
- Worker-specific docs
- optional editor config for the Worker base URL
- new modules for session and cloud API calls
- new UI for login/save/load/comments

Recommended structure:

- keep Worker code separate from the static editor runtime
- keep the browser app usable without that directory deployed

## Recommended configuration model

The browser app should not hardcode a Worker URL.

Better options:

- a small config object in `localStorage`
- a local `config.json`
- front matter only for deck-specific metadata, not deployment settings

App-level deployment config is a better fit than deck front matter for this.

## Relationship to existing features

This plan complements the current feature set:

- local browser save remains the default
- ZIP export remains the canonical handoff path
- presenter and audience views are unchanged
- comments can later connect to AI review workflows already envisioned in the repo docs

## Recommendation

This is a good direction for the project if it is implemented as an optional cloud enhancement.

The right first slice is:

1. secure GitHub login via Worker session cookie
2. optional cloud save/load
3. local-first fallback preserved at all times

Do not start with:

- raw GitHub token storage in the browser
- public-by-default deck reads
- comments before ownership and save/load are stable

## Related documents

- [README.md](/Users/mike.gifford/markdown-slides-editor/README.md)
- [FEATURES.md](/Users/mike.gifford/markdown-slides-editor/FEATURES.md)
- [AGENTS.md](/Users/mike.gifford/markdown-slides-editor/AGENTS.md)
- [docs/editor-vision.md](/Users/mike.gifford/markdown-slides-editor/docs/editor-vision.md)
- [docs/ai-authoring-workflow.md](/Users/mike.gifford/markdown-slides-editor/docs/ai-authoring-workflow.md)
