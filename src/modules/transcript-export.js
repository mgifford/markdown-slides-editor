/**
 * Format a millisecond offset as a WebVTT timestamp (HH:MM:SS.mmm).
 * @param {number} ms - Milliseconds from the start of the session.
 * @returns {string} e.g. "00:01:23.456"
 */
export function formatVttTime(ms) {
  const totalMs = Math.max(0, Math.floor(ms));
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const millis = totalMs % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

/**
 * Build a WebVTT string from an array of timestamped transcript segments.
 *
 * @param {Array<{start: number, end: number, text: string}>} segments
 *   Each segment has start/end in milliseconds from the start of the session.
 * @returns {string} WebVTT file content.
 */
export function buildVttContent(segments) {
  const cues = (segments || []).filter((seg) => seg.text && seg.text.trim());

  if (cues.length === 0) {
    return "WEBVTT\n";
  }

  const cueBlocks = cues.map((seg, index) => {
    const start = formatVttTime(seg.start);
    const end = formatVttTime(seg.end > seg.start ? seg.end : seg.start + 1000);
    return `${index + 1}\n${start} --> ${end}\n${seg.text.trim()}`;
  });

  return `WEBVTT\n\n${cueBlocks.join("\n\n")}\n`;
}

/**
 * Build an LLM prompt to clean up a raw speech-to-text transcript.
 *
 * The prompt includes the raw transcript and the deck Markdown source so the
 * model can use slide terminology and names to fix badly recognised words.
 *
 * @param {string} rawTranscript - The full captured transcript text.
 * @param {string} markdownSource - The deck Markdown source for terminology context.
 * @returns {string} A structured LLM prompt.
 */
export function buildTranscriptCleanupPrompt(rawTranscript, markdownSource) {
  return `# Transcript cleanup request

Clean up the raw speech-to-text transcript below. The transcript may contain repetitions, filler words, poorly recognised terms, and speech disfluencies introduced by automatic transcription.

## Instructions

- Remove duplicate phrases and repeated sentences that are clearly repetitions from the speech-to-text engine restarting.
- Fix words or names that appear to be incorrectly transcribed, using the slide content below as a reference for correct terminology, names, and technical vocabulary.
- Correct obvious grammatical errors introduced by transcription.
- Preserve the speaker's meaning and intent.
- Format the cleaned transcript as readable paragraphs.
- Do not add headings, bullet points, or commentary unless the speaker clearly said them.
- Return only the cleaned transcript text.

## Slide content (for terminology reference)

\`\`\`md
${markdownSource || "[No slide content available]"}
\`\`\`

## Raw transcript

\`\`\`
${rawTranscript || "[No transcript text captured yet]"}
\`\`\`
`;
}
