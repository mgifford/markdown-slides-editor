import test from "node:test";
import assert from "node:assert/strict";
import { getCurrentRoute } from "../src/modules/router.js";

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
