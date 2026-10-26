import { escapeRegExp } from "../searchHighlight";
import { stripHtml } from "./html";
import { flattenSpreads, normalizeSpreads } from "./manualPages";

const ENTITIES = { "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };

// Readable single-line text of one page (tags stripped, common entities
// decoded, whitespace collapsed) — what a search snippet is cut from.
function pagePlainText(page) {
  const heading = typeof page?.heading === "string" ? page.heading : "";
  const body = stripHtml(page?.html || "").replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;/g, (m) => ENTITIES[m]);
  return `${heading} ${body}`.replace(/\s+/g, " ").trim();
}

// A short excerpt around the match: a little context before it, a bit more
// after, with "…" where the text was cut. Sized for a two-line sidebar row.
function makeSnippet(text, index, length) {
  const start = Math.max(0, index - 18);
  const end = Math.min(text.length, index + length + 42);
  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}

// Finds where `term` first appears in a manual's body, in reading order.
// Returns { spreadIndex, pageNum, snippet } for that page, or null when the
// term is only in the title (or absent). spreadIndex is relative to the
// normalized spreads, i.e. the same pages the reader actually shows.
export function findFirstMatch(manual, term) {
  const trimmed = term?.trim();
  if (!trimmed) return null;

  const re = new RegExp(escapeRegExp(trimmed), "i");
  const pages = flattenSpreads(normalizeSpreads(manual.spreads));

  for (let i = 0; i < pages.length; i += 1) {
    const text = pagePlainText(pages[i]);
    const match = re.exec(text);
    if (match) {
      return {
        spreadIndex: Math.floor(i / 2),
        pageNum: i + 1,
        snippet: makeSnippet(text, match.index, match[0].length),
      };
    }
  }
  return null;
}
