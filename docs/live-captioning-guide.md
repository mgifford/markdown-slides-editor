# Live Captioning Guide

Live captions make presentations accessible to audience members who are deaf or hard of hearing,
non-native speakers, or anyone who benefits from reading spoken words alongside a slide deck.

This guide covers how to enable live captions with this editor, drawing on the experience of
[MidCamp](https://www.midcamp.org/), whose [live-captioning tool](https://github.com/MidCamp/live-captioning)
was developed when a hearing-impaired attendee asked about accessibility at the Midwest Drupal Camp.

> "According to him, this approach worked amazingly well. While it was not perfect, it was a
> game-changer for him. Before, he would never go to camps. Now, he wants to go to all the camps."
> — MidCamp live-captioning

Captions are always optional in this editor. The caption panel stays hidden until a caption source
is actually available.

## Captioning approaches

There are three ways to add live captions to a presentation:

| Approach | What it uses | When to use it |
|---|---|---|
| Browser-native (Web Speech API) | Chromium speech recognition | On-stage captioning on a live captioning computer |
| Local whisper.cpp | Local AI transcription model | Private, offline, or high-accuracy use cases |
| External service endpoint | Any JSON-compatible caption service | Centralised events or cloud captioning services |

## Approach 1: Browser-native captioning (Web Speech API)

This approach follows the same model used by MidCamp live-captioning. It requires no installation,
no server, and no API keys. The browser uses the Web Speech API to capture microphone audio and
produce text in real time.

### Requirements

- Chromium-based browser (Chrome, Edge, Brave, Arc) version 25 or later.
- Microphone access (the browser will prompt on first use).
- Internet connection (the speech recognition engine is cloud-based — see the [Privacy](#privacy) section).
- The presentation must be served over HTTPS or from `localhost`. Microphone access is blocked on
  plain HTTP pages.

### How to enable in the presenter view

1. Open the presenter view at `/presenter/` in a Chromium browser.
2. The caption panel appears automatically when speech recognition is available in the browser.
3. Click **Turn On Captions** (🎙) to start recognising speech.
4. Allow microphone access when the browser prompts.
5. Begin speaking. Captions appear live in the presenter view, and the audience view shows the same
   text when it is open in the same browser origin.

### Language selection

The caption language selector is available in the presenter view when speech recognition is active.
Over 50 languages are supported, including regional variants such as French (Canada), Spanish
(United States), and English (Australia). The selected language is saved in the browser so it
persists between sessions.

## Approach 2: Local whisper.cpp transcription

Running [whisper.cpp](https://github.com/ggerganov/whisper.cpp) locally produces higher-accuracy
transcription with no cloud dependency. This approach is suitable for privacy-sensitive presentations
or when an accurate offline transcript is needed.

### Prerequisites

- Install and build `whisper.cpp` on the captioning computer.
- Run the local helper script: `npm run dev:whisper`

The script writes transcript output to `whisper-demo/transcript.json` using this shape:

```json
{
  "active": true,
  "generated": "2026-03-22T16:00:00Z",
  "text": "current live transcript text"
}
```

When the editor is running on `localhost`, it checks for this file automatically and shows the
caption panel only when the file becomes available.

### Front matter configuration

```md
---
captionsProvider: whisper.cpp
captionsSource: http://localhost:4173/whisper-demo/transcript.json
---
```

### Testing without whisper installed

You can mirror an existing text file into the transcript format for testing:

```bash
npm run dev:transcript -- --src ./some-transcript.txt
```

## Approach 3: External caption service

If an external captioning service exposes a polling endpoint, configure it in front matter:

```md
---
captionsProvider: service
captionsSource: https://captions.example.com/presentation/transcript.json
---
```

The polling endpoint must return the same transcript JSON shape used by whisper.cpp. The editor
polls the source every 1500 ms by default. To change the interval, set `captionsPollMs`:

```md
---
captionsProvider: service
captionsSource: https://captions.example.com/presentation/transcript.json
captionsPollMs: 2000
---
```

## Event and room setup

The following guidance adapts MidCamp's documented room setup for use with this editor.

### Recommended room layout

```
[A] Presenter microphone  ──┐
                             ├──> [B] Captioning computer ──> [C] Caption monitor
[F] Presenter computer ──> [G] Main screen
                             
[D] Reserved seating section  (facing both [G] and [C])
[E] Caption volunteer          (at [B])
```

### A. Microphone for the presenter

- Use an external or directional microphone close to the speaker for the best recognition accuracy.
- Connect the microphone to the captioning computer, not the presenter's computer.
- A cable of 15 feet or more is useful to reach a captioning station at the side of the room.
- Configure the captioning computer to use the external microphone as its default audio input.

When multiple people are speaking:

- Captioning accuracy degrades with increased background noise or overlapping speech.
- The captioning engine does not separate or identify different speakers.
- Consider a shared lapel or table microphone if multiple speakers will be presenting together.
- Optional: split the room audio signal and route a feed to the captioning computer.

### B. Captioning computer

- Use a dedicated computer for captioning, separate from the presenter's computer.
- Use a hard-wired internet connection if possible. Wi-Fi introduces lag and potential disconnections.
- Use a Chromium browser (Chrome, Edge) when using the browser-native approach.
- When using whisper.cpp, run the local helper scripts on this machine.

### C. Caption monitor

- Connect the caption monitor to the captioning computer via HDMI or DisplayPort.
- Place the monitor near the main presentation screen so audience members can look between them easily.
- The monitor should be in direct line of sight for the reserved seating section.
- Choose monitor size based on room dimensions and proximity of the farthest audience member.

### D. Reserved seating section

- Reserve a section of seating for audience members who will benefit from captions.
- Near-centre placement with a clear view of both the main screen and the caption monitor works well.
- Use tape on the floor or reserved signs on chairs to mark the section.
- Announce the caption section at the start of the event.

### E. Caption volunteer

Assign a dedicated volunteer to the captioning computer. Their responsibilities include:

- Starting and stopping caption sessions at the beginning and end of each presentation.
- Monitoring that captions are active and the audio signal is healthy.
- Restarting the caption connection if it times out (see [Known issues](#known-issues)).
- Troubleshooting microphone, internet, or browser issues as they arise.
- Adjusting zoom and text size if the caption text is too small to read at a distance.
- Assisting audience members seated in the reserved section.

### F and G. Presenter computer and main screen

- The presenter's computer runs the presentation from `/present/` or from the exported HTML.
- It is not connected to the captioning setup.
- Any videos in the presentation should include their own embedded captions or subtitles.

### H. Room audio

- Ensure all speakers have microphones.
- Test the room audio before the event starts.
- Confirm the physical space is accessible for all attendees.

## Known issues

The following issues are well-documented from MidCamp's experience and apply to browser-native
captioning:

### Connection timeout

The Web Speech API connection may time out after extended silence or when the audio signal is weak.
The `onend` event fires automatically and the editor restarts recognition if captioning is still
enabled. If captions stop appearing unexpectedly, the caption volunteer can turn captions off and on
again to force a fresh connection.

**Best practice:** Keep a strong, consistent microphone signal. Captioning works best when the
input audio is clear and continuous.

### Text extending off the visible area

When a speaker talks for an extended period without a natural pause, the caption buffer may fill.
This editor limits the visible caption buffer to the most recent 300 characters of recognised text
to keep captions readable and prevent overflow.

### Browser microphone permissions

Chrome and other Chromium browsers remember microphone permissions per site. If the browser blocks
the microphone on a previously used site, the caption volunteer should check browser settings:

1. Open the browser settings (address bar: `chrome://settings/content/microphone`).
2. Check whether the presentation site is listed under **Block**.
3. Move it to **Allow** or turn on **Ask before accessing**.

### HTTPS requirement

Browser microphone access is restricted to secure contexts. The presentation must be served over
HTTPS or from `localhost`. When hosting on GitHub Pages or any other HTTPS-enabled static host, the
browser-native approach works without any server-side configuration.

## Privacy

### Browser-native Web Speech API

When using the browser's built-in speech recognition, audio is processed by the browser's speech
recognition service (Google's service in most Chromium builds). The following applies:

- Audio is sent to the speech recognition service for processing. It is not stored by this editor.
- This editor does not opt in to any data logging with the recognition service.
- The recognition service captures the domain of the hosting website, the default browser language,
  and the site's language settings. Cookies are not sent.
- Google states that personal data is not collected unless the user explicitly opts in to data
  logging to improve the service.

Reference: [Web Speech API — Google Developers](https://developers.google.com/web/updates/2013/01/Voice-Driven-Web-Apps-Introduction-to-the-Web-Speech-API)

### Local whisper.cpp

Transcription runs entirely on-device. No audio or transcript data leaves the captioning computer.
This is the recommended approach for privacy-sensitive events.

### Caption visibility on the audience screen

Caption text from presenter view is broadcast to the audience view using the browser's
`BroadcastChannel` API. This is a same-origin in-browser channel. Caption text is not sent to any
server unless an external captioning service is configured via `captionsSource`.

## Accessibility guidance for caption displays

When setting up a physical caption display:

- Use high-contrast text. White text on a dark background or black text on a white background works
  reliably across room lighting conditions.
- Use a large, readable font. The caption volunteer should adjust zoom so text is legible from the
  farthest reserved seat.
- Avoid placing the caption monitor directly behind the presenter where audience members must look
  away from the speaker to read captions.
- Where possible, include the caption monitor in the main room setup diagrams shared with event
  attendees in advance so they know it is available.

## Further resources

- [MidCamp live-captioning](https://github.com/MidCamp/live-captioning) — the open-source browser
  captioning tool that this guide draws on for room setup, known issues, and accessibility guidance.
- [Web Speech API specification](https://webaudio.github.io/web-speech-api/) — W3C specification for
  the browser speech recognition API.
- [whisper.cpp](https://github.com/ggerganov/whisper.cpp) — local, offline speech recognition using
  OpenAI's Whisper model.
- [WCAG 2.2 Guideline 1.2](https://www.w3.org/WAI/WCAG22/Understanding/time-based-media) — success
  criteria for captions, audio description, and time-based media alternatives.
- [Intopia — How To Create More Accessible Presentations](https://intopia.digital/articles/how-to-create-more-accessible-presentations/) — broader presentation accessibility guidance this project follows.
