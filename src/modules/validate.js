import {
  parseDirectiveLine,
  canonicalDirectiveName,
  isSectionDirective,
  LAYOUT_DIRECTIVES,
  getUnexpectedModifiers,
} from "./directives.js";

const ERROR_CODES = new Set([
  "UNCLOSED_DIRECTIVE",
  "UNKNOWN_DIRECTIVE",
  "SEPARATOR_INSIDE_DIRECTIVE",
  "MALFORMED_DIRECTIVE_SECTIONS",
]);

const WARNING_CODES = new Set([
  "UNMATCHED_CLOSE",
  "UNKNOWN_MODIFIER",
  "MISSING_DIRECTIVE_SECTION",
]);

function normalizeSource(source) {
  return String(source || "").replaceAll("\r\n", "\n");
}

/**
 * Validate deck content against the authoring grammar. The walk mirrors
 * `src/modules/parser.js`'s slide-boundary logic so a deck that validates
 * cleanly parses exactly the way its author intended, and a deck that fails
 * gives a line-backed reason. Mirrors the parser's line-based behaviour (no
 * fenced-code awareness) to keep the two always in agreement.
 *
 * Returns `{ valid, errors, warnings }` where every issue carries a 1-based
 * `line` number, a stable `code`, and a human-readable `message`.
 */
export function validateDeck(source) {
  const normalized = normalizeSource(source);
  const frontMatterMatch = normalized.match(/^---\n[\s\S]*?\n---\n?/);
  const contentStart = frontMatterMatch ? frontMatterMatch[0].length : 0;
  const content = normalized.slice(contentStart);
  const lineOffset = (normalized.slice(0, contentStart).match(/\n/g) || []).length;

  const errors = [];
  const warnings = [];
  const stack = [];

  const lines = content.split("\n");

  function lineNumber(index) {
    return lineOffset + index + 1;
  }

  function pushError(code, line, directive, message) {
    errors.push({ code, line, directive, message });
  }

  function pushWarning(code, line, directive, message) {
    warnings.push({ code, line, directive, message });
  }

  function checkSectionCount(entry) {
    if (!entry.def || !entry.def.internalSlideSeparator) {
      return;
    }
    const count = entry.internalCount;
    const { minimumInternalSections, maximumInternalSections } = entry.def;
    if (count > maximumInternalSections) {
      pushError(
        "MALFORMED_DIRECTIVE_SECTIONS",
        entry.openLine,
        entry.canonical,
        `::${entry.canonical} uses internal \`---\` sections; expected at most ${maximumInternalSections} for this directive but found ${count}.`,
      );
    } else if (minimumInternalSections > 0 && count < minimumInternalSections) {
      pushWarning(
        "MISSING_DIRECTIVE_SECTION",
        entry.openLine,
        entry.canonical,
        `::${entry.canonical} normally separates content with an internal \`---\`; none was found.`,
      );
    }
  }

  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();

    if (trimmed === "::") {
      if (stack.length === 0) {
        pushWarning("UNMATCHED_CLOSE", lineNumber(i), null, "Closing `::` has no matching open directive.");
        continue;
      }
      const closing = stack.pop();
      checkSectionCount(closing);
      continue;
    }

    const opening = parseDirectiveLine(trimmed);

    if (opening) {
      const canonical = canonicalDirectiveName(opening.name);
      const isSection = isSectionDirective(canonical);
      const def = LAYOUT_DIRECTIVES[canonical];

      if (!isSection && !def) {
        pushError(
          "UNKNOWN_DIRECTIVE",
          lineNumber(i),
          opening.name,
          `Unknown directive ::${opening.name}; the renderer will treat it as plain text and slide splitting can break. Use a documented directive or remove the line.`,
        );
      } else {
        const unexpected = getUnexpectedModifiers(canonical, opening.modifiers);
        for (const modifier of unexpected) {
          pushWarning(
            "UNKNOWN_MODIFIER",
            lineNumber(i),
            canonical,
            `Modifier "${modifier}" is not recognised for ::${canonical} and is ignored by the renderer.`,
          );
        }
      }

      stack.push({
        name: opening.name,
        canonical,
        isSection,
        def,
        openLine: lineNumber(i),
        internalCount: 0,
      });
      continue;
    }

    if (trimmed !== "---") {
      continue;
    }

    if (stack.every((entry) => entry.isSection)) {
      stack.length = 0;
      continue;
    }

    const inner = stack[stack.length - 1];
    if (!inner) {
      continue;
    }

    if (inner.isSection) {
      continue;
    }

    if (inner.def && inner.def.internalSlideSeparator) {
      inner.internalCount += 1;
      continue;
    }

    const known = inner.def
      ? `::${inner.canonical}`
      : `::${inner.name} (not a supported directive)`;
    pushError(
      "SEPARATOR_INSIDE_DIRECTIVE",
      lineNumber(i),
      inner.canonical || inner.name,
      `A \`---\` has no meaning inside ${known}; it is silently swallowed and can collapse slides. Close the directive before starting a new slide.`,
    );
  }

  for (const entry of stack) {
    if (entry.isSection) {
      continue;
    }
    pushError(
      "UNCLOSED_DIRECTIVE",
      entry.openLine,
      entry.canonical || entry.name,
      `Directive ::${entry.canonical || entry.name} opened here is never closed with a \`::\` line; it swallows every following slide. Add a closing \`::\` before the next slide.`,
    );
    checkSectionCount(entry);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export { ERROR_CODES, WARNING_CODES };