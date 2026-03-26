const MAX_FINAL_CHARS = 300;

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
 * @returns {{ start(): void, stop(): void, clearText(): void } | null}
 *   A controller or null when the API is not available in this browser.
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

  let enabled = false;
  let started = false;
  let finalBuffer = "";
  let interimText = "";

  function buildDisplayText() {
    return (finalBuffer + (interimText ? " " + interimText : "")).trim();
  }

  recognition.onstart = () => {
    started = true;
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
      onUpdate({ active: enabled && started, text: "" });
    },
  };
}
