# Speech-to-Text Architecture

This document describes how live speech-to-text works in this editor: where it runs, what code drives it, how the transcript is cleaned up with an LLM, and where whisper.cpp fits in.

---

## Overview

Speech-to-text in this project runs in three modes:

| Mode | Where it runs | Key module |
|---|---|---|
| Browser-native (Web Speech API) | Inside the browser (Chrome/Chromium) | `src/modules/speech-recognition.js` |
| Local whisper.cpp | Native binary on the captioning machine | `scripts/run-whisper.js` |
| External caption service | Any compatible polling endpoint | `src/modules/captions.js` |

All three modes converge in the **presenter view** (`src/modules/views/presenter-view.js`), which shows the live caption panel and broadcasts caption text to the audience window.

---

## Mode 1: Browser-native speech recognition

### How it works

The Web Speech API is a browser capability available in Chrome, Edge, Brave, and other Chromium-based browsers. It exposes a `SpeechRecognition` interface (or `webkitSpeechRecognition` in older Chromium builds) that streams audio from the device microphone to a cloud speech recognition service — Google's service in most Chromium builds — and returns recognised text as `SpeechRecognitionResult` events.

The editor wraps this API in `src/modules/speech-recognition.js`.

### The recognition object

```js
const recognition = new window.SpeechRecognition();
recognition.continuous = true;     // do not stop after one utterance
recognition.interimResults = true; // fire events for in-progress phrases, not just final ones
recognition.lang = "en-US";        // BCP 47 tag, persisted to localStorage
```

`continuous: true` keeps the recognition session open for the full duration of a presentation. `interimResults: true` means the panel updates live with words as they are being spoken, before the engine finalises them.

### The event loop

```
microphone audio
    └─> Chrome speech service (cloud)
            └─> recognition.onresult
                    ├─> result.isFinal = false → interim text (shown live, replaced as speech continues)
                    └─> result.isFinal = true  → final text  (accumulated in finalBuffer, kept for export)
```

`recognition.onend` fires when the recognition session closes (timeout, silence, or browser pause). Because `enabled` is still `true` after a natural session end, `onend` immediately calls `recognition.start()` again, making recognition effectively continuous for the life of a presentation without a captioning volunteer needing to restart it.

### Buffer management

The visible caption buffer (`finalBuffer`) is trimmed to the most recent 300 characters when it exceeds that limit. This keeps the on-screen caption text readable without overflow. The `fullTranscript` accumulator is not trimmed — it preserves the full session transcript for export.

### Language support

`CAPTION_LANGUAGES` in `speech-recognition.js` lists over 50 BCP 47 language tags. The selected language is stored in `localStorage` under `markdown-slides-editor.captionLanguage` and applied to `recognition.lang`. Changing the language while recognition is active calls `recognition.stop()`; the `onend` auto-restart picks up the new language.

### Availability check

```js
export function isSpeechRecognitionSupported() {
  return typeof window.SpeechRecognition !== "undefined" ||
         typeof window.webkitSpeechRecognition !== "undefined";
}
```

The caption panel and its controls are rendered in the presenter view only when this check returns `true`. No speech-to-text UI appears in Firefox, Safari, or other non-Chromium browsers.

### Privacy

Audio is processed by the browser's speech service (Google in standard Chrome builds). This editor does not send audio or transcripts to any server of its own. The recognised text is kept in browser memory for the duration of the session and exported only when the user explicitly clicks an export button.

---

## Mode 2: Local whisper.cpp transcription

`whisper.cpp` is a C++ port of OpenAI's Whisper model that runs entirely on the local machine. It produces higher-accuracy transcription than the Web Speech API and has no cloud dependency, which is appropriate for privacy-sensitive events.

### The bridge script

`scripts/run-whisper.js` is a thin Node.js wrapper around the `whisper-stream` binary from `whisper.cpp`. It:

1. Spawns `whisper-stream` with the configured model, threads, step interval, and language.
2. Reads stdout line by line, stripping timing and system log lines.
3. Accumulates the transcript in memory.
4. Writes `whisper-demo/transcript.json` every 200 ms (debounced):

```json
{
  "active": true,
  "generated": "2026-03-22T16:00:00Z",
  "text": "current live transcript text"
}
```

5. On shutdown (`SIGINT`/`SIGTERM`), writes a final payload with `"active": false`.

### How the editor reads it

The editor polls `transcript.json` via HTTP using `src/modules/captions.js`. On `localhost` the editor checks the default path `http://localhost:4173/whisper-demo/transcript.json` automatically. For other environments, the deck front matter configures the source:

```md
---
captionsProvider: whisper.cpp
captionsSource: http://localhost:4173/whisper-demo/transcript.json
---
```

### Testing without whisper installed

```bash
npm run dev:transcript -- --src ./some-transcript.txt
```

`scripts/whisper-transcript-watch.js` mirrors a plain text or JSON file into the expected transcript format on every change, so the polling display can be tested without a Whisper binary.

---

## Mode 3: External caption service

Any service that exposes the same JSON shape can be used as a caption source. Configure it in front matter:

```md
---
captionsProvider: service
captionsSource: https://captions.example.com/presentation/transcript.json
captionsPollMs: 2000
---
```

The polling interval defaults to 1500 ms and is configurable.

---

## Caption polling architecture (`src/modules/captions.js`)

This module handles the whisper.cpp and external service paths.

- `getCaptionConfig(metadata)` — reads front matter to build a config object with `{ enabled, source, provider, pollMs }`.
- `fetchCaptionState(config)` — fetches the source URL once and parses the JSON payload.
- `createCaptionMonitor(config, onUpdate)` — starts a `setInterval` loop at `pollMs` that calls `fetchCaptionState` and delivers updates to a callback. Stops when `source` is unavailable.

