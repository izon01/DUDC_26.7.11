// Keys must match FEEDBACK_TYPES / STATUSES in api/feedback.js and
// api/admin/feedback.js.
export const FEEDBACK_TYPES = [
  { key: "improvement", label: "개선사항", badge: "bg-blue-50 text-blue-700" },
  { key: "inquiry", label: "문의사항", badge: "bg-emerald-50 text-emerald-700" },
  { key: "bug", label: "오류 신고", badge: "bg-red-50 text-red-600" },
  { key: "other", label: "기타", badge: "bg-gray-100 text-gray-600" },
];

export const FEEDBACK_STATUSES = [
  { key: "received", label: "접수", style: "bg-gray-100 text-gray-700 border-gray-200" },
  { key: "in_progress", label: "처리중", style: "bg-amber-50 text-amber-700 border-amber-200" },
  { key: "done", label: "처리완료", style: "bg-emerald-50 text-emerald-700 border-emerald-200" },
];

export function getFeedbackType(key) {
  return FEEDBACK_TYPES.find((t) => t.key === key) ?? FEEDBACK_TYPES[FEEDBACK_TYPES.length - 1];
}
