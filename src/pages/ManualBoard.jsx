import { useCallback, useEffect, useRef, useState } from "react";
import Header from "../components/Header";
import HeroBanner from "../components/HeroBanner";
import { useAuth } from "../context/AuthContext";
import { getCache, setCache } from "../utils/resourceCache";
import { parseJsonSafely } from "../utils/http";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

const CACHE_KEY = "manual-documents";

const DEPARTMENTS = [
  "기획혁신실",
  "안전관리실",
  "경영지원처",
  "미래공간개발처",
  "도시개발처",
  "공공건축처",
  "보상판매처",
  "주거복지처",
  "U레포츠센터",
  "청렴감사실",
];
const FILTER_CATEGORIES = ["전체", ...DEPARTMENTS];

// Split into two explicit rows of 6 and 5 so the second row centers on its
// own content instead of trailing off left-aligned under one flex-wrap run.
const CATEGORY_FILTER_ROW_1 = FILTER_CATEGORIES.slice(0, 6);
const CATEGORY_FILTER_ROW_2 = FILTER_CATEGORIES.slice(6);

// Per-department emoji + badge color for the document list rows only — the
// filter buttons above stay uniformly styled. Tailwind's JIT scanner needs
// each class name to appear as a literal substring somewhere in this file,
// so every color's classes are spelled out in full rather than interpolated
// from a `color` variable.
const CATEGORY_BADGE_STYLES = {
  기획혁신실: { emoji: "💡", className: "bg-indigo-50 text-indigo-700" },
  안전관리실: { emoji: "🛡️", className: "bg-orange-50 text-orange-700" },
  경영지원처: { emoji: "🤝", className: "bg-blue-50 text-blue-700" },
  미래공간개발처: { emoji: "🚀", className: "bg-purple-50 text-purple-700" },
  도시개발처: { emoji: "🏙️", className: "bg-teal-50 text-teal-700" },
  공공건축처: { emoji: "🏗️", className: "bg-amber-50 text-amber-700" },
  보상판매처: { emoji: "💰", className: "bg-green-50 text-green-700" },
  주거복지처: { emoji: "🏠", className: "bg-rose-50 text-rose-700" },
  U레포츠센터: { emoji: "⚽", className: "bg-sky-50 text-sky-700" },
  청렴감사실: { emoji: "⚖️", className: "bg-slate-100 text-slate-700" },
};

const ALLOWED_EXTENSIONS = ["pdf", "hwp", "docx", "xlsx"];
const MAX_FILE_BYTES = 1 * 1024 * 1024;

function formatDateDot(iso) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
}

