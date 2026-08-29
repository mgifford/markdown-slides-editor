// Mathematics rendering — the "render" concern in the math pipeline.
//
// markdown.js recognises `$...$` / `$$...$$` and emits protected `.math-tex`
// nodes that already carry the raw LaTeX (data-math-source) and MathJax
// delimiters as their text content. This module lazily loads MathJax 4 — only
// when a deck actually contains math — and typesets those nodes in place,
// mirroring the Mermaid philosophy in mermaid.js.
//
// Accessibility:
//   - Every node gets an aria-label from its LaTeX source before typesetting,
//     so assistive technology always has a meaning even mid-load.
//   - MathJax is configured to attach assistive MathML, giving screen readers
//     proper mathematical semantics once typesetting completes.
//   - If MathJax cannot load, the readable LaTeX source is shown instead of
//     broken output (a good failure state), and the node is marked so callers
//     and styles can react.

// MathJax 4 combined TeX + MathML input, CommonHTML output, with the
// accessibility extensions. Loaded on demand from the CDN, matching the
// Mermaid delivery pattern used elsewhere in this project.
const MATHJAX_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/mathjax@4/tex-mml-chtml.js";

let mathJaxPromise = null;

/**
 * Configure and load MathJax 4 exactly once. Resolves with the global MathJax
 * object, or rejects if the script cannot be fetched/started.
 */
function loadMathJax() {
  if (mathJaxPromise) return mathJaxPromise;

  if (typeof document === "undefined") {
    return Promise.reject(new Error("MathJax requires a DOM environment."));
  }

  mathJaxPromise = new Promise((resolve, reject) => {
    // MathJax reads window.MathJax for configuration before the script runs.
    // We do NOT enable global typesetOnLoad — this module drives typesetting
    // explicitly so math renders only on mounted slides.
    window.MathJax = {
      tex: {
        inlineMath: [["\\(", "\\)"]],
        displayMath: [["\\[", "\\]"]],
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

    const script = document.createElement("script");
    script.src = MATHJAX_SCRIPT_URL;
    script.async = true;
    script.addEventListener("error", () => {
      mathJaxPromise = null;
      reject(new Error("MathJax script failed to load."));
    });
    script.addEventListener("load", () => {
      const startup = window.MathJax && window.MathJax.startup;
      if (!startup || !startup.promise) {
        mathJaxPromise = null;
        reject(new Error("MathJax started but exposed no startup promise."));
        return;
      }
      startup.promise.then(() => resolve(window.MathJax)).catch(reject);
    });
    document.head.appendChild(script);
  });

  return mathJaxPromise;
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
 * aria-label (the source) and is marked so styling can present it as a code-like
 * fallback rather than a broken render.
 */
function applyMathFallback(nodes) {
  for (const node of nodes) {
    const source = node.getAttribute("data-math-source") || "";
    node.dataset.mathFallback = "true";
    if (source) {
      // Show the plain LaTeX (already HTML-escaped when the node was built) so
      // authors and readers still get the meaning.
      node.textContent = source;
    }
  }
}

/**
 * Typeset every un-rendered `.math-tex` node within `root`.
 * @returns {Promise<{available:boolean, rendered:number, error?:Error}>}
 */
export async function renderMathBlocks(root = document) {
  const nodes = [...root.querySelectorAll(".math-tex:not([data-math-rendered])")];
  if (!nodes.length) {
    return { available: false, rendered: 0 };
  }

  // Give AT a meaning immediately, before the (async) typeset resolves.
  labelMathNodes(nodes);

  try {
    const mathJax = await loadMathJax();
    await mathJax.typesetPromise(nodes);
    for (const node of nodes) {
      node.dataset.mathRendered = "true";
      delete node.dataset.mathFallback;
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
