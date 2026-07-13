import { useEffect, useState } from "react";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";

const CATEGORY_STYLES = {
  공지사항: "bg-red-100 text-red-700",
  사내소식: "bg-blue-100 text-blue-700",
  자유게시판: "bg-green-100 text-green-700",
  기타: "bg-purple-100 text-purple-700",
};

const CATEGORIES = Object.keys(CATEGORY_STYLES);
const POSTS_PER_PAGE = 9;

async function parseJsonSafely(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function formatRelativeDate(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}

function WriteModal({ isSubmitting, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [content, setContent] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSubmit({ title: title.trim(), category, content: content.trim() });
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
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-full border border-outline-variant text-on-surface-variant font-bold text-label-sm hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
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

function PostDetailModal({
  post,
  comments,
  isLoading,
  currentUser,
  isSubmittingComment,
  onClose,
  onDeletePost,
  onSubmitComment,
  onDeleteComment,
}) {
  const [commentText, setCommentText] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) return;
    onSubmitComment(trimmed);
    setCommentText("");
  }

  const canDeletePost =
    post && currentUser && (currentUser.email === post.authorEmail || currentUser.role === "admin");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl border-2 border-dashed border-outline-variant shadow-2xl overflow-hidden flex flex-col animate-scale-in">
        {isLoading || !post ? (
          <div className="px-8 py-16 text-center text-on-surface-variant">불러오는 중...</div>
        ) : (
          <>
            <div className="px-8 py-6 border-b border-dashed border-outline-variant flex items-start justify-between shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${CATEGORY_STYLES[post.category]}`}>
                    {post.category}
                  </span>
                  <span className="text-outline text-[11px]">{formatRelativeDate(post.createdAt)}</span>
                </div>
                <h2 className="text-headline-md font-bold text-on-surface break-words">{post.title}</h2>
                <p className="text-label-sm text-on-surface-variant mt-1">{post.authorName}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                {canDeletePost && (
                  <button
                    onClick={onDeletePost}
                    title="삭제"
                    className="w-9 h-9 flex items-center justify-center rounded-full border border-outline-variant text-on-surface-variant hover:border-error hover:text-error transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">close</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6">
              <p className="text-body-lg text-on-surface whitespace-pre-wrap break-words mb-8">{post.content}</p>

              <div className="border-t border-dashed border-outline-variant pt-6">
                <h3 className="font-bold text-body-lg text-on-surface mb-4">댓글 {comments.length}개</h3>
                <div className="space-y-4 mb-6">
                  {comments.length === 0 && (
                    <p className="text-label-sm text-on-surface-variant">아직 댓글이 없습니다.</p>
                  )}
                  {comments.map((c) => {
                    const canDeleteComment =
                      currentUser && (currentUser.email === c.authorEmail || currentUser.role === "admin");
                    return (
                      <div
                        key={c.id}
                        className="p-4 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-label-sm text-on-surface">{c.authorName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-outline">{formatRelativeDate(c.createdAt)}</span>
                            {canDeleteComment && (
                              <button
                                onClick={() => onDeleteComment(c.id)}
                                title="삭제"
                                className="text-on-surface-variant hover:text-error transition-colors"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-label-sm text-on-surface-variant whitespace-pre-wrap break-words">
                          {c.content}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleSubmit} className="flex items-start gap-2">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="댓글을 입력하세요"
                    rows={2}
                    className="flex-1 bg-surface-container-lowest border border-dashed border-outline-variant rounded-lg px-3 py-2 text-label-sm focus:border-primary focus:ring-0 transition-all resize-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !commentText.trim()}
                    className="px-5 py-2.5 bg-primary text-white rounded-full font-bold text-label-sm hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    등록
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Community() {
  const { user, token } = useAuth();

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedPostDetail, setSelectedPostDetail] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      try {
        const res = await fetch("/api/community");
        const data = await parseJsonSafely(res);
        if (!res.ok) throw new Error(data.message || "게시글을 불러오지 못했습니다.");
        if (cancelled) return;
        setPosts(data.posts);
      } catch (error) {
        if (!cancelled) setLoadError(error.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadPosts();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedPostId) {
      setSelectedPostDetail(null);
      return;
    }

    let cancelled = false;
    setIsLoadingDetail(true);

    async function loadDetail() {
      try {
        const res = await fetch(`/api/community?id=${selectedPostId}`);
        const data = await parseJsonSafely(res);
        if (!res.ok) throw new Error(data.message || "게시글을 불러오지 못했습니다.");
        if (cancelled) return;
        setSelectedPostDetail(data);
      } catch (error) {
        if (!cancelled) window.alert(error.message);
      } finally {
        if (!cancelled) setIsLoadingDetail(false);
      }
    }

    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedPostId]);

  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const visiblePosts = posts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  async function handleCreatePost({ title, category, content }) {
    setIsSubmittingPost(true);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, category, content }),
      });
      const data = await parseJsonSafely(res);
      if (!res.ok) throw new Error(data.message || "글 작성에 실패했습니다.");
      setPosts((prev) => [data.post, ...prev]);
      setCurrentPage(1);
      setIsWriteModalOpen(false);
    } catch (error) {
      window.alert(error.message);
    } finally {
      setIsSubmittingPost(false);
    }
  }

  async function handleDeletePost() {
    if (!window.confirm("정말 이 게시글을 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.")) return;
    try {
      const res = await fetch(`/api/community?id=${selectedPostId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseJsonSafely(res);
      if (!res.ok) throw new Error(data.message || "게시글 삭제에 실패했습니다.");
      setPosts((prev) => prev.filter((p) => p.id !== selectedPostId));
      setSelectedPostId(null);
    } catch (error) {
      window.alert(error.message);
    }
  }

  async function handleSubmitComment(content) {
    setIsSubmittingComment(true);
    try {
      const res = await fetch("/api/community-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ postId: selectedPostId, content }),
      });
      const data = await parseJsonSafely(res);
      if (!res.ok) throw new Error(data.message || "댓글 등록에 실패했습니다.");
      setSelectedPostDetail((prev) => (prev ? { ...prev, comments: [...prev.comments, data.comment] } : prev));
      setPosts((prev) =>
        prev.map((p) => (p.id === selectedPostId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p))
      );
    } catch (error) {
      window.alert(error.message);
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId) {
    if (!window.confirm("이 댓글을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/community-comments?id=${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseJsonSafely(res);
      if (!res.ok) throw new Error(data.message || "댓글 삭제에 실패했습니다.");
      setSelectedPostDetail((prev) =>
        prev ? { ...prev, comments: prev.comments.filter((c) => c.id !== commentId) } : prev
      );
      setPosts((prev) =>
        prev.map((p) => (p.id === selectedPostId ? { ...p, commentCount: Math.max(0, (p.commentCount || 0) - 1) } : p))
      );
    } catch (error) {
      window.alert(error.message);
    }
  }

  return (
    <div className="h-screen w-full flex flex-col bg-background font-body-md text-on-surface overflow-hidden">
      <Header />

      <main className="flex-1 pt-2 pb-4 flex flex-col items-center px-margin_page max-w-container_max_width mx-auto w-full overflow-hidden">
        {/* Hero Banner */}
        <section className="w-full mt-4 min-h-[180px] bg-[#d2e4ff]/40 rounded-xl border-2 border-dotted border-outline-variant p-8 md:p-10 flex justify-between items-center relative shrink-0">
          <div className="z-10 flex flex-col gap-2">
            <h1 className="font-headline-xl text-[32px] md:text-[40px] text-on-surface leading-tight">커뮤니티 광장</h1>
            <p className="text-on-surface-variant font-body-md text-body-md max-w-[420px]">
              동료들과 자유롭게 소통하며 새로운 소식을 확인하세요.
            </p>
          </div>
          <div className="items-center justify-end hidden md:flex shrink-0">
            <span className="text-6xl select-none" aria-hidden="true">
              💬
            </span>
          </div>
        </section>

        {/* Write Button */}
        <div className="w-full flex justify-end mt-3 mb-3 shrink-0">
          <button
            onClick={() => setIsWriteModalOpen(true)}
            className="px-6 py-2.5 bg-primary text-white rounded-full font-bold text-label-sm shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">edit_note</span>
            글쓰기
          </button>
        </div>

        {/* Post Grid */}
        <div className="w-full flex-1 overflow-y-auto custom-scroll pb-4">
          {isLoading ? (
            <p className="text-center text-on-surface-variant py-10">불러오는 중...</p>
          ) : loadError ? (
            <p className="text-center text-error py-10">{loadError}</p>
          ) : posts.length === 0 ? (
            <p className="text-center text-on-surface-variant py-10">
              아직 등록된 글이 없습니다. 첫 글을 작성해보세요!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visiblePosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPostId(post.id)}
                  className="bg-surface-container-lowest rounded-xl p-5 border border-dashed border-outline-variant card-shadow flex flex-col justify-between hover:border-primary/50 transition-colors cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${CATEGORY_STYLES[post.category]}`}
                      >
                        {post.category}
                      </span>
                      <span className="text-outline text-[11px]">{formatRelativeDate(post.createdAt)}</span>
                    </div>
                    <h3 className="font-bold text-body-lg text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                      {post.title}
                    </h3>
                    <p className="text-on-surface-variant text-label-sm mt-2 line-clamp-2">{post.content}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-dashed border-outline-variant flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
                      </div>
                      <span className="text-label-sm font-medium">{post.authorName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-outline">
                      <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                      <span className="text-[12px]">{post.commentCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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

      {isWriteModalOpen && (
        <WriteModal
          isSubmitting={isSubmittingPost}
          onClose={() => setIsWriteModalOpen(false)}
          onSubmit={handleCreatePost}
        />
      )}

      {selectedPostId && (
        <PostDetailModal
          post={selectedPostDetail?.post}
          comments={selectedPostDetail?.comments || []}
          isLoading={isLoadingDetail}
          currentUser={user}
          isSubmittingComment={isSubmittingComment}
          onClose={() => setSelectedPostId(null)}
          onDeletePost={handleDeletePost}
          onSubmitComment={handleSubmitComment}
          onDeleteComment={handleDeleteComment}
        />
      )}
    </div>
  );
}
