import { useEffect } from "react";

export default function Toast({ message, onDone, duration = 2500 }) {
  useEffect(() => {
    const timer = setTimeout(onDone, duration);
    return () => clearTimeout(timer);
  }, [onDone, duration]);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[80] px-5 py-3 bg-on-surface text-white rounded-full shadow-lg text-label-sm font-bold flex items-center gap-2 animate-fade-in">
      <span className="material-symbols-outlined text-[18px]">check_circle</span>
      {message}
    </div>
  );
}
