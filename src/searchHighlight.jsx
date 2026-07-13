function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Wraps case-insensitive matches of `term` inside plain text with a
// highlighted <mark> — safe for sidebar titles/headings (no HTML parsing).
export function highlightText(text, term) {
  const trimmed = term?.trim();
  if (!trimmed || !text) return text;

  const re = new RegExp(`(${escapeRegExp(trimmed)})`, "gi");
  const parts = String(text).split(re);
  if (parts.length === 1) return text;

  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="bg-yellow-200 text-red-500 font-bold rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

// Wraps case-insensitive matches of `term` inside an HTML string with a
// highlighted <mark>, without touching tag syntax/attributes. Splits on tag
// boundaries first so only the plain-text chunks between tags are ever
// searched/replaced — the tags themselves pass through untouched.
export function highlightHtml(html, term) {
  const trimmed = term?.trim();
  if (!trimmed || !html) return html;

  const re = new RegExp(`(${escapeRegExp(trimmed)})`, "gi");
  return html
    .split(/(<[^>]+>)/g)
    .map((chunk) =>
      chunk.startsWith("<")
        ? chunk
        : chunk.replace(re, '<mark class="bg-yellow-200 text-red-500 font-bold rounded-sm px-0.5">$1</mark>')
    )
    .join("");
}
