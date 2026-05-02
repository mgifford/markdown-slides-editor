const MAX_FINAL_CHARS = 300;

export const CAPTION_LANGUAGE_STORAGE_KEY = "markdown-slides-editor.captionLanguage";

/**
 * Supported caption languages.
 * Each entry is [BCP 47 tag, human-readable label, Whisper ISO 639-1 code].
 * The BCP 47 tag is used for the Web Speech API (recognition.lang).
 * The Whisper code is used with the --language / -l flag in run-whisper.js.
 */
export const CAPTION_LANGUAGES = [
  ["ar", "Arabic", "ar"],
  ["eu", "Basque", "eu"],
  ["bg", "Bulgarian", "bg"],
  ["ca", "Catalan", "ca"],
  ["zh-CN", "Chinese (Simplified)", "zh"],
  ["zh-TW", "Chinese (Traditional)", "zh"],
  ["hr", "Croatian", "hr"],
  ["cs", "Czech", "cs"],
  ["da", "Danish", "da"],
  ["nl", "Dutch", "nl"],
  ["en-AU", "English (Australia)", "en"],
  ["en-CA", "English (Canada)", "en"],
  ["en-GB", "English (United Kingdom)", "en"],
  ["en-US", "English (United States)", "en"],
  ["et", "Estonian", "et"],
  ["fi", "Finnish", "fi"],
  ["fr-CA", "French (Canada)", "fr"],
  ["fr-FR", "French (France)", "fr"],
  ["gl", "Galician", "gl"],
  ["de", "German", "de"],
  ["el", "Greek", "el"],
  ["he", "Hebrew", "he"],
  ["hi", "Hindi", "hi"],
  ["hu", "Hungarian", "hu"],
  ["id", "Indonesian", "id"],
  ["it", "Italian", "it"],
  ["ja", "Japanese", "ja"],
  ["ko", "Korean", "ko"],
  ["lv", "Latvian", "lv"],
  ["lt", "Lithuanian", "lt"],
  ["ms", "Malay", "ms"],
  ["no", "Norwegian", "no"],
  ["fa", "Persian", "fa"],
  ["pl", "Polish", "pl"],
  ["pt-BR", "Portuguese (Brazil)", "pt"],
  ["pt-PT", "Portuguese (Portugal)", "pt"],
  ["ro", "Romanian", "ro"],
  ["ru", "Russian", "ru"],
  ["sr", "Serbian", "sr"],
  ["sk", "Slovak", "sk"],
  ["sl", "Slovenian", "sl"],
  ["es-ES", "Spanish (Spain)", "es"],
  ["es-US", "Spanish (United States)", "es"],
  ["sw", "Swahili", "sw"],
  ["sv", "Swedish", "sv"],
  ["tl", "Tagalog", "tl"],
  ["th", "Thai", "th"],
  ["tr", "Turkish", "tr"],
  ["uk", "Ukrainian", "uk"],
  ["ur", "Urdu", "ur"],
  ["vi", "Vietnamese", "vi"],
  ["cy", "Welsh", "cy"],
];

/**
 * Returns the active caption language BCP 47 tag.
 * Reads from localStorage, falls back to the document lang attribute, then "en-US".
 */
export function getCaptionLanguage() {
  const stored =
    typeof localStorage !== "undefined"
      ? localStorage.getItem(CAPTION_LANGUAGE_STORAGE_KEY)
      : null;
  if (stored) return stored;
  const docLang =
    typeof document !== "undefined" ? document.documentElement.lang : "";
  return docLang || "en-US";
}

/**
 * Persists the caption language BCP 47 tag to localStorage.
 */
export function setCaptionLanguage(lang) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(CAPTION_LANGUAGE_STORAGE_KEY, lang);
  }
}

export function isSpeechRecognitionSupported() {
  return (
    typeof window !== "undefined" &&
    (typeof window.SpeechRecognition !== "undefined" ||
      typeof window.webkitSpeechRecognition !== "undefined")
  );
}

