export function stripHtml(html) {
  return html.replace(/<[^>]*>/g, " ");
}

// True if the HTML has visible text or an image. Text-only checks treat an
// image-only page as empty, since an <img> contributes no characters.
export function hasVisibleContent(html) {
  const source = html || "";
  return stripHtml(source).trim().length > 0 || /<img[\s>]/i.test(source);
}
