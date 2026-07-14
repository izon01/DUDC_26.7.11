import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function ProfileModal({ onClose }) {
  const { user, updateProfile } = useAuth();
  const [affiliation, setAffiliation] = useState(user?.affiliation || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initial = user?.name?.trim()?.charAt(0) || "?";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!affiliation.trim()) {
      setError("소속을 입력해주세요.");
      return;
    }
    if (password && password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({ affiliation: affiliation.trim(), password: password || undefined });
      setSuccessMessage("변경사항이 저장되었습니다.");
      setPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-8 py-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">프로필 설정</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-gray-500">close</span>
          </button>
        </div>

        <div className="px-8 pb-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-blue-700 text-white flex items-center justify-center text-2xl font-bold">
            {initial}
          </div>
          <p className="mt-3 font-bold text-gray-900">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
          {successMessage && (
            <div className="px-4 py-2.5 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm text-gray-600 mb-1.5 block" htmlFor="profile-affiliation">
              소속
            </label>
            <input
              id="profile-affiliation"
              type="text"
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              placeholder="예) 개발팀, 인사팀..."
              className="w-full bg-gray-50 border border-gray-300 rounded-lg focus:border-blue-700 focus:ring-0 text-sm px-4 py-2.5 transition-all"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1.5 block" htmlFor="profile-password">
              비밀번호
            </label>
            <input
              id="profile-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="변경하지 않으려면 비워두세요"
              className="w-full bg-gray-50 border border-gray-300 rounded-lg focus:border-blue-700 focus:ring-0 text-sm px-4 py-2.5 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-700 text-white py-3 rounded-lg font-bold hover:bg-blue-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "저장 중..." : "변경사항 저장"}
          </button>
        </form>
      </div>
    </div>
  );
}
