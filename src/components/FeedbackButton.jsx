import { useCallback, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { FEEDBACK_TYPES } from "../utils/feedback";
import { parseJsonSafely } from "../utils/http";
import Toast from "./Toast";

const MAX_LENGTH = 2000;

function FeedbackModal({ pageTitle, onClose, onSubmitted }) {
  const { token } = useAuth();
  const [type, setType] = useState(FEEDBACK_TYPES[0].key);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("의견 내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pageTitle, type, content: content.trim() }),
      });
      const data = await parseJsonSafely(res);
      if (!res.ok) throw new Error(data.message || "의견 등록에 실패했습니다.");
      onSubmitted();
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-8 pt-6 pb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">의견 등록 및 문의하기</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="닫기"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-gray-500">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
          {error && (
            <div className="px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
          )}

          <div>
            <label className="text-sm text-gray-600 mb-1.5 block" htmlFor="feedback-page">
              대상 페이지
            </label>
            <input
              id="feedback-page"
              type="text"
              value={pageTitle}
              readOnly
              className="w-full bg-gray-100 border border-gray-200 rounded-lg text-sm px-4 py-2.5 text-gray-500 cursor-default focus:ring-0 focus:border-gray-200"
            />
          </div>

          <div>
            <span className="text-sm text-gray-600 mb-1.5 block">의견 유형</span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="의견 유형">
              {FEEDBACK_TYPES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="radio"
                  aria-checked={type === t.key}
                  onClick={() => setType(t.key)}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-colors ${
                    type === t.key
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1.5 block" htmlFor="feedback-content">
              의견 내용
            </label>
            <textarea
              id="feedback-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={MAX_LENGTH}
              rows={6}
              placeholder="개선 아이디어, 궁금한 점, 발견한 오류를 자유롭게 남겨주세요."
              className="w-full bg-gray-50 border border-gray-300 rounded-lg focus:border-primary focus:ring-0 text-sm px-4 py-3 transition-all resize-none"
            />
            <p className="mt-1 text-right text-xs text-gray-400">
              {content.length} / {MAX_LENGTH}
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "등록 중..." : "의견 등록"}
          </button>
        </form>
      </div>
    </div>
  );
}

// Square call-to-action pinned to the bottom of the manual sidebars. The
// target page is the human-readable breadcrumb ("업무 매뉴얼 > 서무의 정의")
// passed in by the host page, since only it knows which manual is open — no
// text-selection coupling, just a plain form.
export default function FeedbackButton({ pageTitle }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const hideToast = useCallback(() => setShowToast(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex flex-col items-center gap-1.5 px-4 py-4 rounded-xl bg-blue-800 text-white shadow-sm hover:bg-blue-900 active:scale-[0.98] transition-all"
      >
        <span className="material-symbols-outlined text-[24px]">rate_review</span>
        <span className="text-[13px] font-bold">의견 등록 및 문의하기</span>
      </button>

      {isOpen && (
        <FeedbackModal
          pageTitle={pageTitle}
          onClose={() => setIsOpen(false)}
          onSubmitted={() => {
            setIsOpen(false);
            setShowToast(true);
          }}
        />
      )}
      {showToast && <Toast message="의견이 등록되었습니다. 감사합니다!" onDone={hideToast} />}
    </>
  );
}
