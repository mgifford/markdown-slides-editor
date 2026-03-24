const MERMAID_MODULE_URL = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

let mermaidModulePromise = null;
let mermaidInitialized = false;
let mermaidRenderSequence = 0;

async function loadMermaid() {
  if (!mermaidModulePromise) {
    mermaidModulePromise = import(MERMAID_MODULE_URL)
      .then((module) => module.default || module)
      .catch((error) => {
        mermaidModulePromise = null;
        throw error;
      });
  }
  return mermaidModulePromise;
}

export async function renderMermaidBlocks(root = document) {
  const blocks = [...root.querySelectorAll(".mermaid:not([data-mermaid-rendered])")];
  if (!blocks.length) {
    return { available: false, rendered: 0 };
  }

  try {
    const mermaid = await loadMermaid();
    if (!mermaidInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
      });
      mermaidInitialized = true;
    }

    let rendered = 0;
    for (const block of blocks) {
      const source = block.textContent.trim();
      if (!source) continue;
      const id = block.dataset.mermaidId || `mermaid-auto-${mermaidRenderSequence += 1}`;
      const result = await mermaid.render(id, source);
      block.innerHTML = result.svg;
      block.dataset.mermaidRendered = "true";
      rendered += 1;
    }

    return { available: true, rendered };
  } catch (error) {
    console.warn("Mermaid diagrams could not be rendered.", error);
    return { available: false, rendered: 0, error };
  }
}
