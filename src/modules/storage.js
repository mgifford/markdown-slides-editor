export const STORAGE_KEY = "markdown-slides-editor.deck";

export const DEFAULT_SOURCE = `---
title: Markdown Slides Editor demo deck
lang: en
theme: default-high-contrast
durationMinutes: 20
slideWidth: 1280
slideHeight: 720
themeStylesheet:
titleSlide: true
subtitle: A starter deck that shows the main slide patterns
date: 2026-03-22
location: Toronto
speakers: Alex Example; Sam Example
closingSlide: true
closingTitle: Questions?
closingPrompt: Thanks for following along. Here is how to keep the conversation going.
contactUrl: https://example.com/slides
socialLinks: Mastodon @example; Bluesky @example.com
presentationUrl: https://example.com/slides/demo-deck
---

# Just text

This is a simple text slide. Use it when one clear idea deserves the full attention of the room.

Note:
Keep text slides short enough that they can be read quickly without pressure.

---

# Big statement

::center
**One clear idea is more powerful than ten crowded bullet points.**
::

Note:
A big statement slide works well as a transition between sections or to emphasise a key principle.

---

# Key number

::center
**73%**

of people retain a message better when it is paired with one strong visual.
::

Note:
Lead with the number, then give the single sentence that makes it meaningful.

---

# Quote or callout

::quote
Accessibility is a quality issue, not a feature request.
::

::callout
Use callouts when you want a strong takeaway to stand out visually.
::

Note:
Quotes and callouts are useful when you want emphasis without adding a dense block of bullets.

---

# Bullets

- Start with the core point
- [>] Reveal a supporting detail when you are ready
- [>] Keep bullets short enough to scan quickly
- [>] Split crowded slides before they become hard to read

Note:
Progressive disclosure can help you pace the room without putting every detail on screen at once.

---

# Numbered steps

1. Define the goal clearly
2. Identify the audience and their needs
3. Draft the key message for each slide
4. Review for density and cut where possible
5. Add speaker notes for every slide

Note:
Use numbered lists when order matters — processes, instructions, or ranked priorities.

---

# Text and bullets

Slides can mix a short paragraph with a list when that helps provide context.

- Introduce the idea
- Support it with two or three points
- Leave the deeper detail for notes or script

Resources:
- [Accessible Presentations](https://www.w3.org/WAI/presentations/)

Script:
If you need a fuller written script for delivery support or advance sharing, include it here instead of putting all of that text on the slide.

---

# Before and after

::column-left
## Before

- Dense walls of text
- Small fonts hard to read
- No clear hierarchy
::

::column-right
## After

- One idea per slide
- Readable font sizes
- Clear headings and short bullets
::

Note:
Before-and-after columns work well for comparisons, improvements, or contrasting perspectives.

---

# Centered content

::center
![Abstract blue and orange title graphic with accessible slides text](https://dummyimage.com/720x240/0b3d91/ffffff.png&text=Accessible+slides)
::

::center
A centered image or statement works well when you want a simple visual moment.
::

---

# Image only

::center
![Wide panoramic photograph of a conference room with a projected slide on screen](https://dummyimage.com/1280x540/102542/dae8f5.png&text=Visual+moment)
::

Note:
A full-width image with no body text is a strong way to open or close a section, or to let a photograph speak for itself.

---

# Left and right columns

::column-left
## Left column

- Primary points
- Short bullets
- Main argument
::

::column-right
## Right column

Supporting text, examples, references, or a short quote can live here.
::

Note:
Columns work best when both sides stay balanced and readable.

---

# Image with supporting text

::media-right
![Screenshot placeholder showing a slide editor beside a preview](https://dummyimage.com/520x360/dae8f5/102542.png&text=Editor+preview)
---
Use media layouts when a visual and a short explanation need to sit together on one slide.

- Keep the image relevant
- Give it meaningful alt text
- Avoid crowding the companion text
::

---

# Questions for the audience

- What is the single idea people should remember?
- What references should travel with the deck?
- What belongs on the slide, and what belongs in notes?

Note:
Question slides can invite interaction without needing a special visual treatment.

---

# Resources and follow-up

- [WCAG 2.2 Overview](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [WAI Presentations Guidance](https://www.w3.org/WAI/presentations/)
- [Intopia: How to create more accessible presentations](https://intopia.digital/articles/how-to-create-more-accessible-presentations/)
- [Inklusiv](https://inklusiv.ca/)

Note:
Replace this sample deck with your own material, but keep the patterns that help you present clearly.
`;

const DB_NAME = "markdown-slides-editor";
const STORE_NAME = "documents";

function hasIndexedDB() {
  return typeof indexedDB !== "undefined";
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(mode, callback) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = callback(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveSource(key, value) {
  if (!hasIndexedDB()) {
    localStorage.setItem(key, value);
    return;
  }

  await withStore("readwrite", (store) => store.put(value, key));
}

export async function loadSource(key) {
  if (!hasIndexedDB()) {
    return localStorage.getItem(key);
  }

  return withStore("readonly", (store) => store.get(key));
}

export async function removeSource(key) {
  if (!hasIndexedDB()) {
    localStorage.removeItem(key);
    return;
  }

  await withStore("readwrite", (store) => store.delete(key));
}

export async function clearStoredDocuments() {
  if (!hasIndexedDB()) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  await withStore("readwrite", (store) => store.clear());
}
