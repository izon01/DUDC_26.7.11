import { useState } from "react";
import Header from "../components/Header";

const CATEGORY_STYLES = {
  사내소식: "bg-primary-fixed text-on-primary-fixed",
  자유게시판: "bg-secondary-container text-on-secondary-container",
  공지사항: "bg-tertiary-fixed text-on-tertiary-fixed",
};

const CATEGORIES = Object.keys(CATEGORY_STYLES);
const POSTS_PER_PAGE = 6;

const INITIAL_POSTS = [
  {
    id: 1,
    category: "사내소식",
    date: "1일 전",
    title: "신규 입사자 사내 식당 이용 가이드",
    excerpt: "오늘부터 적용되는 사내 식당 신규 이용 수칙과 결제 시스템 변경에 대한 안내 드립니다.",
    author: "김지윤 매니저",
    authorIcon: "person",
    comments: 8,
  },
  {
    id: 2,
    category: "자유게시판",
    date: "2일 전",
    title: "우리 팀만의 점심 회식 명소 추천",
    excerpt: "지난주 팀원들과 다녀온 회사 근처 숨은 맛집 3곳을 공유합니다. 가성비 최고예요!",
    author: "박승호 책임",
    authorIcon: "person",
    comments: 15,
  },
  {
    id: 3,
    category: "공지사항",
    date: "3일 전",
    title: "[필독] 이번 주 금요일 사내 대청소 안내",
    excerpt: "쾌적한 사무 환경을 위해 금요일 오후 4시부터 1시간 동안 부서별 대청소를 실시합니다.",
    author: "인사운영팀",
    authorIcon: "corporate_fare",
    comments: 4,
  },
  {
    id: 4,
    category: "자유게시판",
    date: "4일 전",
    title: "퇴근 후 러닝 크루 모집합니다",
    excerpt: "매주 수요일 저녁 7시, 회사 정문 앞 공원에서 가볍게 5km 뛰실 분들 모집해요!",
    author: "이민지 대리",
    authorIcon: "person",
    comments: 22,
  },
  {
    id: 5,
    category: "사내소식",
    date: "5일 전",
    title: "사내 도서관 신규 도서 목록 공유",
    excerpt: "자기계발서부터 소설까지 5월 신규 입고 도서 목록을 공유하오니 많은 이용 바랍니다.",
    author: "정동우 프로",
    authorIcon: "person",
    comments: 3,
  },
  {
    id: 6,
    category: "자유게시판",
    date: "1주일 전",
    title: "반려동물 자랑 타임! 제 고양이 보세요",
    excerpt: "저희 집 고양이가 너무 귀여워서 게시글 남깁니다. 다들 랜선 집사 되어보세요.",
    author: "최유리 주임",
    authorIcon: "person",
    comments: 42,
  },
  {
    id: 7,
    category: "사내소식",
    date: "2일 전",
    title: "DUDC 사내 도서관 신규 도서 목록 안내",
    excerpt: "이번 달 새롭게 입고된 도서들을 소개합니다. 자기계발부터 소설까지 다양한 장르를 만나보세요.",
    author: "정소연 주임",
    authorIcon: "person",
    comments: 0,
  },
  {
    id: 8,
    category: "공지사항",
    date: "4일 전",
    title: "신규 입사자 OJT 일정 및 강의실 안내",
    excerpt: "다음 주 진행되는 신규 입사자 교육 일정과 장소를 공지하오니 대상자분들은 확인 바랍니다.",
    author: "인사교육팀",
    authorIcon: "corporate_fare",
    comments: 2,
  },
  {
    id: 9,
    category: "공지사항",
    date: "1주 전",
    title: "전사 시스템 점검 안내 (금요일 야간)",
    excerpt: "안정적인 서비스 제공을 위해 이번 주 금요일 야간에 시스템 점검이 예정되어 있습니다.",
    author: "IT지원팀",
    authorIcon: "corporate_fare",
    comments: 1,
  },
];

function WriteModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [content, setContent] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSubmit({ title: title.trim(), category, excerpt: content.trim() });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl border-2 border-dashed border-outline-variant shadow-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-dashed border-outline-variant flex items-center justify-between">
          <h2 className="text-headline-md font-headline-md text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">edit_note</span>
            새 글 작성
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
            <label className="text-label-sm font-label-sm text-on-surface-variant mb-2 block">카테고리</label>
            <div className="flex gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={
                    cat === category
                      ? `px-3 py-1.5 rounded-full text-[12px] font-bold border-2 border-primary ${CATEGORY_STYLES[cat]}`
                      : "px-3 py-1.5 rounded-full text-[12px] font-bold border-2 border-dashed border-outline-variant text-on-surface-variant"
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-label-sm font-label-sm text-on-surface-variant mb-2 block" htmlFor="post-title">
              제목
            </label>
            <input
              id="post-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="w-full bg-surface-container-lowest border border-dashed border-outline-variant rounded-lg focus:border-primary focus:ring-0 text-body-md px-3 py-2 transition-all"
              required
            />
          </div>

          <div>
            <label className="text-label-sm font-label-sm text-on-surface-variant mb-2 block" htmlFor="post-content">
              내용
            </label>
            <textarea
              id="post-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              rows={5}
              className="w-full bg-surface-container-lowest border border-dashed border-outline-variant rounded-lg focus:border-primary focus:ring-0 text-body-md px-3 py-2 transition-all resize-none"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-full border border-outline-variant text-on-surface-variant font-bold text-label-sm hover:bg-surface-container-low transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-primary text-white font-bold text-label-sm hover:bg-primary/90 active:scale-95 transition-all"
            >
              등록
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Community() {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const visiblePosts = posts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  function handleCreatePost({ title, category, excerpt }) {
    setPosts((prev) => [
      {
        id: Date.now(),
        category,
        date: "방금 전",
        title,
        excerpt,
        author: "나 (신입사원)",
        authorIcon: "person",
        comments: 0,
      },
      ...prev,
    ]);
    setCurrentPage(1);
    setIsModalOpen(false);
  }

  return (
    <div className="h-screen w-full flex flex-col bg-background font-body-md text-on-surface overflow-hidden">
      <Header />

      <main className="flex-1 pt-2 pb-4 flex flex-col items-center px-margin_page max-w-[1400px] mx-auto w-full overflow-hidden">
        {/* Page Header */}
        <div className="w-full mt-4 mb-4 flex justify-between items-end shrink-0">
          <div>
            <h1 className="font-headline-lg text-on-surface">커뮤니티 광장</h1>
            <p className="text-on-surface-variant mt-1 text-label-sm">
              동료들과 자유롭게 소통하며 새로운 소식을 확인하세요.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2.5 bg-primary text-white rounded-full font-bold text-label-sm shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">edit_note</span>
            글쓰기
          </button>
        </div>

        {/* Post Grid */}
        <div className="w-full flex-1 overflow-y-auto custom-scroll pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {visiblePosts.map((post) => (
              <div
                key={post.id}
                className="bg-surface-container-lowest rounded-xl p-5 border border-dashed border-outline-variant card-shadow flex flex-col justify-between hover:border-primary/50 transition-colors cursor-pointer group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${CATEGORY_STYLES[post.category]}`}>
                      {post.category}
                    </span>
                    <span className="text-outline text-[11px]">{post.date}</span>
                  </div>
                  <h3 className="font-bold text-body-lg text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                    {post.title}
                  </h3>
                  <p className="text-on-surface-variant text-label-sm mt-2 line-clamp-2">{post.excerpt}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-dashed border-outline-variant flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                        {post.authorIcon}
                      </span>
                    </div>
                    <span className="text-label-sm font-medium">{post.author}</span>
                  </div>
                  <div className="flex items-center gap-1 text-outline">
                    <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                    <span className="text-[12px]">{post.comments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="w-full flex justify-center items-center gap-2 py-4 shrink-0">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-dashed border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-outline-variant disabled:hover:text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={
                  page === currentPage
                    ? "w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-white font-bold text-label-sm shadow-md shadow-primary/10"
                    : "w-10 h-10 flex items-center justify-center rounded-lg border border-dashed border-outline-variant text-on-surface-variant font-medium text-label-sm hover:border-primary hover:text-primary transition-all"
                }
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-dashed border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-outline-variant disabled:hover:text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        )}
      </main>

      {isModalOpen && <WriteModal onClose={() => setIsModalOpen(false)} onSubmit={handleCreatePost} />}
    </div>
  );
}
