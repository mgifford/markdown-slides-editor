#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { validateDeck } from "../src/modules/validate.js";

function usage() {
  console.log(
    "Usage: npm run validate:deck -- <file.md>\n       npm run validate:deck -- < deck.md",
  );
}

try {
  let source;
  const target = process.argv[2];

  if (target && target !== "-") {
    source = readFileSync(target, "utf8");
  } else {
    source = readFileSync(0, "utf8");
  }

  const report = validateDeck(source);
  const output = {
    valid: report.valid,
    errors: report.errors.map((issue) => `Line ${issue.line}: ${issue.message}`),
    warnings: report.warnings.map((issue) => `Line ${issue.line}: ${issue.message}`),
  };

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  process.exit(report.valid ? 0 : 1);
} catch (error) {
  usage();
  process.stderr.write(`\n${error.message}\n`);
  process.exit(2);
}