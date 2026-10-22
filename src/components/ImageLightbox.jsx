import { useEffect, useState } from "react";

const VIEWPORT_FILL = 0.9;

// Largest size that fits inside 90% of the viewport at the image's own aspect
// ratio — scaling up as well as down, so a small screenshot is enlarged to
// fill the screen. (max-w/max-h alone only ever shrink an image.)
function fitToViewport(natural) {
  if (!natural) return null;
  const scale = Math.min(
    (window.innerWidth * VIEWPORT_FILL) / natural.width,
    (window.innerHeight * VIEWPORT_FILL) / natural.height
  );
  return { width: Math.round(natural.width * scale), height: Math.round(natural.height * scale) };
}

// Full-screen image viewer. Closes on the X button, a click on the dark
// backdrop, or Esc; a click on the image itself does nothing.
export default function ImageLightbox({ src, alt, onClose }) {
  const [natural, setNatural] = useState(null);
  const [, setViewportTick] = useState(0);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    function onResize() {
      setViewportTick((n) => n + 1);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [onClose]);

  const size = fitToViewport(natural);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="이미지 확대 보기"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 animate-fade-in cursor-zoom-out"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-[28px]">close</span>
      </button>
      <img
        src={src}
        alt={alt || ""}
        onLoad={(e) => setNatural({ width: e.target.naturalWidth, height: e.target.naturalHeight })}
        onClick={(e) => e.stopPropagation()}
        style={size ?? undefined}
        // Until the image loads there's no size to fit to, so fall back to
        // the shrink-only caps; afterwards the explicit size wins.
        className="max-w-[90vw] max-h-[90vh] object-contain rounded shadow-2xl cursor-default"
      />
    </div>
  );
}
