import test from "node:test";
import assert from "node:assert/strict";
import { getCurrentRoute, restoreRedirectPath } from "../src/modules/router.js";

test("getCurrentRoute returns editor for the root path", () => {
  assert.equal(getCurrentRoute("/"), "editor");
});

test("getCurrentRoute returns editor for empty or falsy path", () => {
  assert.equal(getCurrentRoute(""), "editor");
  assert.equal(getCurrentRoute(null), "editor");
  assert.equal(getCurrentRoute(undefined), "editor");
});

test("getCurrentRoute returns present for /present", () => {
  assert.equal(getCurrentRoute("/present"), "present");
});

test("getCurrentRoute strips trailing slash before matching /present", () => {
  assert.equal(getCurrentRoute("/present/"), "present");
});

test("getCurrentRoute returns presenter for /presenter", () => {
  assert.equal(getCurrentRoute("/presenter"), "presenter");
});

test("getCurrentRoute strips trailing slash before matching /presenter", () => {
  assert.equal(getCurrentRoute("/presenter/"), "presenter");
});

test("getCurrentRoute matches /present and /presenter as suffixes of longer paths", () => {
  assert.equal(getCurrentRoute("/some/path/present"), "present");
  assert.equal(getCurrentRoute("/some/path/presenter"), "presenter");
});

test("getCurrentRoute returns editor for paths that only partially resemble present or presenter", () => {
  assert.equal(getCurrentRoute("/presently"), "editor");
  assert.equal(getCurrentRoute("/present-slides"), "editor");
  assert.equal(getCurrentRoute("/presenter-view"), "editor");
  assert.equal(getCurrentRoute("/about"), "editor");
});

test("getCurrentRoute prefers presenter over present when both suffixes are possible", () => {
  assert.equal(getCurrentRoute("/foo/presenter"), "presenter");
});

test("restoreRedirectPath does nothing when redirect flag is missing", (t) => {
  const originalWindow = globalThis.window;
  const replaceCalls = [];
  globalThis.window = {
    location: { search: "?pathname=%2Fpresent" },
    history: {
      replaceState(state, title, url) {
        replaceCalls.push({ state, title, url });
      },
    },
  };

  t.after(() => {
    globalThis.window = originalWindow;
  });

  restoreRedirectPath();
  assert.equal(replaceCalls.length, 0);
});

test("restoreRedirectPath restores pathname, search, and hash from redirect params", (t) => {
  const originalWindow = globalThis.window;
  const replaceCalls = [];
  globalThis.window = {
    location: { search: "?redirect=1&pathname=%2Fpresenter&search=%3Fslide%3D4&hash=%234.1" },
    history: {
      replaceState(state, title, url) {
        replaceCalls.push({ state, title, url });
      },
    },
  };

  t.after(() => {
    globalThis.window = originalWindow;
  });

  restoreRedirectPath();
  assert.equal(replaceCalls.length, 1);
  assert.deepEqual(replaceCalls[0], { state: {}, title: "", url: "/presenter?slide=4#4.1" });
});

test("restoreRedirectPath defaults to root when redirect pathname is missing", (t) => {
  const originalWindow = globalThis.window;
  const replaceCalls = [];
  globalThis.window = {
    location: { search: "?redirect=1" },
    history: {
      replaceState(state, title, url) {
        replaceCalls.push({ state, title, url });
      },
    },
  };

  t.after(() => {
    globalThis.window = originalWindow;
  });

  restoreRedirectPath();
  assert.equal(replaceCalls.length, 1);
  assert.equal(replaceCalls[0].url, "/");
});