The monitor is started in `presenter-view.js` and updates the same caption panel used by the Web Speech API path.

---

## Transcript export (`src/modules/transcript-export.js`)

When using browser-native speech recognition, the presenter view exposes three export actions after text has been captured:

### Save as .VTT

`buildVttContent(segments)` converts the array of timestamped final-result segments accumulated by the recognition source into a WebVTT file. Each segment has a start and end offset in milliseconds from the start of the recognition session:

```
WEBVTT

1
00:00:04.120 --> 00:00:08.340
Welcome to this talk on accessible slide design.

2
00:00:08.340 --> 00:00:14.500
Today we will cover three main areas.
```

The resulting `.vtt` file can be used as a caption track for a recorded video of the presentation.

### Save as text

Downloads `transcript.txt` containing the full accumulated transcript as plain text, unprocessed. This is the raw recognition output.

### Copy cleanup prompt — the prompt engine

`buildTranscriptCleanupPrompt(rawTranscript, markdownSource)` generates a structured LLM prompt that contains:

1. **Instructions** — remove STT repetitions, fix badly recognised words, correct transcription grammar errors, format as readable paragraphs, preserve the speaker's intent.
2. **The deck Markdown source** — included as a reference block so the LLM can recognise slide-specific terminology, technical vocabulary, presenter names, and project names that the speech engine may have misheard.
3. **The raw transcript** — the full unedited text captured by the browser.

The result is a single copyable prompt intended to be pasted into Claude, ChatGPT, Gemini, Ollama, or any other LLM. The LLM uses the slide content as a grounding reference to produce a cleaned, readable transcript that preserves the meaning while correcting recognition artefacts.

**Why the Markdown source matters:** Speech recognition engines regularly mishear domain-specific terms, proper nouns, acronyms, and speaker names. Including the deck as context gives the LLM the correct spellings and vocabulary it needs to make accurate corrections — for example, knowing that "whisker" in the raw transcript should be "Whisper", or that "C-civic actions" is "CivicActions".

---

## BroadcastChannel audience sync

When the browser-native speech recognition source produces caption text, the presenter view broadcasts it to the audience window:

```js
sync.postMessage({ type: "caption-update", text: sttState.text, timestamp: Date.now() });
```

`sync` is the `BroadcastChannel` instance in `src/modules/sync.js`. The audience view (`presentation-view.js`) listens on the same channel and renders the caption text when it arrives. This is a same-origin in-browser channel — caption text does not leave the browser.

---

## Presenter view integration

`src/modules/views/presenter-view.js` wires all three paths together:

```
presenter-view.js
  ├─ createSpeechRecognitionSource()  → sttSource   (Web Speech API, Chromium only)
  ├─ createCaptionMonitor()           → captionMonitor  (polling, whisper.cpp / external)
  └─ captions panel
       ├─ hidden when neither source is active
       ├─ Web Speech controls (🎙 Turn On/Off, language select)
       ├─ Export buttons (Save as .VTT, Save as text, Copy cleanup prompt)
       └─ BroadcastChannel → audience window caption display
```

The panel is hidden by default and appears only when:

- `isSpeechRecognitionSupported()` returns `true` (Chromium) and the user turns captions on, **or**
- `captionConfig.enabled` is `true` (a `captionsSource` URL is configured) and the source responds successfully.

---

## Future: Whisper.cpp in the browser via WebAssembly

The current `whisper.cpp` path requires a native binary on the captioning machine and a separate Node.js helper process. A future path worth exploring is running `whisper.cpp` compiled to WebAssembly directly in the browser. This would:

- Eliminate the need for a separate process or server.
- Keep audio entirely on-device with no cloud dependency.
- Enable higher-accuracy offline transcription in any Chromium or Firefox browser.

Projects such as [whisper.cpp WASM builds](https://github.com/ggerganov/whisper.cpp/tree/master/examples/whisper.wasm) and [Transformers.js](https://huggingface.co/docs/transformers.js) (which includes Whisper) are the primary candidates to evaluate. The main constraints are the size of the model weights (the `base.en` model is approximately 140 MB) and the performance of WebAssembly audio processing on typical presentation hardware.

This is a tracked future direction in `TODO.md`. No in-browser AI is currently shipped in this project.

---

## Related files

| File | Purpose |
|---|---|
| `src/modules/speech-recognition.js` | Web Speech API wrapper, language persistence, segment tracking |
| `src/modules/captions.js` | Caption source config, JSON polling, caption monitor |
| `src/modules/transcript-export.js` | VTT formatter, LLM cleanup prompt builder |
| `src/modules/views/presenter-view.js` | Panel integration, BroadcastChannel sync, export button wiring |
| `src/modules/sync.js` | BroadcastChannel + localStorage fallback |
| `scripts/run-whisper.js` | whisper.cpp bridge — spawns whisper-stream, writes transcript.json |
| `scripts/whisper-transcript-watch.js` | Dev helper — mirrors a text file into transcript.json format |
| `whisper-demo/transcript.json` | Output file polled by the editor when using whisper.cpp |

---

## Further reading

- [Web Speech API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Web Speech API — Google Developers](https://developers.google.com/web/updates/2013/01/Voice-Driven-Web-Apps-Introduction-to-the-Web-Speech-API)
- [whisper.cpp](https://github.com/ggerganov/whisper.cpp)
- [WebVTT specification](https://www.w3.org/TR/webvtt1/)
- `docs/live-captioning-guide.md` — event room setup, accessibility guidance, and privacy notes for live presentations
