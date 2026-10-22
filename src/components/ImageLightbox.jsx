import { useEffect } from "react";

// Full-screen image viewer. Closes on the X button, a click on the dark
// backdrop, or Esc; a click on the image itself does nothing.
export default function ImageLightbox({ src, alt, onClose }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

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
        onClick={(e) => e.stopPropagation()}
        className="max-w-[90vw] max-h-[90vh] object-contain rounded shadow-2xl cursor-default"
      />
    </div>
  );
}
