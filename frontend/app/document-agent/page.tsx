"use client";

// 문서 특화 에이전트 상세 — PDF 슬라이드 12~14 전체 구현
//  · 슬라이드12: AI Agent Lifecycle 9단계 + 문서가 수행하는 5가지 역할
//  · 슬라이드13: 도큐먼트 솔루션 Agent(문서 구조분석·추출·생성·편집)가 파생 에이전트를 낳는 구조
//  · 슬라이드14: 문서 하나를 작성~합본까지 일괄 처리하는 5단계 실제 시나리오
// TODO(개발팀): document_service의 실제 파서·생성 엔진과 연동, 지금은 정적 데모

import { useState } from "react";
import SurfaceShell from "@/components/SurfaceShell";

const LIFECYCLE = [
  { step: "01", name: "업무 요청", desc: "지시서·메일·민원·신청서를 통해 업무 인지" },
  { step: "02", name: "내용 탐색", desc: "판단 근거가 되는 문서 검색 및 수집" },
  { step: "03", name: "문서 이해", desc: "문서의 내용·맥락·구조 이해" },
  { step: "04", name: "판단/계획", desc: "이해한 내용을 바탕으로 Agent가 판단하고 계획 수립" },
  { step: "05", name: "업무 수행", desc: "시스템 연계, 데이터 처리, 의사결정 실행" },
  { step: "06", name: "문서 생성", desc: "보고서·답변서·제안서·계약서 등 결과물 생성" },
  { step: "07", name: "검토/승인", desc: "생성된 문서를 검토하고 승인·피드백 (HITL)" },
  { step: "08", name: "문서 저장/관리", desc: "버전·권한 관리하며 지식을 축적해 저장" },
  { step: "09", name: "지식화", desc: "축적된 지식을 다음 업무에 재활용" },
];

const DOC_ROLES = [
  { name: "입력 (Input)", desc: "업무의 시작점이 되는 정보" },
  { name: "지식 (Knowledge)", desc: "업무 수행을 위한 지식과 규칙" },
  { name: "근거 (Evidence)", desc: "판단과 의사결정의 근거" },
  { name: "결과 (Output)", desc: "업무 수행의 결과물" },
  { name: "자산 (Asset)", desc: "다음 업무를 위한 지식 자산" },
];

const SCENARIO = [
  {
    n: 1,
    title: "문서 생성",
    example: "입찰 요건 보고 제안서 초안부터 써줘",
    detail: "과업지시서를 분석해 표지·목차·본문까지 구조화된 제안서 초안을 자동 완성",
    tags: ["데이터 추출", "구조 분석", "문서 생성"],
  },
  {
    n: 2,
    title: "제안서 검토",
    example: "방금 쓴 초안이랑 입찰 제안서 5개 비교해줘",
    detail: "작성된 초안을 경쟁 제안서 다수와 평가 기준별로 비교해 항목별 검토·평가표 자동 생성",
    tags: ["비교 분석", "평가표 생성"],
  },
  {
    n: 3,
    title: "계약 서류 준비",
    example: "이대로 제출 서류들 한 번에 만들어줘",
    detail: "확정된 제안을 기반으로 견적서·계약서·산출내역서를 연동해 서류 세트 자동 생성",
    tags: ["데이터 추출", "서식 자동 적용"],
  },
  {
    n: 4,
    title: "법령 비교 분석",
    example: "제안 내용 개정안·현행법 비교표로 만들어줘",
    detail: "검토된 제안 내용이 개정안·현행법에 부합하는지 변경 조항을 감지해 비교표 생성",
    tags: ["법령 비교"],
  },
  {
    n: 5,
    title: "문서 취합",
    example: "부서별 보고서 3개 하나로 합쳐줘",
    detail: "부서별 산출물의 서식을 통일하고 페이지 번호를 연속 적용해 하나의 최종 합본 완성",
    tags: ["문서 취합·완성"],
  },
];

export default function DocumentAgentPage() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <SurfaceShell
      title="도큐먼트 솔루션 Agent"
      subtitle="사람이 작업하듯 문서 구조를 이해하고 원본 서식을 유지한 채 분석·추출·생성·편집을 수행하는 문서 특화 에이전트"
    >
      {/* AI Agent Lifecycle */}
      <div className="mb-10">
        <div className="mb-3 text-sm font-bold text-navy">AI Agent Lifecycle — 업무의 본질은 '문서'</div>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-9">
          {LIFECYCLE.map((l, i) => (
            <button
              key={l.step}
              onClick={() => setActiveStep(i)}
              className={`rounded-2xl p-3 text-left transition-colors ${
                activeStep === i ? "bg-navy text-white" : "bg-white text-navy hover:bg-iceLight"
              }`}
            >
              <div className={`text-[10px] font-bold ${activeStep === i ? "text-teal" : "text-slate-300"}`}>
                {l.step}
              </div>
              <div className="text-xs font-semibold leading-tight">{l.name}</div>
            </button>
          ))}
        </div>
        <div className="mt-3 rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">
          <span className="font-semibold text-navy">{LIFECYCLE[activeStep].name}</span> — {LIFECYCLE[activeStep].desc}
        </div>
      </div>

      {/* 문서의 5가지 역할 */}
      <div className="mb-10">
        <div className="mb-3 text-sm font-bold text-navy">문서가 수행하는 5가지 역할</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          {DOC_ROLES.map((r) => (
            <div key={r.name} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-1 text-xs font-bold text-teal">{r.name}</div>
              <div className="text-[11px] text-slate-500">{r.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 실제 시나리오: 제안서 작성 → 합본 */}
      <div>
        <div className="mb-1 text-sm font-bold text-navy">실제 시나리오 — 제안서 작성부터 최종 합본까지</div>
        <p className="mb-4 text-xs text-slate-400">문서 하나를 사람이 직접 다루듯, 문서특화 Agent가 전 주기를 일괄 수행합니다.</p>

        <div className="space-y-3">
          {SCENARIO.map((s) => (
            <div key={s.n} className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-iceLight text-sm font-bold text-navy">
                {s.n}
              </div>
              <div className="flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-navy">{s.title}</span>
                  {s.tags.map((t) => (
                    <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mb-1 rounded-lg bg-iceLight px-3 py-1.5 text-xs italic text-steel">"{s.example}"</div>
                <p className="text-xs text-slate-500">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SurfaceShell>
  );
}