/**
 * Creates a browser-native speech-to-text source using the Web Speech API.
 *
 * @param {function({active: boolean, text: string, error?: string}): void} onUpdate
 *   Called whenever the recognised text or active state changes.
 * @returns {{ start(): void, stop(): void, clearText(): void, setLanguage(lang: string): void, getLanguage(): string } | null}
 *   A controller or null when the API is not available in this browser.
 *   - `setLanguage(lang)` — accepts a BCP 47 tag (e.g. "en-US", "fr-FR") from
 *     {@link CAPTION_LANGUAGES}; persists to localStorage and restarts recognition.
 *   - `getLanguage()` — returns the current BCP 47 tag in use.
 */
export function createSpeechRecognitionSource(onUpdate) {
  const SpeechRecognitionAPI =
    (typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)) ||
    null;

  if (!SpeechRecognitionAPI) return null;

  const recognition = new SpeechRecognitionAPI();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = getCaptionLanguage();

  let enabled = false;
  let started = false;
  let finalBuffer = "";
  let interimText = "";
  let segments = [];
  let fullTranscript = "";
  let sessionStartTime = null;
  let currentSegmentStartMs = 0;

  function buildDisplayText() {
    return (finalBuffer + (interimText ? " " + interimText : "")).trim();
  }

  function nowMs() {
    return sessionStartTime !== null ? Date.now() - sessionStartTime : 0;
  }

  recognition.onstart = () => {
    started = true;
    if (sessionStartTime === null) {
      sessionStartTime = Date.now();
      currentSegmentStartMs = 0;
    }
    onUpdate({ active: true, text: buildDisplayText() });
  };

  recognition.onresult = (event) => {
    let newFinal = "";
    let newInterim = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        newFinal += result[0].transcript;
      } else {
        newInterim += result[0].transcript;
      }
    }

    if (newFinal) {
      finalBuffer = (finalBuffer + " " + newFinal).trim();
      if (finalBuffer.length > MAX_FINAL_CHARS) {
        finalBuffer = finalBuffer.slice(finalBuffer.length - MAX_FINAL_CHARS);
        const spaceIdx = finalBuffer.indexOf(" ");
        if (spaceIdx !== -1) {
          finalBuffer = finalBuffer.slice(spaceIdx + 1);
        }
      }
      const segmentEnd = nowMs();
      const trimmedFinal = newFinal.trim();
      if (trimmedFinal) {
        segments.push({ start: currentSegmentStartMs, end: segmentEnd, text: trimmedFinal });
        currentSegmentStartMs = segmentEnd;
      }
      fullTranscript = (fullTranscript + " " + newFinal).trim();
    }
    interimText = newInterim;

    onUpdate({ active: true, text: buildDisplayText() });
  };

  recognition.onend = () => {
    started = false;
    if (enabled) {
      try {
        recognition.start();
      } catch {
        // Ignore — another start call may already be in flight.
      }
    } else {
      interimText = "";
      onUpdate({ active: false, text: finalBuffer });
    }
  };

  recognition.onerror = (event) => {
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      enabled = false;
      started = false;
      onUpdate({ active: false, text: "", error: event.error });
    }
    // "no-speech" and other transient errors are handled by onend + auto-restart.
  };

  return {
    start() {
      if (enabled) return;
      enabled = true;
      if (!started) {
        try {
          recognition.start();
        } catch {
          // Ignore start errors (e.g. already started race condition).
        }
      }
    },
    stop() {
      enabled = false;
      if (started) {
        try {
          recognition.stop();
        } catch {
          // Ignore stop errors.
        }
      }
      interimText = "";
      onUpdate({ active: false, text: finalBuffer });
    },
    clearText() {
      finalBuffer = "";
      interimText = "";
      currentSegmentStartMs = nowMs();
      onUpdate({ active: enabled && started, text: "" });
    },
    getSegments() {
      return segments.slice();
    },
    getFullTranscript() {
      return fullTranscript;
    },
    getLanguage() {
      return recognition.lang || getCaptionLanguage();
    },
    setLanguage(lang) {
      setCaptionLanguage(lang);
      recognition.lang = lang;
      if (enabled && started) {
        try {
          recognition.stop();
          // onend will restart automatically because enabled is still true.
        } catch {
          // Ignore stop errors during language switch.
        }
      }
    },
  };
}
