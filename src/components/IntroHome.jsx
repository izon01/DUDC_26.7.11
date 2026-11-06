import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCache, setCache } from "../utils/resourceCache";
import { parseJsonSafely } from "../utils/http";
import FeedbackButton from "./FeedbackButton";

const LATEST_COUNT = 5;
const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// Same key ManualBoard keeps its full list under — sharing it means opening the
// board right after the home tab paints instantly (keep the two in sync).
const MANUALS_CACHE_KEY = "manual-documents-v2";
const CULTURE_LATEST_CACHE_KEY = "culture-posts-latest";

function formatDateDot(iso) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function isRecent(iso) {
  return Date.now() - new Date(iso).getTime() < NEW_WINDOW_MS;
}

async function fetchManuals() {
  const res = await fetch("/api/manual-documents");
  const data = await parseJsonSafely(res);
  if (!res.ok) throw new Error(data.message || "매뉴얼 목록을 불러오지 못했습니다.");
  return data.documents;
}

async function fetchLatestCulturePosts() {
  const res = await fetch(`/api/culture-posts?latest=${LATEST_COUNT}`);
  const data = await parseJsonSafely(res);
  if (!res.ok) throw new Error(data.message || "포스트 목록을 불러오지 못했습니다.");
  return data.posts;
}

// Paints from the in-memory cache when there is one, then always refetches so
// the home page never shows a list older than the page load.
function useLatestList(cacheKey, fetchList) {
  const [state, setState] = useState(() => {
    const cached = getCache(cacheKey);
    return { items: cached ?? [], isLoading: !cached, error: "" };
  });

  useEffect(() => {
    let cancelled = false;
    fetchList()
      .then((items) => {
        setCache(cacheKey, items);
        if (!cancelled) setState({ items, isLoading: false, error: "" });
      })
      .catch((error) => {
        if (!cancelled) setState((prev) => ({ ...prev, isLoading: false, error: error.message }));
      });
    return () => {
      cancelled = true;
    };
  }, [cacheKey, fetchList]);

  return state;
}

function LatestRow({ to, badge, title, createdAt }) {
  return (
    // Title on its own line (so it keeps the full card width, phones included),
    // category + date underneath.
    <Link to={to} className="block px-3 py-2.5 rounded-lg hover:bg-blue-50/60 transition-colors">
      <div className="flex items-center gap-2">
        <span className="flex-1 min-w-0 font-semibold text-gray-900 truncate">{title}</span>
        {isRecent(createdAt) && <span className="text-[11px] font-extrabold text-red-500 shrink-0">NEW</span>}
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
        {badge && <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold">{badge}</span>}
        <span className="tabular-nums">{formatDateDot(createdAt)}</span>
      </div>
    </Link>
  );
}

function LatestCard({ icon, title, description, moreTo, moreLabel, state, emptyText, renderRow }) {
  return (
    <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">{icon}</span>
          </span>
          <div className="min-w-0">
            <h3 className="font-bold text-lg text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 break-keep">{description}</p>
          </div>
        </div>
        <Link
          to={moreTo}
          className="shrink-0 text-sm font-bold text-primary hover:underline whitespace-nowrap mt-1"
        >
          {moreLabel} →
        </Link>
      </div>

      <div className="flex-1 border-t border-gray-100 pt-2">
        {state.isLoading ? (
          <div className="space-y-2 py-1" aria-busy="true">
            {Array.from({ length: LATEST_COUNT }, (_, i) => (
              <div key={i} className="h-11 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : state.error && state.items.length === 0 ? (
          <p className="text-center text-error text-sm py-10">{state.error}</p>
        ) : state.items.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">{emptyText}</p>
        ) : (
          <div className="divide-y divide-gray-50">{state.items.slice(0, LATEST_COUNT).map(renderRow)}</div>
        )}
      </div>
    </section>
  );
}

// Entry point for new hires: HQ photo on the right fading into white under the
// copy (on phones the photo sits behind the text under a heavier white wash).
function WorkStartBanner() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-blue-100/60 bg-white shadow-sm min-h-[220px] flex items-center">
      <img
        src="/dudc-building.jpg"
        alt=""
        aria-hidden="true"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-[70%_45%] md:left-auto md:right-0 md:w-[68%]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/85 to-white/45 md:bg-gradient-to-r md:from-white md:from-35% md:via-white/75 md:to-transparent" />

      <div className="relative px-6 py-8 sm:px-10 md:px-12 break-keep">
        <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-primary text-[13px] font-bold">
          업무첫걸음
        </span>
        <h2 className="mt-4 text-2xl sm:text-[28px] font-extrabold text-gray-900 leading-snug">
          처음 맡는 업무,
          <br />
          <span className="text-primary">여기서부터 시작하세요.</span>
        </h2>
        <p className="mt-3 text-[15px] text-gray-600 leading-relaxed max-w-md">
          신입직원이 꼭 알아야 할 공통업무를 차근차근 안내합니다.
        </p>
        <Link
          to="/work-manual"
          className="mt-6 inline-flex items-center gap-2 h-12 px-6 rounded-full bg-white border border-gray-200 shadow-md text-[15px] font-bold text-gray-900 hover:bg-gray-50 active:scale-95 transition-all"
        >
          업무첫걸음 바로가기
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </Link>
      </div>
    </section>
  );
}

export default function IntroHome() {
  const manuals = useLatestList(MANUALS_CACHE_KEY, fetchManuals);
  const culturePosts = useLatestList(CULTURE_LATEST_CACHE_KEY, fetchLatestCulturePosts);

  return (
    <section className="mt-12">
      <WorkStartBanner />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LatestCard
          icon="folder_open"
          title="업무매뉴얼"
          description="최근 등록된 매뉴얼"
          moreTo="/manual-board"
          moreLabel="전체 보기"
          state={manuals}
          emptyText="아직 등록된 매뉴얼이 없습니다."
          renderRow={(doc) => (
            <LatestRow key={doc.id} to="/manual-board" badge={doc.category} title={doc.title} createdAt={doc.createdAt} />
          )}
        />
        <LatestCard
          icon="auto_stories"
          title="DUDC문화"
          description="최근 올라온 문화 포스트"
          moreTo="/culture-manual"
          moreLabel="전체 보기"
          state={culturePosts}
          emptyText="아직 등록된 포스트가 없습니다."
          renderRow={(post) => (
            <LatestRow
              key={post.id}
              to={`/culture-manual?post=${encodeURIComponent(post.id)}`}
              title={post.title}
              createdAt={post.createdAt}
            />
          )}
        />
      </div>

      <div className="mt-6 bg-[#F5F8FF] border border-blue-100/60 rounded-2xl px-6 py-6 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg text-gray-900">찾는 내용이 없으신가요?</h3>
          <p className="text-sm text-gray-600 mt-1 break-keep">
            필요한 매뉴얼이나 궁금한 점을 남겨 주세요. 남겨 주신 의견은 관리자가 확인합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <FeedbackButton variant="fab" pageTitle="DUDC소개 > 홈" />
          <Link
            to="/community"
            className="h-12 px-5 inline-flex items-center rounded-full border border-gray-300 bg-white text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            커뮤니티에서 질문하기
          </Link>
        </div>
      </div>
    </section>
  );
}
