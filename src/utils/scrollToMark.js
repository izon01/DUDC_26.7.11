// Centers a highlighted match inside the scrollable pane that contains it.
// Scrolls that pane directly rather than calling scrollIntoView, which would
// also scroll overflow-hidden ancestors (the book stage / reader card) and
// shift the whole layout.
function centerMarkInScroller(mark, scrollerSelector, behavior) {
  const scroller = mark.closest(scrollerSelector);
  if (!scroller) return;
  const scrollerRect = scroller.getBoundingClientRect();
  const markRect = mark.getBoundingClientRect();
  const top = markRect.top - scrollerRect.top + scroller.scrollTop - scroller.clientHeight / 2 + markRect.height / 2;
  scroller.scrollTo({ top: Math.max(0, top), behavior });
}

// Finds the first <mark> inside `scopeSelector` (document order) and scrolls
// it to the middle of its `scrollerSelector` pane.
export function scrollFirstMarkIntoView({ scopeSelector, scrollerSelector }) {
  const mark = document.querySelector(`${scopeSelector} mark`);
  if (!mark) return;
  centerMarkInScroller(mark, scrollerSelector, "smooth");

  // Images above the match that finish loading after we scrolled would push
  // it off-center, so re-center once each late image arrives (for a few
  // seconds only — never fight a reader who has started scrolling).
  const scroller = mark.closest(scrollerSelector);
  const deadline = Date.now() + 4000;
  scroller?.querySelectorAll("img").forEach((img) => {
    if (img.complete) return;
    img.addEventListener(
      "load",
      () => {
        if (mark.isConnected && Date.now() < deadline) centerMarkInScroller(mark, scrollerSelector, "auto");
      },
      { once: true }
    );
  });
}