function UploadDocumentModal({ isSubmitting, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(DEPARTMENTS[0]);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      window.alert("1MB 이하의 파일만 업로드 가능합니다.");
      e.target.value = "";
      setFile(null);
      return;
    }
    const ext = selected.name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      window.alert("PDF, HWP, DOCX, XLSX 파일만 업로드할 수 있습니다.");
      e.target.value = "";
      setFile(null);
      return;
    }
    setFile(selected);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !file) return;
    onSubmit({ title: title.trim(), category, file });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl border-2 border-outline-variant shadow-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-outline-variant flex items-center justify-between">
          <h2 className="text-headline-md font-headline-md text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">upload_file</span>
            매뉴얼 등록
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
          <div>
            <label className="text-label-sm font-label-sm text-on-surface-variant mb-2 block">부서</label>
            <div className="flex flex-wrap gap-2">
              {DEPARTMENTS.map((dept) => (
                <button
                  type="button"
                  key={dept}
                  onClick={() => setCategory(dept)}
                  className={
                    dept === category
                      ? "px-3 py-1.5 rounded-full text-[12px] font-bold border-2 border-primary bg-primary/10 text-primary"
                      : "px-3 py-1.5 rounded-full text-[12px] font-bold border-2 border-outline-variant text-on-surface-variant"
                  }
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-label-sm font-label-sm text-on-surface-variant mb-2 block" htmlFor="doc-title">
              제목
            </label>
            <input
              id="doc-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="매뉴얼 제목을 입력하세요"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-0 text-body-md px-3 py-2 transition-all"
              required
            />
          </div>

          <div>
            <label className="text-label-sm font-label-sm text-on-surface-variant mb-2 block" htmlFor="doc-file">
              파일 (PDF, HWP, DOCX, XLSX / 최대 1MB)
            </label>
            <input
              id="doc-file"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.hwp,.docx,.xlsx"
              onChange={handleFileChange}
              className="w-full text-body-md text-on-surface-variant file:mr-3 file:px-4 file:py-2 file:rounded-full file:border-0 file:bg-primary file:text-white file:font-bold file:text-label-sm file:cursor-pointer"
              required
            />
            {file && (
              <p className="text-[12px] text-on-surface-variant mt-2">
                {file.name} ({Math.ceil(file.size / 1024)}KB)
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-full border border-outline-variant text-on-surface-variant font-bold text-label-sm hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !file}
              className="px-6 py-2.5 rounded-full bg-primary text-white font-bold text-label-sm hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "등록 중..." : "등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManualBoard() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";

  const [documents, setDocumentsState] = useState(() => getCache(CACHE_KEY) ?? []);
  const [isLoading, setIsLoading] = useState(() => !getCache(CACHE_KEY));
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 500);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setDocuments = useCallback((updater) => {
    setDocumentsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setCache(CACHE_KEY, next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (getCache(CACHE_KEY)) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadDocuments() {
      try {
        const res = await fetch("/api/manual-documents");
        const data = await parseJsonSafely(res);
        if (!res.ok) throw new Error(data.message || "매뉴얼 목록을 불러오지 못했습니다.");
        if (cancelled) return;
        setDocuments(data.documents);
      } catch (error) {
        if (!cancelled) setLoadError(error.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadDocuments();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory = selectedCategory === "전체" || doc.category === selectedCategory;
    const query = debouncedSearchTerm.trim().toLowerCase();
    const matchesSearch = !query || doc.title.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  async function handleUpload({ title, category, file }) {
    setIsSubmitting(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const res = await fetch("/api/manual-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, category, filename: file.name, dataUrl }),
      });
      const data = await parseJsonSafely(res);
      if (!res.ok) throw new Error(data.message || "매뉴얼 등록에 실패했습니다.");
      setDocuments((prev) => [data.document, ...prev]);
      setIsUploadModalOpen(false);
    } catch (error) {
      window.alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`"${title}" 매뉴얼을 삭제하시겠습니까? 삭제된 파일은 복구할 수 없습니다.`)) return;
    try {
      const res = await fetch(`/api/manual-documents?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseJsonSafely(res);
      if (!res.ok) throw new Error(data.message || "매뉴얼 삭제에 실패했습니다.");
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (error) {
      window.alert(error.message);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-background font-body-md text-on-surface">
      <Header />

      <main className="flex-1 pt-2 pb-16 flex flex-col items-center px-4 md:px-8 lg:px-16 max-w-container_max_width mx-auto w-full">
        {/* Hero Banner */}
        <HeroBanner
          title={
            <>
              필요한 자료를
              <br />
              한 번에 찾아보세요.
            </>
          }
          subtitle={
            <>
              부서별 업무 매뉴얼과 서식을
              <br />
              내려받아 바로 확인해 보세요.
            </>
          }
          imageSrc="/img4.png"
          imageAlt="업무매뉴얼"
          className="mt-4"
        />

        {/* Search — its own full-width row */}
        <div className="w-full mt-6 shrink-0">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="매뉴얼 제목이나 내용을 검색해 보세요."
              className="w-full pl-11 pr-4 py-3 rounded-full border border-gray-200 bg-white shadow-sm focus:border-primary focus:ring-0 text-body-md transition-all"
            />
          </div>
        </div>

        {/* Category filter — two explicit rows (6 + 5) so the second row
            centers on its own 5 items instead of trailing off left-aligned
            under a single flex-wrap run. */}
        <div className="w-full mt-4 max-w-5xl mx-auto flex flex-col items-center gap-2.5 shrink-0">
          <div className="flex flex-wrap justify-center gap-2.5">
            {CATEGORY_FILTER_ROW_1.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={
                  cat === selectedCategory
                    ? "px-4 py-2 rounded-full text-label-sm font-bold bg-blue-900 text-white shadow-sm transition-colors"
                    : "px-4 py-2 rounded-full text-label-sm font-bold bg-white text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
                }
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            {CATEGORY_FILTER_ROW_2.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={
                  cat === selectedCategory
                    ? "px-4 py-2 rounded-full text-label-sm font-bold bg-blue-900 text-white shadow-sm transition-colors"
                    : "px-4 py-2 rounded-full text-label-sm font-bold bg-white text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Document List */}
        <div className="w-full mt-6 bg-white rounded-2xl border border-outline-variant shadow-sm px-6">
          {isAdmin && (
            <div className="w-full pt-5 pb-5 flex justify-end border-b border-outline-variant">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full font-bold text-label-sm hover:opacity-90 active:scale-95 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                매뉴얼 등록
              </button>
            </div>
          )}
          {isLoading ? (
            <p className="text-center text-on-surface-variant py-10">불러오는 중...</p>
          ) : loadError ? (
            <p className="text-center text-error py-10">{loadError}</p>
          ) : filteredDocuments.length === 0 ? (
            <p className="text-center text-on-surface-variant py-10">
              {documents.length === 0 ? "아직 등록된 매뉴얼이 없습니다." : "검색 결과가 없습니다."}
            </p>
          ) : (
            filteredDocuments.map((doc, idx) => (
              <div
                key={doc.id}
                className={`flex items-center gap-4 py-4 ${idx !== filteredDocuments.length - 1 ? "border-b border-outline-variant" : ""}`}
              >
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                    CATEGORY_BADGE_STYLES[doc.category]?.className ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {CATEGORY_BADGE_STYLES[doc.category] ? `${CATEGORY_BADGE_STYLES[doc.category].emoji} ` : ""}
                  {doc.category}
                </span>
                <span className="flex-1 min-w-0 font-bold text-on-surface truncate">{doc.title}</span>
                <span className="text-[12px] text-on-surface-variant shrink-0 hidden sm:inline">
                  {formatDateDot(doc.createdAt)}
                </span>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(doc.id, doc.title)}
                    title="삭제"
                    className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors shrink-0"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                )}
                <a
                  href={`${doc.fileUrl}?download=1`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-white text-[12px] font-bold hover:opacity-90 active:scale-95 transition-all shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  다운로드
                </a>
              </div>
            ))
          )}
        </div>
      </main>

      {isUploadModalOpen && (
        <UploadDocumentModal
          isSubmitting={isSubmitting}
          onClose={() => setIsUploadModalOpen(false)}
          onSubmit={handleUpload}
        />
      )}
    </div>
  );
}
