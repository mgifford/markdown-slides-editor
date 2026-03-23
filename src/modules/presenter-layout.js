export const PRESENTER_LAYOUT_STORAGE_KEY = "markdown-slides-editor.presenter-layout";

export const DEFAULT_PRESENTER_PANELS = [
  { id: "current", title: "Current slide", span: 5 },
  { id: "next", title: "Next slide", span: 4 },
  { id: "timer", title: "Timer", span: 3 },
  { id: "notes", title: "Notes", span: 6 },
  { id: "captions", title: "Captions", span: 6 },
  { id: "outline", title: "Outline", span: 6 },
];

const MIN_SPAN = 3;
const MAX_SPAN = 12;
const MODE_NORMAL = "normal";
const MODE_COLLAPSED = "collapsed";
const MODE_FULLSCREEN = "fullscreen";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function normalizePresenterPanels(panels) {
  const incoming = Array.isArray(panels) ? panels : [];
  const defaultsById = new Map(DEFAULT_PRESENTER_PANELS.map((panel) => [panel.id, panel]));
  const seen = new Set();
  const normalized = [];

  for (const panel of incoming) {
    if (!panel?.id || seen.has(panel.id) || !defaultsById.has(panel.id)) {
      continue;
    }
    const defaultPanel = defaultsById.get(panel.id);
    const span = clamp(Number.parseInt(panel.span, 10) || defaultPanel.span, MIN_SPAN, MAX_SPAN);
    normalized.push({
      id: defaultPanel.id,
      title: defaultPanel.title,
      span,
      restoreSpan: clamp(Number.parseInt(panel.restoreSpan, 10) || span, MIN_SPAN, MAX_SPAN),
      mode:
        panel.mode === MODE_COLLAPSED || panel.mode === MODE_FULLSCREEN
          ? panel.mode
          : MODE_NORMAL,
      previousMode: panel.previousMode === MODE_COLLAPSED ? MODE_COLLAPSED : MODE_NORMAL,
    });
    seen.add(panel.id);
  }

  for (const defaultPanel of DEFAULT_PRESENTER_PANELS) {
    if (seen.has(defaultPanel.id)) continue;
    normalized.push({
      ...defaultPanel,
      restoreSpan: defaultPanel.span,
      mode: MODE_NORMAL,
      previousMode: MODE_NORMAL,
    });
  }

  return normalized;
}

export function resizePresenterPanel(panels, panelId, delta) {
  const normalized = normalizePresenterPanels(panels);
  const target = normalized.find((panel) => panel.id === panelId);
  if (!target) return normalized;

  if (delta < 0) {
    if (target.mode === MODE_FULLSCREEN) {
      return normalized.map((panel) => ({
        ...panel,
        mode: panel.previousMode === MODE_COLLAPSED ? MODE_COLLAPSED : MODE_NORMAL,
        previousMode: MODE_NORMAL,
        span:
          panel.id === panelId
            ? clamp(panel.restoreSpan || MAX_SPAN, MIN_SPAN, MAX_SPAN)
            : clamp(panel.restoreSpan || panel.span, MIN_SPAN, MAX_SPAN),
      }));
    }

    return normalized.map((panel) => {
      if (panel.id !== panelId) return panel;
      if (panel.mode === MODE_COLLAPSED) return panel;
      if (panel.span > MIN_SPAN) {
        const span = clamp(panel.span + delta, MIN_SPAN, MAX_SPAN);
        return { ...panel, span, restoreSpan: span };
      }
      return {
        ...panel,
        mode: MODE_COLLAPSED,
        previousMode: MODE_NORMAL,
        restoreSpan: panel.restoreSpan || panel.span,
      };
    });
  }

  if (target.mode === MODE_COLLAPSED) {
    return normalized.map((panel) =>
      panel.id === panelId
        ? {
            ...panel,
            mode: MODE_NORMAL,
            previousMode: MODE_NORMAL,
            span: clamp(panel.restoreSpan || MIN_SPAN, MIN_SPAN, MAX_SPAN),
          }
        : panel,
    );
  }

  if (target.mode === MODE_FULLSCREEN) {
    return normalized;
  }

  if (target.span < MAX_SPAN) {
    return normalized.map((panel) => {
      if (panel.id !== panelId) return panel;
      const span = clamp(panel.span + delta, MIN_SPAN, MAX_SPAN);
      return { ...panel, span, restoreSpan: span };
    });
  }

  return normalized.map((panel) => {
    if (panel.id === panelId) {
      return {
        ...panel,
        span: MAX_SPAN,
        restoreSpan: panel.restoreSpan || panel.span,
        mode: MODE_FULLSCREEN,
        previousMode: panel.mode,
      };
    }
    return {
      ...panel,
      mode: MODE_COLLAPSED,
      previousMode: panel.mode,
      restoreSpan: panel.restoreSpan || panel.span,
    };
  });
}

export function movePresenterPanel(panels, panelId, delta) {
  const normalized = [...normalizePresenterPanels(panels)];
  const index = normalized.findIndex((panel) => panel.id === panelId);
  if (index === -1) return normalized;
  const nextIndex = clamp(index + delta, 0, normalized.length - 1);
  if (nextIndex === index) return normalized;
  const [panel] = normalized.splice(index, 1);
  normalized.splice(nextIndex, 0, panel);
  return normalized;
}

export function getPresenterPanelLayoutMap(panels) {
  return new Map(
    normalizePresenterPanels(panels).map((panel, index) => [
      panel.id,
      {
        span: panel.span,
        order: index,
        mode: panel.mode,
        title: panel.title,
      },
    ]),
  );
}

export function expandPresenterPanel(panels, panelId) {
  return normalizePresenterPanels(panels).map((panel) =>
    panel.id === panelId
      ? {
          ...panel,
          mode: MODE_NORMAL,
          previousMode: MODE_NORMAL,
          span: clamp(panel.restoreSpan || MIN_SPAN, MIN_SPAN, MAX_SPAN),
        }
      : panel,
  );
}

export function loadPresenterLayout(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(PRESENTER_LAYOUT_STORAGE_KEY);
    if (!raw) return normalizePresenterPanels();
    return normalizePresenterPanels(JSON.parse(raw));
  } catch {
    return normalizePresenterPanels();
  }
}

export function savePresenterLayout(panels, storage = globalThis.localStorage) {
  storage?.setItem(PRESENTER_LAYOUT_STORAGE_KEY, JSON.stringify(normalizePresenterPanels(panels)));
}
