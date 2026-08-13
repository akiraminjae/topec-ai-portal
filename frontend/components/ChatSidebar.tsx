"use client";

// 좌측 채팅 사이드바 — 구축계획서 원본 PDF의 Agentic OS 클라이언트 화면(새 대화 · 프로젝트 ·
// 에이전트 목록 · 최근 대화 · 사용자 프로필)을 그대로 재현.
// 에이전트 핀 해제, 최근 대화 삭제·프로젝트로 이동은 실제로 동작하며 localStorage에 저장됩니다.
// TODO(개발팀): agent_lifecycle_service, observability_service 등과 연동해 서버 저장으로 교체

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthUser, authHeaders, clearAuth, getToken, getUser } from "@/lib/auth";

type Agent = { icon: string; name: string; href: string | null };
type Chat = { id: string; title: string; projectId: string | null };

const PROJECTS = ["2026 재무 보고", "신규 제품 출시"];

const DEFAULT_AGENTS: Agent[] = [
  { icon: "H", name: "Ara", href: null },
  { icon: "📄", name: "문서 분석", href: "/document-agent" },
  { icon: "✉️", name: "이메일 비서", href: "/agents/email" },
  { icon: "🗓️", name: "일정 관리", href: "/agents/calendar" },
];

const DEFAULT_CHATS: Chat[] = [
  { id: "c1", title: "Q2 재무 리포트 초안", projectId: null },
  { id: "c2", title: "계약서 독소조항 검토", projectId: null },
  { id: "c3", title: "경쟁사 동향 메모", projectId: null },
  { id: "c4", title: "신규 입사자 안내 메일", projectId: null },
  { id: "c5", title: "재무 대시보드 지표 정의", projectId: null },
  { id: "c6", title: "납품 계약서 비교", projectId: null },
  { id: "c7", title: "주간 일정 정리", projectId: null },
];

