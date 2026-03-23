import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_PRESENTER_PANELS,
  expandPresenterPanel,
  getPresenterPanelLayoutMap,
  loadPresenterLayout,
  movePresenterPanel,
  normalizePresenterPanels,
  PRESENTER_LAYOUT_STORAGE_KEY,
  resizePresenterPanel,
  savePresenterLayout,
} from "../src/modules/presenter-layout.js";

function createStorageMock(initialValue = null) {
  const values = new Map();
  if (initialValue !== null) {
    values.set(PRESENTER_LAYOUT_STORAGE_KEY, initialValue);
  }
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
  };
}

test("normalizePresenterPanels restores missing panels and clamps spans", () => {
  const normalized = normalizePresenterPanels([{ id: "current", span: 99 }]);
  assert.equal(normalized.length, DEFAULT_PRESENTER_PANELS.length);
  assert.equal(normalized.find((panel) => panel.id === "current").span, 12);
  assert.equal(normalized.some((panel) => panel.id === "notes"), true);
  assert.equal(normalized.some((panel) => panel.id === "captions"), true);
});

test("resizePresenterPanel changes only the targeted panel span", () => {
  const resized = resizePresenterPanel(DEFAULT_PRESENTER_PANELS, "current", 2);
  assert.equal(resized.find((panel) => panel.id === "current").span, 7);
  assert.equal(resized.find((panel) => panel.id === "next").span, 4);
});

test("movePresenterPanel reorders panels without losing them", () => {
  const moved = movePresenterPanel(DEFAULT_PRESENTER_PANELS, "notes", -2);
  assert.equal(moved.length, DEFAULT_PRESENTER_PANELS.length);
  assert.equal(moved[1].id, "notes");
});

test("getPresenterPanelLayoutMap preserves reordered panel sequence for rendering", () => {
  const moved = movePresenterPanel(DEFAULT_PRESENTER_PANELS, "outline", -2);
  const layoutMap = getPresenterPanelLayoutMap(moved);
  assert.equal(layoutMap.get("outline").order, 3);
  assert.equal(layoutMap.get("current").order, 0);
});

test("resizePresenterPanel collapses at minimum and restores from collapsed state", () => {
  const collapsed = resizePresenterPanel(
    [{ id: "timer", title: "Timer", span: 3, restoreSpan: 3, mode: "normal" }],
    "timer",
    -1,
  );
  assert.equal(collapsed[0].mode, "collapsed");

  const restored = resizePresenterPanel(collapsed, "timer", 1);
  assert.equal(restored[0].mode, "normal");
  assert.equal(restored[0].span, 3);
});

test("resizePresenterPanel enters fullscreen from max width and shrink exits fullscreen", () => {
  const layout = [
    { id: "current", title: "Current slide", span: 12, restoreSpan: 12, mode: "normal" },
    { id: "next", title: "Next slide", span: 4, restoreSpan: 4, mode: "normal" },
  ];
  const fullscreen = resizePresenterPanel(layout, "current", 1);
  assert.equal(fullscreen[0].mode, "fullscreen");
  assert.equal(fullscreen[1].mode, "collapsed");

  const restored = resizePresenterPanel(fullscreen, "current", -1);
  assert.equal(restored[0].mode, "normal");
  assert.equal(restored[1].mode, "normal");
  assert.equal(restored[1].span, 4);
});

test("expandPresenterPanel restores a collapsed panel using its saved span", () => {
  const expanded = expandPresenterPanel([
    { id: "notes", title: "Notes", span: 6, restoreSpan: 6, mode: "collapsed" },
  ], "notes");
  assert.equal(expanded[0].mode, "normal");
  assert.equal(expanded[0].span, 6);
});

test("savePresenterLayout and loadPresenterLayout round-trip through storage", () => {
  const storage = createStorageMock();
  const layout = movePresenterPanel(DEFAULT_PRESENTER_PANELS, "outline", -1);
  savePresenterLayout(layout, storage);
  const loaded = loadPresenterLayout(storage);
  assert.equal(loaded[4].id, "outline");
});

test("loadPresenterLayout falls back to defaults for invalid JSON", () => {
  const storage = createStorageMock("{invalid");
  const loaded = loadPresenterLayout(storage);
  assert.deepEqual(
    loaded.map((panel) => panel.id),
    DEFAULT_PRESENTER_PANELS.map((panel) => panel.id),
  );
});
