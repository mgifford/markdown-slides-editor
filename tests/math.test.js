import test from "node:test";
import assert from "node:assert/strict";
import {
  hasMath,
  isMathExplorationActive,
  loadMathJax,
  renderMathBlocks,
  resetMathContext,
  __setMathJaxLoader,
} from "../src/modules/math.js";

// --- Minimal DOM doubles ------------------------------------------------------
//
// math.js only needs a tiny slice of the DOM: elements with class handling,
// dataset, attributes, textContent, and querySelectorAll on the container.
// Rather than pull in a DOM library (the project keeps dependencies minimal),
// these lightweight fakes model exactly what the module touches.

function makeNode({ source = "", rendered = false } = {}) {
  const attributes = new Map();
  if (source) attributes.set("data-math-source", source);
  const node = {
    dataset: rendered ? { mathRendered: "true" } : {},
    textContent: source,
    _children: [],
    getAttribute: (name) => (attributes.has(name) ? attributes.get(name) : null),
    setAttribute: (name, value) => attributes.set(name, value),
    hasAttribute: (name) => attributes.has(name),
    removeAttribute: (name) => attributes.delete(name),
    querySelector: () => null,
    querySelectorAll: () => [],
  };
  return node;
}

function makeRoot(nodes) {
  return {
    querySelectorAll: (selector) => {
      // The module queries ".math-tex:not([data-math-rendered])".
      if (selector.includes(":not([data-math-rendered])")) {
        return nodes.filter((n) => n.dataset.mathRendered !== "true");
      }
      return nodes.slice();
    },
  };
}

test.beforeEach(() => {
  resetMathContext();
});

test.afterEach(() => {
  __setMathJaxLoader(null); // restore the real loader
  resetMathContext();
});

// --- hasMath ------------------------------------------------------------------

test("hasMath is false when a root has no math nodes", () => {
  assert.equal(hasMath(makeRoot([])), false);
});

test("hasMath is true when a root has an un-rendered math node", () => {
  assert.equal(hasMath(makeRoot([makeNode({ source: "x^2" })])), true);
});

test("hasMath is false when every math node is already rendered", () => {
  assert.equal(hasMath(makeRoot([makeNode({ source: "x^2", rendered: true })])), false);
});

// --- Lazy loading and memoization --------------------------------------------

test("loadMathJax is not called when a deck has no math", async () => {
  let loads = 0;
  __setMathJaxLoader(async () => {
    loads += 1;
    return { typesetPromise: async () => {} };
  });

  const result = await renderMathBlocks(makeRoot([]));
  assert.equal(loads, 0, "no math means MathJax must not load");
  assert.equal(result.rendered, 0);
  assert.equal(result.available, false);
});

test("MathJax loads once across multiple renders", async () => {
  let loads = 0;
  __setMathJaxLoader(async () => {
    loads += 1;
    return { typesetPromise: async () => {} };
  });

  await renderMathBlocks(makeRoot([makeNode({ source: "a" })]));
  await renderMathBlocks(makeRoot([makeNode({ source: "b" })]));
  await renderMathBlocks(makeRoot([makeNode({ source: "c" })]));
  assert.equal(loads, 1, "MathJax must be loaded exactly once and reused");
});

test("renderMathBlocks typesets nodes and marks them rendered", async () => {
  const typeset = [];
  __setMathJaxLoader(async () => ({
    typesetPromise: async (nodes) => {
      typeset.push(...nodes);
    },
  }));

  const node = makeNode({ source: "x^2" });
  const result = await renderMathBlocks(makeRoot([node]));

  assert.equal(result.available, true);
  assert.equal(result.rendered, 1);
  assert.equal(node.dataset.mathRendered, "true");
  assert.equal(typeset.length, 1);
});

test("renderMathBlocks labels nodes with their source before typesetting", async () => {
  // Before MathJax loads, the aria-label is a baseline; a slow/never loader
  // leaves it in place as the fallback name.
  __setMathJaxLoader(async () => {
    throw new Error("still loading");
  });
  const node = makeNode({ source: "E = mc^2" });
  await renderMathBlocks(makeRoot([node]));
  assert.equal(node.getAttribute("aria-label"), "E = mc^2");
});

test("renderMathBlocks removes the competing aria-label once MathJax renders", async () => {
  // After a successful typeset, MathJax owns the accessible name via assistive
  // MathML, so our raw-LaTeX aria-label must be removed to avoid competing.
  __setMathJaxLoader(async () => ({ typesetPromise: async () => {} }));
  const node = makeNode({ source: "E = mc^2" });
  await renderMathBlocks(makeRoot([node]));
  assert.equal(node.hasAttribute("aria-label"), false);
});

// --- resetMathContext ---------------------------------------------------------

test("resetMathContext forces MathJax to load again", async () => {
  let loads = 0;
  __setMathJaxLoader(async () => {
    loads += 1;
    return { typesetPromise: async () => {} };
  });

  await renderMathBlocks(makeRoot([makeNode({ source: "a" })]));
  assert.equal(loads, 1);

  resetMathContext();
  await renderMathBlocks(makeRoot([makeNode({ source: "b" })]));
  assert.equal(loads, 2, "after reset, MathJax loads fresh");
});

// --- Graceful failure ---------------------------------------------------------

test("a failed MathJax load leaves readable source, not an empty node", async () => {
  __setMathJaxLoader(async () => {
    throw new Error("CDN unreachable");
  });

  const node = makeNode({ source: "E = mc^2" });
  const result = await renderMathBlocks(makeRoot([node]));

  assert.equal(result.available, false);
  assert.ok(result.error, "the error is reported");
  // The readable LaTeX source is shown and the failure is marked.
  assert.equal(node.textContent, "E = mc^2");
  assert.equal(node.dataset.mathFallback, "true");
  assert.equal(node.getAttribute("aria-label"), "E = mc^2");
  // Nodes are still marked processed so a re-render does not loop on them.
  assert.equal(node.dataset.mathRendered, "true");
});

test("a failed typeset also falls back to readable source", async () => {
  __setMathJaxLoader(async () => ({
    typesetPromise: async () => {
      throw new Error("typeset failed");
    },
  }));

  const node = makeNode({ source: "a_1" });
  const result = await renderMathBlocks(makeRoot([node]));
  assert.equal(result.available, false);
  assert.equal(node.dataset.mathFallback, "true");
  assert.equal(node.textContent, "a_1");
});

// --- loadMathJax memoization at the API level --------------------------------

test("loadMathJax returns the same promise on repeated calls", async () => {
  let loads = 0;
  __setMathJaxLoader(async () => {
    loads += 1;
    return { typesetPromise: async () => {} };
  });

  const first = loadMathJax();
  const second = loadMathJax();
  assert.equal(first, second, "the in-flight/settled promise is reused");
  await first;
  await loadMathJax();
  assert.equal(loads, 1);
});

// --- isMathExplorationActive (keyboard yielding) ------------------------------

test("isMathExplorationActive is true when the target is inside a mjx-container", () => {
  const target = { closest: (sel) => (sel === "mjx-container" ? {} : null) };
  assert.equal(isMathExplorationActive(target), true);
});

test("isMathExplorationActive is false for a target outside math", () => {
  const target = { closest: () => null };
  assert.equal(isMathExplorationActive(target), false);
});

test("isMathExplorationActive is false for a target without closest()", () => {
  assert.equal(isMathExplorationActive({}), false);
});
