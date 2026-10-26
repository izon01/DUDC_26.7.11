// Server-side twin of src/utils/manualPages.js (normalizeSpreads). Applied on
// every save so trailing blank pages never reach the database, whatever the
// client sent. Keep the two in sync.

const INVISIBLE_CHARS = /&nbsp;|&#160;|[ ​‌‍﻿]/gi;
const MEDIA_TAG = /<(img|video|iframe|embed|object)[\s>/]/i;

function isPageEmpty(page) {
  if (!page || typeof page !== "object") return true;
  if (typeof page.heading === "string" && page.heading.trim()) return false;
  const html = typeof page.html === "string" ? page.html : "";
  if (MEDIA_TAG.test(html)) return false;
  return html.replace(/<[^>]*>/g, " ").replace(INVISIBLE_CHARS, " ").trim().length === 0;
}

function blankPage(pageNum) {
  return { heading: "", html: "", pageNum };
}

export function normalizeSpreads(spreads) {
  const pages = spreads.flatMap((spread) => [spread?.left ?? null, spread?.right ?? null]);

  let end = pages.length;
  while (end > 0 && isPageEmpty(pages[end - 1])) end -= 1;

  const kept = pages.slice(0, end).map((page, index) => ({
    heading: typeof page?.heading === "string" ? page.heading : "",
    html: typeof page?.html === "string" ? page.html : "",
    pageNum: index + 1,
  }));

  if (kept.length === 0) return [{ left: blankPage(1), right: blankPage(2) }];
  if (kept.length % 2 === 1) kept.push(blankPage(kept.length + 1));

  const result = [];
  for (let i = 0; i < kept.length; i += 2) result.push({ left: kept[i], right: kept[i + 1] });
  return result;
}
