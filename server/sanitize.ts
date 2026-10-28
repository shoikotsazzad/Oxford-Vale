import sanitizeHtml from "sanitize-html";

/** Strip all HTML from user text and normalise whitespace. Apply to every free-text field before saving. */
export function cleanText(input: string, { multiline = false } = {}): string {
  const stripped = sanitizeHtml(input, { allowedTags: [], allowedAttributes: {}, disallowedTagsMode: "discard" })
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return multiline
    ? stripped.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim()
    : stripped.replace(/\s+/g, " ").trim();
}

/** Clean every string value of a flat object. */
export function cleanFields<T extends Record<string, unknown>>(obj: T, multilineKeys: (keyof T)[] = []): T {
  const out = { ...obj };
  for (const k of Object.keys(out) as (keyof T)[]) {
    const v = out[k];
    if (typeof v === "string") out[k] = cleanText(v, { multiline: multilineKeys.includes(k) }) as T[keyof T];
  }
  return out;
}
