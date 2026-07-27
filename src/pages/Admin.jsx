import { useEffect, useState } from "react";
import Header from "../components/Header";
import HeroBanner from "../components/HeroBanner";
import { useAuth } from "../context/AuthContext";
import { parseJsonSafely } from "../utils/http";

const TABS = [
  { key: "dashboard", label: "대시보드" },
  { key: "users", label: "유저 관리" },
];

const ROLE_LABELS = { admin: "관리자", user: "일반 유저" };

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("ko-KR");
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="material-symbols-outlined text-primary">{icon}</span>
        <p className="text-gray-600 text-sm font-medium">{label}</p>
      </div>
      <p className="text-3xl font-extrabold text-gray-900">{value}</p>
    </div>
  );
}

export default function Admin() {
  const { user: currentUser, token } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState("");

  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [pendingUserId, setPendingUserId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const res = await fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } });
        const data = await parseJsonSafely(res);
        if (!res.ok) throw new Error(data.message || "통계를 불러오지 못했습니다.");
        if (!cancelled) setStats(data);
      } catch (error) {
        if (!cancelled) setStatsError(error.message);
      } finally {
        if (!cancelled) setIsLoadingStats(false);
      }
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      try {
        const res = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } });
        const data = await parseJsonSafely(res);
        if (!res.ok) throw new Error(data.message || "유저 목록을 불러오지 못했습니다.");
        if (!cancelled) setUsers(data.users);
      } catch (error) {
        if (!cancelled) setUsersError(error.message);
      } finally {
        if (!cancelled) setIsLoadingUsers(false);
      }
    }

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function updateRole(targetUser, nextRole) {
    setPendingUserId(targetUser.id);
    try {
      const res = await fetch(`/api/admin/users?id=${targetUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await parseJsonSafely(res);
      if (!res.ok) throw new Error(data.message || "권한 변경에 실패했습니다.");
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? data.user : u)));
    } catch (error) {
      window.alert(error.message);
    } finally {
      setPendingUserId(null);
    }
  }

  async function deleteUser(targetUser) {
    const confirmed = window.confirm(
      `"${targetUser.name}"(${targetUser.email}) 계정을 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    );
    if (!confirmed) return;

    setPendingUserId(targetUser.id);
    try {
      const res = await fetch(`/api/admin/users?id=${targetUser.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseJsonSafely(res);
      if (!res.ok) throw new Error(data.message || "유저 삭제에 실패했습니다.");
      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
    } catch (error) {
      window.alert(error.message);
    } finally {
      setPendingUserId(null);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-on-surface">
      <Header />

      <main className="flex-1">
        <div className="max-w-container_max_width mx-auto px-4 md:px-8 lg:px-16 py-8 pb-16">
          <HeroBanner
            title={
              <>
                관리자 콘솔에서
                <br />
                DUDC를 운영하세요.
              </>
            }
            subtitle="가입자 현황을 확인하고 유저 권한을 관리할 수 있습니다."
            imageSrc="/img1.png"
            imageAlt="관리자"
          />

          <div className="mt-16 md:mt-20 flex justify-center">
            <div className="inline-flex bg-gray-100 rounded-full p-1 gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={
                    tab.key === activeTab
                      ? "px-8 py-3 rounded-full bg-primary text-white font-bold text-base transition-all"
                      : "px-8 py-3 rounded-full text-gray-500 font-bold text-base hover:text-gray-700 transition-all"
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "dashboard" ? (
            <section className="mt-12">
              {isLoadingStats ? (
                <p className="text-center text-gray-500 py-10">불러오는 중...</p>
              ) : statsError ? (
                <p className="text-center text-error py-10">{statsError}</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <StatCard icon="group" label="총 가입자 수" value={stats.totals.users} />
                    <StatCard icon="menu_book" label="업무 매뉴얼" value={stats.totals.workManuals} />
                    <StatCard icon="theater_comedy" label="문화 포스트" value={stats.totals.culturePosts} />
                    <StatCard icon="forum" label="커뮤니티 게시글" value={stats.totals.communityPosts} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
                      <h3 className="font-bold text-gray-900 mb-4">최근 신규 가입 유저</h3>
                      {stats.recentUsers.length === 0 ? (
                        <p className="text-sm text-gray-500">아직 가입자가 없습니다.</p>
                      ) : (
                        <ul className="space-y-3">
                          {stats.recentUsers.map((u) => (
                            <li key={u.id} className="flex items-center justify-between gap-2 text-sm">
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate">{u.name}</p>
                                <p className="text-gray-500 text-xs truncate">{u.email}</p>
                              </div>
                              <span className="text-gray-400 text-xs shrink-0">{formatDate(u.createdAt)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
                      <h3 className="font-bold text-gray-900 mb-4">최근 등록된 커뮤니티 게시글</h3>
                      {stats.recentCommunityPosts.length === 0 ? (
                        <p className="text-sm text-gray-500">아직 게시글이 없습니다.</p>
                      ) : (
                        <ul className="space-y-3">
                          {stats.recentCommunityPosts.map((p) => (
                            <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate">{p.title}</p>
                                <p className="text-gray-500 text-xs truncate">{p.authorName}</p>
                              </div>
                              <span className="text-gray-400 text-xs shrink-0">{formatDate(p.createdAt)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </>
              )}
            </section>
          ) : (
            <section className="mt-12">
              {isLoadingUsers ? (
                <p className="text-center text-gray-500 py-10">불러오는 중...</p>
              ) : usersError ? (
                <p className="text-center text-error py-10">{usersError}</p>
              ) : (
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-6 py-3 font-bold text-gray-700 whitespace-nowrap">이름</th>
                        <th className="text-left px-6 py-3 font-bold text-gray-700 whitespace-nowrap">이메일</th>
                        <th className="text-left px-6 py-3 font-bold text-gray-700 whitespace-nowrap">권한</th>
                        <th className="text-left px-6 py-3 font-bold text-gray-700 whitespace-nowrap">가입일</th>
                        <th className="text-right px-6 py-3 font-bold text-gray-700 whitespace-nowrap">관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => {
                        const isSelf = u.id === currentUser.id;
                        const isPending = pendingUserId === u.id;
                        return (
                          <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                            <td className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">{u.name}</td>
                            <td className="px-6 py-3 text-gray-600 whitespace-nowrap">{u.email}</td>
                            <td className="px-6 py-3 whitespace-nowrap">
                              <span
                                className={
                                  u.role === "admin"
                                    ? "px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold"
                                    : "px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-bold"
                                }
                              >
                                {ROLE_LABELS[u.role] ?? u.role}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                            <td className="px-6 py-3">
                              <div className="flex items-center justify-end gap-2">
                                {u.role === "admin" ? (
                                  <button
                                    onClick={() => updateRole(u, "user")}
                                    disabled={isSelf || isPending}
                                    title={isSelf ? "본인의 관리자 권한은 스스로 회수할 수 없습니다" : "권한 회수"}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-bold whitespace-nowrap hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    권한 회수
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => updateRole(u, "admin")}
                                    disabled={isPending}
                                    className="px-3 py-1.5 rounded-lg border border-primary text-primary text-xs font-bold whitespace-nowrap hover:bg-primary-fixed transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    관리자 부여
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteUser(u)}
                                  disabled={isSelf || isPending}
                                  title={isSelf ? "본인 계정은 삭제할 수 없습니다" : "유저 삭제"}
                                  className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-bold whitespace-nowrap hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  삭제
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
