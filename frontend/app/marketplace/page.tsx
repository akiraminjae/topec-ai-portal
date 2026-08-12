"use client";

// 마켓플레이스 — 승인된 에이전트 공유 + PDF Use Case 섹션(슬라이드 18~38) 전체를
// "설치 가능한 템플릿 라이브러리"로 제공합니다.
// TODO(개발팀): governance_service 승인 이력과 연동해 "승인됨" 상태의 자체 제작 에이전트도 함께 노출

import { useMemo, useState } from "react";
import SurfaceShell from "@/components/SurfaceShell";
import { CATEGORIES, USE_CASES, UseCase } from "@/lib/usecases";

const MOCK_SHARED = [
  { name: "문서 요약 에이전트", from: "총무팀", installs: 42 },
  { name: "예산 집행 조회 에이전트", from: "재무팀", installs: 17 },
  { name: "법령·지침 질의응답 에이전트", from: "총무팀", installs: 63 },
];

const CATEGORY_COLOR: Record<UseCase["category"], string> = {
  공공: "bg-steel/10 text-steel",
  교육: "bg-teal/15 text-teal",
  기업: "bg-navy/10 text-navy",
};

export default function MarketplacePage() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("전체");
  const [openId, setOpenId] = useState<string | null>(null);
  const [installed, setInstalled] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => (cat === "전체" ? USE_CASES : USE_CASES.filter((u) => u.category === cat)), [cat]);

  return (
    <SurfaceShell title="Marketplace" subtitle="승인된 AI 에이전트와 도입 가능한 Use Case 템플릿을 전사에 공유합니다.">
      {/* 사내 제작·승인된 에이전트 */}
      <div className="mb-10">
        <div className="mb-3 text-sm font-bold text-navy">사내 제작 에이전트 (승인됨)</div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {MOCK_SHARED.map((a) => (
            <div key={a.name} className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm">
              <div>
                <div className="font-semibold text-navy">{a.name}</div>
                <div className="text-xs text-slate-400">
                  제작: {a.from} · {a.installs}개 부서 사용 중
                </div>
              </div>
              <button className="rounded-full bg-teal px-4 py-2 text-xs font-semibold text-navyDark">
                내 포털에 추가
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Use Case 템플릿 라이브러리 */}
      <div>
        <div className="mb-1 text-sm font-bold text-navy">Use Case 템플릿 라이브러리</div>
        <p className="mb-4 text-xs text-slate-400">
          공공·교육·기업 도입 사례 {USE_CASES.length}종 — 클릭하면 세부 Sub-Agent 구성을 볼 수 있습니다.
        </p>

        <div className="mb-5 flex gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                cat === c ? "bg-navy text-white" : "bg-white text-slate-500 hover:bg-slate-100"
              }`}
            >
              {c} {c !== "전체" && `(${USE_CASES.filter((u) => u.category === c).length})`}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((u) => {
            const open = openId === u.id;
            const isInstalled = installed.has(u.id);
            return (
              <div key={u.id} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${CATEGORY_COLOR[u.category]}`}>
                    {u.category}
                  </span>
                  {u.originOrg && <span className="text-[10px] text-slate-300">{u.originOrg}</span>}
                </div>
                <div className="mb-1.5 text-sm font-bold text-navy">{u.name}</div>
                <p className="mb-3 line-clamp-3 text-xs leading-relaxed text-slate-500">{u.painPoint}</p>
                <p className="mb-3 text-[11px] font-medium text-teal">TOPEC 적용: {u.topecFit}</p>

                <button
                  onClick={() => setOpenId(open ? null : u.id)}
                  className="mb-2 text-[11px] font-semibold text-steel hover:text-navy"
                >
                  {open ? "세부 구성 접기 ▲" : `Sub-Agent ${u.subAgents.length}개 보기 ▾`}
                </button>

                {open && (
                  <div className="mb-3 space-y-2 rounded-xl bg-iceLight p-3">
                    <div>
                      <div className="mb-1 text-[10px] font-bold text-steel">핵심 기능</div>
                      <ul className="space-y-0.5 text-[11px] text-slate-600">
                        {u.keyFeatures.map((f) => (
                          <li key={f}>· {f}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {u.subAgents.map((s) => (
                        <span key={s} className="rounded-full bg-white px-2 py-0.5 text-[10px] text-navy shadow-sm">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setInstalled((prev) => new Set(prev).add(u.id))}
                  disabled={isInstalled}
                  className={`w-full rounded-full py-2 text-xs font-semibold ${
                    isInstalled ? "bg-slate-100 text-slate-400" : "bg-teal text-navyDark hover:brightness-95"
                  }`}
                >
                  {isInstalled ? "✓ 내 포털에 추가됨" : "내 포털에 추가"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </SurfaceShell>
  );
}
