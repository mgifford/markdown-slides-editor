// Mathematics rendering — the "render" concern of the math pipeline.
//
// markdown.js recognises `$...$`, `\( \)`, `$$...$$`, `\[ \]` and emits protected
// `.math-tex` nodes that already carry the raw LaTeX (data-math-source) and
// MathJax delimiters as their text content. This module lazily loads MathJax 4
// — only when math is actually present — and typesets those nodes in place,
// mirroring the lazy-loading approach used for Mermaid.
//
// Public API (kept small and testable):
//   hasMath(root)          -> boolean: are there un-rendered math nodes?
//   loadMathJax()          -> Promise<MathJax>: load once, memoised
//   renderMathBlocks(root) -> Promise<{available, rendered, error?}>
//   resetMathContext()     -> drop the memoised MathJax (mainly for tests)
//
// MathJax specifics stay inside this module; callers only ever see the four
// functions above.

const MATH_SELECTOR = ".math-tex:not([data-math-rendered])";

// MathJax 4 combined TeX + MathML input, CommonHTML output, with the
// accessibility extensions. Loaded on demand from the CDN, matching the
// Mermaid delivery pattern used elsewhere in this project.
const MATHJAX_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/mathjax@4/tex-mml-chtml.js";

let mathJaxPromise = null;

// The loader is injectable so the lazy-loading, memoisation, failure and reset
// behaviour can be unit-tested without a real browser or CDN. In production it
// is null and the default browser loader below is used.
let mathJaxLoaderOverride = null;

/**
 * Test seam: supply a fake `async () => MathJaxLike` loader, or null to restore
 * the real browser loader. Also clears any memoised context so the next
 * loadMathJax() uses the new loader.
 */
export function __setMathJaxLoader(loader) {
  mathJaxLoaderOverride = loader;
  mathJaxPromise = null;
}

/** True when `root` contains at least one math node that has not been rendered. */
export function hasMath(root = getDocument()) {
  if (!root || typeof root.querySelectorAll !== "function") return false;
  return root.querySelectorAll(MATH_SELECTOR).length > 0;
}

/**
 * True when keyboard focus is inside a MathJax equation, i.e. the user may be
 * exploring the maths with the arrow keys / Enter / Escape. Slide-navigation
 * handlers use this to yield those keys to MathJax so exploration does not also
 * change slides. `target` is optional; the current activeElement is used
 * otherwise. Keeps MathJax's DOM shape (the `mjx-container` focus target) known
 * only to this module.
 */
export function isMathExplorationActive(target) {
  const doc = getDocument();
  const node = target || (doc && doc.activeElement);
  if (!node || typeof node.closest !== "function") return false;
  return Boolean(node.closest("mjx-container"));
}

/**
 * Load MathJax 4 once and reuse the result. Rejections are not cached, so a
 * failed CDN request can be retried on a later render.
 */
export function loadMathJax() {
  if (mathJaxPromise) return mathJaxPromise;
  const loader = mathJaxLoaderOverride || defaultBrowserLoader;
  mathJaxPromise = Promise.resolve()
    .then(loader)
    .catch((error) => {
      mathJaxPromise = null; // allow a later retry
      throw error;
    });
  return mathJaxPromise;
}

/** Drop the memoised MathJax context. Mainly used by tests. */
export function resetMathContext() {
  mathJaxPromise = null;
}

/**
 * Typeset every un-rendered `.math-tex` node within `root`.
 * @returns {Promise<{available:boolean, rendered:number, error?:Error}>}
 */
export async function renderMathBlocks(root = getDocument()) {
  const nodes = root && typeof root.querySelectorAll === "function"
    ? [...root.querySelectorAll(MATH_SELECTOR)]
    : [];
  if (!nodes.length) {
    return { available: false, rendered: 0 };
  }

  // Give assistive technology a meaning immediately, before the async typeset.
  labelMathNodes(nodes);

  try {
    const mathJax = await loadMathJax();
    await mathJax.typesetPromise(nodes);
    for (const node of nodes) {
      node.dataset.mathRendered = "true";
      delete node.dataset.mathFallback;
      // MathJax attaches assistive MathML with proper spoken/Braille semantics.
      // Our pre-render aria-label (the raw LaTeX) would now compete with and
      // override that, so remove it and let MathJax own the accessible name.
      if (typeof node.removeAttribute === "function") {
        node.removeAttribute("aria-label");
      }
      makeOverflowingMathScrollable(node);
    }
    return { available: true, rendered: nodes.length };
  } catch (error) {
    console.warn("Math could not be typeset; showing LaTeX source instead.", error);
    applyMathFallback(nodes);
    for (const node of nodes) {
      node.dataset.mathRendered = "true";
    }
    return { available: false, rendered: 0, error };
  }
}

