"use client";

// 좌측 채팅 사이드바 — 구축계획서 원본 PDF의 Agentic OS 클라이언트 화면(새 대화 · 프로젝트 ·
// 에이전트 목록 · 최근 대화 · 사용자 프로필)을 그대로 재현.
// TODO(개발팀): 프로젝트/에이전트/최근대화는 mock 데이터 — agent_lifecycle_service,
// observability_service 등과 연동해 실제 목록으로 교체

import Link from "next/link";

const PROJECTS = ["2026 재무 보고", "신규 제품 출시"];

const PINNED_AGENTS = [
  { icon: "H", name: "Ara", href: null },
  { icon: "📊", name: "재무 리포트", href: null },
  { icon: "📄", name: "문서 분석", href: "/document-agent" },
  { icon: "✉️", name: "이메일 비서", href: null },
  { icon: "🗓️", name: "일정 관리", href: null },
];

const RECENT_CHATS = [
  "Q2 재무 리포트 초안",
  "계약서 독소조항 검토",
  "경쟁사 동향 메모",
  "신규 입사자 안내 메일",
  "재무 대시보드 지표 정의",
  "납품 계약서 비교",
  "주간 일정 정리",
];

export default function ChatSidebar() {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
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
          {PROJECTS.map((p) => (
            <div key={p} className="rounded-lg px-2 py-1.5 text-slate-600 hover:bg-slate-50">
              📁 {p}
            </div>
          ))}
        </div>

        <div>
          <div className="mb-1 px-1 text-[11px] font-semibold text-slate-400">에이전트</div>
          {PINNED_AGENTS.map((a) =>
            a.href ? (
              <Link
                key={a.name}
                href={a.href}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-slate-600 hover:bg-slate-50"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-[11px]">
                  {a.icon}
                </span>
                {a.name}
              </Link>
            ) : (
              <div key={a.name} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-slate-600 hover:bg-slate-50">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-[11px]">
                  {a.icon}
                </span>
                {a.name}
              </div>
            )
          )}
          <div className="rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-50">에이전트 더보기 ›</div>
        </div>

        <div>
          <div className="mb-1 px-1 text-[11px] font-semibold text-slate-400">최근 대화</div>
          {RECENT_CHATS.map((c) => (
            <div key={c} className="truncate rounded-lg px-2 py-1.5 text-slate-600 hover:bg-slate-50">
              {c}
            </div>
          ))}
        </div>
      </nav>

      <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
          김
        </span>
        <div className="text-xs">
          <div className="font-semibold text-navy">김민재</div>
          <div className="text-slate-400">관리자</div>
        </div>
      </div>
    </aside>
  );
}