const AGENTS_KEY = "topec_pinned_agents_v1";
const CHATS_KEY = "topec_chats_v1";

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function ChatSidebar() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS);
  const [chats, setChats] = useState<Chat[]>(DEFAULT_CHATS);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [moveSubmenu, setMoveSubmenu] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setAgents(loadFromStorage(AGENTS_KEY, DEFAULT_AGENTS));
    setChats(loadFromStorage(CHATS_KEY, DEFAULT_CHATS));
    setHydrated(true);

    if (!getToken()) {
      router.push("/login");
      return;
    }
    setUser(getUser());
  }, [router]);

  async function logout() {
    try {
      await fetch("/api/services/auth/auth/logout", { method: "POST", headers: authHeaders() });
    } finally {
      clearAuth();
      router.push("/login");
    }
  }

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(AGENTS_KEY, JSON.stringify(agents));
  }, [agents, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  }, [chats, hydrated]);

  function removeAgent(name: string) {
    setAgents((prev) => prev.filter((a) => a.name !== name));
  }

  function deleteChat(id: string) {
    setChats((prev) => prev.filter((c) => c.id !== id));
    closeMenus();
  }

  function moveChat(id: string, projectId: string) {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, projectId } : c)));
    setExpandedProjects((prev) => new Set(prev).add(projectId));
    closeMenus();
  }

  function closeMenus() {
    setOpenMenu(null);
    setMoveSubmenu(null);
  }

  function toggleProject(p: string) {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  const unassignedChats = chats.filter((c) => !c.projectId);

  return (
    <aside className="relative flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      {openMenu && <div className="fixed inset-0 z-30" onClick={closeMenus} />}

      <div className="flex items-center justify-between px-4 py-4">
        <div>
          <div className="text-[11px] font-bold tracking-wide text-steel">TOPEC</div>
          <div className="text-sm font-bold text-navy">AI 포털</div>
        </div>
        <span className="cursor-pointer text-slate-300">⟨⟩</span>
      </div>

      <div className="px-3">
        <button className="mb-2 w-full rounded-xl bg-iceLight px-3 py-2 text-left text-sm font-semibold text-navy hover:bg-ice">
          + 새 대화
        </button>
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-400">
          <span>🔍</span> 채팅 검색
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-3 text-sm">
        <div>
          <div className="mb-1 px-1 text-[11px] font-semibold text-slate-400">프로젝트</div>
          {PROJECTS.map((p) => {
            const projectChats = chats.filter((c) => c.projectId === p);
            const expanded = expandedProjects.has(p);
            return (
              <div key={p}>
                <button
                  onClick={() => toggleProject(p)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-600 hover:bg-slate-50"
                >
                  <span className="truncate">📁 {p}</span>
                  {projectChats.length > 0 && (
                    <span className="shrink-0 text-[10px] text-slate-300">
                      {expanded ? "▾" : "▸"} {projectChats.length}
                    </span>
                  )}
                </button>
                {expanded && projectChats.length > 0 && (
                  <div className="ml-4 space-y-0.5 border-l border-slate-100 pl-2">
                    {projectChats.map((c) => (
                      <div key={c.id} className="truncate rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-50">
                        {c.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div>
          <div className="mb-1 px-1 text-[11px] font-semibold text-slate-400">에이전트</div>
          {agents.map((a) => (
            <div
              key={a.name}
              className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-slate-600 hover:bg-slate-50"
            >
              {a.href ? (
                <Link href={a.href} className="flex flex-1 items-center gap-2 truncate">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-[11px]">
                    {a.icon}
                  </span>
                  <span className="truncate">{a.name}</span>
                </Link>
              ) : (
                <span className="flex flex-1 items-center gap-2 truncate">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-[11px]">
                    {a.icon}
                  </span>
                  <span className="truncate">{a.name}</span>
                </span>
              )}
              <button
                onClick={() => removeAgent(a.name)}
                title="에이전트 목록에서 삭제"
                className="hidden shrink-0 text-slate-300 hover:text-red-400 group-hover:block"
              >
                ✕
              </button>
            </div>
          ))}
          {agents.length === 0 && <div className="px-2 py-1.5 text-xs text-slate-300">고정된 에이전트가 없습니다.</div>}
          <Link href="/marketplace" className="block rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-50">
            에이전트 더보기 ›
          </Link>
        </div>

        <div>
          <div className="mb-1 px-1 text-[11px] font-semibold text-slate-400">최근 대화</div>
          {unassignedChats.map((c) => (
            <div
              key={c.id}
              className="group relative flex items-center rounded-lg px-2 py-1.5 text-slate-600 hover:bg-slate-50"
            >
              <span className="flex-1 truncate">{c.title}</span>
              <button
                onClick={() => {
                  setOpenMenu(openMenu === c.id ? null : c.id);
                  setMoveSubmenu(null);
                }}
                className={`shrink-0 text-slate-300 hover:text-navy ${openMenu === c.id ? "block" : "hidden group-hover:block"}`}
              >
                ⋯
              </button>

              {openMenu === c.id && (
                <div className="absolute right-0 top-7 z-40 w-44 rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-lg">
                  <button
                    onClick={() => setMoveSubmenu(moveSubmenu === c.id ? null : c.id)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-slate-600 hover:bg-iceLight"
                  >
                    프로젝트로 이동 <span>{moveSubmenu === c.id ? "▾" : "›"}</span>
                  </button>
                  {moveSubmenu === c.id && (
                    <div className="space-y-0.5 border-t border-slate-100 py-1">
                      {PROJECTS.map((p) => (
                        <button
                          key={p}
                          onClick={() => moveChat(c.id, p)}
                          className="block w-full truncate rounded-lg px-3 py-1.5 text-left text-slate-500 hover:bg-iceLight"
                        >
                          📁 {p}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => deleteChat(c.id)}
                    className="mt-1 block w-full rounded-lg px-3 py-1.5 text-left text-red-500 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          ))}
          {unassignedChats.length === 0 && (
            <div className="px-2 py-1.5 text-xs text-slate-300">최근 대화가 없습니다.</div>
          )}
        </div>
      </nav>

      <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
          {(user?.name || user?.email || "?").slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1 text-xs">
          <div className="truncate font-semibold text-navy">{user?.name || user?.email || "로그인 필요"}</div>
          <div className="truncate text-slate-400">{user?.role === "admin" ? "관리자" : user?.email || ""}</div>
        </div>
        {user && (
          <button onClick={logout} title="로그아웃" className="shrink-0 text-slate-300 hover:text-navy">
            ⎋
          </button>
        )}
      </div>
    </aside>
  );
}