// --- Internals ----------------------------------------------------------------

function getDocument() {
  return typeof document !== "undefined" ? document : null;
}

/**
 * Default loader: configure and inject the MathJax 4 script from the CDN.
 * Resolves with the global MathJax object, or rejects if the script cannot be
 * fetched or started.
 */
function defaultBrowserLoader() {
  const doc = getDocument();
  if (!doc) {
    return Promise.reject(new Error("MathJax requires a DOM environment."));
  }

  return new Promise((resolve, reject) => {
    // MathJax reads window.MathJax for configuration before the script runs.
    // Global typesetOnLoad is disabled — this module drives typesetting
    // explicitly so math renders only on mounted slides.
    window.MathJax = {
      tex: {
        inlineMath: [["\\(", "\\)"]],
        displayMath: [["\\[", "\\]"]],
      },
      chtml: {
        // Wrap wide display equations to the container width so they reflow at
        // high zoom / narrow viewports instead of being clipped; horizontal
        // scrolling (CSS overflow-x on .math-tex--display) is the last resort.
        displayOverflow: "linebreak",
        linebreaks: { inline: true },
      },
      options: {
        // Attach assistive MathML for screen readers; keep the context menu off
        // so it does not interfere with the presentation keyboard model.
        enableAssistiveMml: true,
        menuOptions: {
          settings: { assistiveMml: true },
        },
      },
      startup: {
        typeset: false,
        ready: () => {
          window.MathJax.startup.defaultReady();
        },
      },
    };

    const script = doc.createElement("script");
    script.src = MATHJAX_SCRIPT_URL;
    script.async = true;
    script.addEventListener("error", () => {
      reject(new Error("MathJax script failed to load."));
    });
    script.addEventListener("load", () => {
      const startup = window.MathJax && window.MathJax.startup;
      if (!startup || !startup.promise) {
        reject(new Error("MathJax started but exposed no startup promise."));
        return;
      }
      startup.promise.then(() => resolve(window.MathJax)).catch(reject);
    });
    doc.head.appendChild(script);
  });
}

/**
 * When a display equation is wider than its container (horizontal scrolling is
 * the last-resort strategy), make the scroll container reachable and operable by
 * keyboard: give it a tabindex and an accessible name so a keyboard user can
 * focus it and scroll with the arrow keys. No-ops when the equation fits, in a
 * non-DOM environment, or for inline math.
 */
function makeOverflowingMathScrollable(node) {
  if (!node || typeof node.classList === "undefined") return;
  if (!node.classList.contains("math-tex--display")) return;
  // scrollWidth/clientWidth are only meaningful in a real layout (browser).
  const scrollWidth = node.scrollWidth || 0;
  const clientWidth = node.clientWidth || 0;
  const overflows = scrollWidth > clientWidth + 1;
  if (overflows) {
    node.setAttribute("tabindex", "0");
    node.setAttribute("role", "group");
    // A short, generic name for the scroll container. The equation's own
    // spoken/Braille semantics come from MathJax inside it, so this label must
    // NOT repeat the LaTeX (which would compete with those semantics).
    if (!node.hasAttribute("aria-label")) {
      node.setAttribute("aria-label", "Scrollable equation");
    }
  } else {
    // Ensure a previously-overflowing equation that now fits is not left focusable.
    node.removeAttribute("tabindex");
    if (node.getAttribute("role") === "group") node.removeAttribute("role");
  }
}

/** Set an aria-label baseline from the LaTeX source on each math node. */
function labelMathNodes(nodes) {
  for (const node of nodes) {
    const source = node.getAttribute("data-math-source") || node.textContent || "";
    if (source && !node.hasAttribute("aria-label")) {
      node.setAttribute("aria-label", source.trim());
    }
  }
}

/**
 * Reveal readable LaTeX source when MathJax is unavailable. The node keeps its
 * aria-label (the source), is marked with data-math-fallback so styling can
 * present it as a code-like fallback, and is given a title that says rendering
 * failed — so the failure is clear and no slide is left empty.
 */
function applyMathFallback(nodes) {
  for (const node of nodes) {
    const source = node.getAttribute("data-math-source") || "";
    node.dataset.mathFallback = "true";
    if (typeof node.setAttribute === "function") {
      node.setAttribute("title", "Mathematical rendering unavailable — showing LaTeX source.");
    }
    if (source) {
      // Show the plain LaTeX (already HTML-escaped when the node was built) so
      // authors and readers still get the meaning.
      node.textContent = source;
    }
  }
}
