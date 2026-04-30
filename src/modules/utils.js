/**
 * Removes the http:// or https:// protocol prefix from a URL string,
 * leaving the rest of the URL intact for display purposes.
 */
export function stripProtocol(value) {
  return String(value).replace(/^https?:\/\//, "");
}
