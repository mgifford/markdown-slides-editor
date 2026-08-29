import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { renderMarkdown } from "../../src/modules/markdown.js";

let markdownInput = "";
let renderedOutput = "";

Given("Markdown text {string}", function (text) {
  markdownInput = text;
});

Given("Markdown text containing an unordered list:", function (docString) {
  markdownInput = docString;
});

Given("Markdown text containing an ordered list:", function (docString) {
  markdownInput = docString;
});

Given("Markdown text containing display math:", function (docString) {
  markdownInput = docString;
});

Given("Markdown text containing a fenced code block:", function (docString) {
  markdownInput = docString;
});

When("I render the Markdown", function () {
  renderedOutput = renderMarkdown(markdownInput).html;
});

Then("the output contains {string}", function (expected) {
  assert.ok(
    renderedOutput.includes(expected),
    `Expected output to contain "${expected}", but got:\n${renderedOutput}`,
  );
});

Then("the output does not contain {string}", function (unexpected) {
  assert.ok(
    !renderedOutput.includes(unexpected),
    `Expected output NOT to contain "${unexpected}", but got:\n${renderedOutput}`,
  );
});
