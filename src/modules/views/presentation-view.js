import { createSyncChannel } from "../sync.js";
import { createCaptionMonitor, getCaptionConfig } from "../captions.js";
import {
  buildPresentationHash,
  getNextPosition,
  normalizePresentationPosition,
  parsePresentationHash,
  getPreviousPosition,
  getSlideTitle,
} from "../presentation-state.js";
import { toggleColorMode } from "../color-mode.js";
import { applyDeckTheme } from "../theme.js";
import { compileSource, mountSlideInto } from "./shared.js";

const AUDIENCE_PRIMARY_KEY = "markdown-slides-editor.audience-primary";
const HEARTBEAT_INTERVAL_MS = 1000;
const HEARTBEAT_STALE_MS = 3000;

function generateWindowId() {
  return Math.random().toString(36).slice(2);
}

function readPrimary() {
  try {
    const raw = localStorage.getItem(AUDIENCE_PRIMARY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writePrimary(id) {
  try {
    localStorage.setItem(AUDIENCE_PRIMARY_KEY, JSON.stringify({ id, ts: Date.now() }));
  } catch {
    // ignore storage errors
  }
}

function clearPrimary(id) {
  try {
    const current = readPrimary();
    if (current?.id === id) {
      localStorage.removeItem(AUDIENCE_PRIMARY_KEY);
    }
  } catch {
    // ignore
  }
}

function isPrimaryStale(primary) {
  return !primary || Date.now() - primary.ts > HEARTBEAT_STALE_MS;
}

export function createPresentationView(root, initialSource) {
  let source = initialSource;
  let activeSlideIndex = 0;
  let revealStep = 0;
  let textZoom = 1;
  let compiled = compileSource(source);
  const sync = createSyncChannel();
  // Guard flag: true while this window is processing an incoming sync message.
  // Prevents re-broadcasting and avoids infinite loops when multiple audience
  // windows are open at the same time.
  let isSyncHandling = false;
  // Primary-window flag — declared early so the sync subscriber (registered
  // below) can safely close over it; the value is set by checkForExistingPrimary.
  const windowId = generateWindowId();
  let isPrimary = false;
  let heartbeatTimer = null;
  let captionsState = {
    enabled: false,
    available: false,
    active: false,
    text: "",
    generated: "",
    provider: "none",
    source: "",
  };
  let captionConfig = getCaptionConfig(compiled.metadata);
  const captionMonitor = createCaptionMonitor(captionConfig, (state) => {
    captionsState = state;
    render();
  });
  let tocOpen = false;
  const frame = document.createElement("div");
  frame.className = "audience-shell";

  frame.innerHTML = `
    <main class="presentation-layout">
      <p id="presentation-status" class="sr-only" aria-live="polite"></p>
      <dialog id="presentation-toc" class="toc-dialog">
        <form method="dialog" class="toc-dialog__inner">
          <div class="toc-dialog__header">
            <p class="panel__label">Slide outline</p>
            <button type="submit">Close</button>
          </div>
          <ol id="presentation-outline" class="outline-list"></ol>
        </form>
      </dialog>
      <div id="presentation-frame" class="presentation-frame"></div>
      <div id="live-caption-display" class="live-caption-display" aria-live="polite" aria-atomic="false" hidden></div>
    </main>
  `;

  root.replaceChildren(frame);

  const frameNode = frame.querySelector("#presentation-frame");
  const statusNode = frame.querySelector("#presentation-status");
  const tocNode = frame.querySelector("#presentation-toc");
  const outlineNode = frame.querySelector("#presentation-outline");
  const captionNode = frame.querySelector("#live-caption-display");

  // Keep a ResizeObserver so --caption-bar-height stays accurate even when
  // the caption text wraps across multiple lines as the presentation progresses.
  const captionResizeObserver = new ResizeObserver(updateCaptionSpacing);
  captionResizeObserver.observe(captionNode);

  function updateCaptionSpacing() {
    if (!captionNode.hidden && captionNode.textContent) {
      // Measure how much of the viewport the caption element occupies from its
      // top edge down to the bottom (including the fixed bottom gap).
      const rect = captionNode.getBoundingClientRect();
      const reserved = window.innerHeight - rect.top;
      frameNode.style.setProperty("--caption-bar-height", `${Math.max(0, reserved)}px`);
    } else {
      frameNode.style.removeProperty("--caption-bar-height");
    }
  }
  function applyHashPosition() {
    compiled = compileSource(source);
    const position = parsePresentationHash(window.location.hash, compiled);
    if (!position) return false;
    activeSlideIndex = position.activeSlideIndex;
    revealStep = position.revealStep;
    return true;
  }

  function updateHash() {
    const nextHash = buildPresentationHash(activeSlideIndex, revealStep);
    if (window.location.hash === nextHash) return;
    history.replaceState(null, "", nextHash);
  }

  function render() {
    compiled = compileSource(source);
    applyDeckTheme(compiled.metadata);
    const nextCaptionConfig = getCaptionConfig(compiled.metadata);
    captionMonitor.update(nextCaptionConfig);
    captionConfig = nextCaptionConfig;
    const position = normalizePresentationPosition(compiled, activeSlideIndex, revealStep);
    activeSlideIndex = position.activeSlideIndex;
    revealStep = position.revealStep;
    const slide = compiled.renderedSlides[activeSlideIndex] || compiled.renderedSlides[0];
    activeSlideIndex = slide?.index || 0;
    mountSlideInto(frameNode, slide, { revealStep });
    frameNode.style.setProperty("--presentation-text-zoom", String(textZoom));
    statusNode.textContent = compiled.renderedSlides.length
      ? `${compiled.metadata.title || "Untitled deck"} · ${activeSlideIndex + 1} / ${compiled.renderedSlides.length} · ${revealStep}/${slide?.stepCount || 0} reveals`
      : `${compiled.metadata.title || "Untitled deck"} · No slides`;
    outlineNode.innerHTML = compiled.renderedSlides
      .map((renderedSlide, index) => {
        const currentClass = index === activeSlideIndex ? ' class="is-current"' : "";
        return `<li${currentClass}><button type="button" data-slide-index="${index}">${getSlideTitle(renderedSlide, index)}</button></li>`;
      })
      .join("");
    captionNode.hidden = !captionsState.available || !captionsState.text;
    captionNode.textContent = captionsState.text;
    updateCaptionSpacing();
    updateHash();
    // Only broadcast when this window is the primary and is the initiator
    // (keyboard nav, TOC click, etc.).  Skip broadcasting when we are merely
    // reacting to a sync message, or when this window is paused, so that
    // multiple open audience windows do not create a feedback loop that causes
    // rapid flickering between slide numbers.
    if (!isSyncHandling && isPrimary) {
      sync.postMessage({ type: "slide-changed", activeSlideIndex, revealStep, source, textZoom, timestamp: Date.now() });
    }
  }

  function move(delta) {
    compiled = compileSource(source);
    const nextPosition =
      delta > 0
        ? getNextPosition(compiled, activeSlideIndex, revealStep)
        : getPreviousPosition(compiled, activeSlideIndex, revealStep);
    activeSlideIndex = nextPosition.activeSlideIndex;
    revealStep = nextPosition.revealStep;
    render();
  }

  function toggleOutline() {
    tocOpen = !tocOpen;
    if (tocOpen) {
      tocNode.showModal();
    } else {
      tocNode.close();
    }
  }

  outlineNode.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-slide-index]");
    if (!button) return;
    activeSlideIndex = Number.parseInt(button.dataset.slideIndex, 10) || 0;
    revealStep = 0;
    tocOpen = false;
    tocNode.close();
    render();
  });

  tocNode.addEventListener("close", () => {
    tocOpen = false;
  });

  document.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
      event.preventDefault();
      move(1);
    }

    if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      move(-1);
    }

    if (event.key === "Home") {
      activeSlideIndex = 0;
      revealStep = 0;
      render();
    }

    if (event.key === "End") {
      activeSlideIndex = Math.max(0, compiled.renderedSlides.length - 1);
      revealStep = compiled.renderedSlides[activeSlideIndex]?.stepCount || 0;
      render();
    }

    if (event.key.toLowerCase() === "o") {
      event.preventDefault();
      toggleOutline();
    }

    if (event.key.toLowerCase() === "d") {
      event.preventDefault();
      toggleColorMode();
    }
  });

  window.addEventListener("hashchange", () => {
    if (applyHashPosition()) {
      render();
    }
  });

  sync.subscribe((message) => {
    // Ignore incoming sync messages when this window is paused (not primary).
    if (!isPrimary) return;
    isSyncHandling = true;
    try {
      if (message.type === "deck-updated" || message.type === "slide-changed") {
        source = message.source || source;
        activeSlideIndex = message.activeSlideIndex ?? activeSlideIndex;
        revealStep = message.type === "slide-changed" ? message.revealStep ?? revealStep : 0;
        if (typeof message.textZoom === "number") {
          textZoom = message.textZoom;
        }
        render();
      }
      if (message.type === "caption-update") {
        captionNode.hidden = !message.text;
        captionNode.textContent = message.text || "";
        updateCaptionSpacing();
      }
    } finally {
      isSyncHandling = false;
    }
  });

  // ── Primary-window coordination ──────────────────────────────────────────
  // When multiple audience tabs are open, only the "primary" tab responds to
  // the presenter sync channel.  Secondary tabs show a paused notice so users
  // can easily identify which window the presenter is controlling.
  //
  // Coordination uses a short-lived localStorage heartbeat:
  //   key  : AUDIENCE_PRIMARY_KEY
  //   value: { id: string, ts: number }
  // The primary tab refreshes `ts` every HEARTBEAT_INTERVAL_MS.
  // A tab whose heartbeat is older than HEARTBEAT_STALE_MS is considered gone.

  // Build the paused-state overlay (hidden by default).
  const pausedOverlay = document.createElement("div");
  pausedOverlay.className = "audience-paused-overlay";
  pausedOverlay.setAttribute("role", "status");
  pausedOverlay.setAttribute("aria-live", "polite");
  pausedOverlay.hidden = true;
  const pausedMessage = document.createElement("p");
  pausedMessage.className = "audience-paused-message";
  const pausedStrong = document.createElement("strong");
  pausedStrong.textContent = "paused";
  pausedMessage.append("This audience window is ", pausedStrong, " — another tab is already showing the live presentation.");
  const takeoverButton = document.createElement("button");
  takeoverButton.type = "button";
  takeoverButton.className = "audience-takeover-button";
  takeoverButton.textContent = "Take over as primary window";
  pausedOverlay.append(pausedMessage, takeoverButton);
  frame.appendChild(pausedOverlay);

  function claimPrimary() {
    isPrimary = true;
    writePrimary(windowId);
    pausedOverlay.hidden = true;
    if (!heartbeatTimer) {
      heartbeatTimer = setInterval(() => {
        if (isPrimary) writePrimary(windowId);
      }, HEARTBEAT_INTERVAL_MS);
    }
  }

  function enterPausedMode() {
    isPrimary = false;
    pausedOverlay.hidden = false;
  }

  function checkForExistingPrimary() {
    const existing = readPrimary();
    if (!isPrimaryStale(existing) && existing.id !== windowId) {
      // Another live primary exists — start paused.
      enterPausedMode();
    } else {
      // No live primary (or stale): claim the role.
      claimPrimary();
    }
  }

  takeoverButton.addEventListener("click", () => {
    claimPrimary();
    // Announce the change to assistive technology via the existing sr-only
    // status node so screen-reader users know the takeover succeeded.
    statusNode.textContent = "This window is now the primary audience window.";
    render();
  });

  window.addEventListener("beforeunload", () => {
    clearPrimary(windowId);
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  });

  // Re-check whenever another tab updates the primary key so a paused window
  // can automatically reclaim primary if the live window is closed.
  window.addEventListener("storage", (event) => {
    if (event.key !== AUDIENCE_PRIMARY_KEY) return;
    const existing = readPrimary();
    if (!isPrimary && isPrimaryStale(existing)) {
      claimPrimary();
      render();
    }
  });

  checkForExistingPrimary();
  applyHashPosition();
  render();
  captionMonitor.start();
}
