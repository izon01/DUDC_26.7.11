// Pure helpers for a manual's `spreads` ([{ left, right }, ...]) — a book is
// really a flat list of pages that the viewer lays out two at a time.
//
// Keep in sync with api/_lib/spreads.js (the server runs the same cleanup on
// save so stale clients can't write trailing blank pages either).

const INVISIBLE_CHARS = /&nbsp;|&#160;|[ ​‌‍﻿]/gi;
const MEDIA_TAG = /<(img|video|iframe|embed|object)[\s>/]/i;

// True when a page has nothing a reader could see: no text, no heading and no
// media. CKEditor emits `<p>&nbsp;</p>` for an "empty" page, which a plain
// tag-strip would count as content — hence the invisible-character cleanup.
export function isPageEmpty(page) {
  if (!page) return true;
  if (typeof page.heading === "string" && page.heading.trim()) return false;
  const html = typeof page.html === "string" ? page.html : "";
  if (MEDIA_TAG.test(html)) return false;
  const text = html.replace(/<[^>]*>/g, " ").replace(INVISIBLE_CHARS, " ").trim();
  return text.length === 0;
}

function toBlankPage(pageNum) {
  return { heading: "", html: "", pageNum };
}

// Flat page list: left, right of spread 0, then spread 1, and so on.
export function flattenSpreads(spreads) {
  return (spreads ?? []).flatMap((spread) => [spread?.left ?? null, spread?.right ?? null]);
}

// Normalizes spreads for display and for saving:
//  1. trailing blank pages are dropped (blank pages *between* content are kept
//     — they may be deliberate);
//  2. page numbers are renumbered 1..N from the real data, so the total is
//     always derived from the content, never from how many spreads exist;
//  3. an odd page count gets exactly one blank page so the last spread still
//     has a right-hand side; an entirely empty manual keeps one blank spread
//     so it can still be opened and edited.
export function normalizeSpreads(spreads) {
  const pages = flattenSpreads(spreads);

  let end = pages.length;
  while (end > 0 && isPageEmpty(pages[end - 1])) end -= 1;

  const kept = pages.slice(0, end).map((page, index) => ({
    heading: page?.heading ?? "",
    html: page?.html ?? "",
    pageNum: index + 1,
  }));

  if (kept.length === 0) {
    return [{ left: toBlankPage(1), right: toBlankPage(2) }];
  }
  if (kept.length % 2 === 1) kept.push(toBlankPage(kept.length + 1));

  const result = [];
  for (let i = 0; i < kept.length; i += 2) {
    result.push({ left: kept[i], right: kept[i + 1] });
  }
  return result;
}
