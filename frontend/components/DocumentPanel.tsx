"use client";

// 우측 문서 패널 — 원본 PDF 참고 이미지의 "문서 특화 에이전트" 결과물 뷰어를 재현.
// 한컴 도큐먼트 솔루션 Agent 컨셉: 에이전트가 만든 문서를 원본 서식 그대로 보여주는 영역.
// TODO(개발팀): document_service(추출·생성 결과)와 연동해 실제 생성 문서를 렌더링하도록 교체

const TOOLBAR = ["파일", "편집", "보기", "입력", "서식", "쪽", "도구"];

export default function DocumentPanel({ onClose }: { onClose: () => void }) {
  return (
    <aside className="flex w-[420px] shrink-0 flex-col border-l border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
        <div className="flex gap-3">
          {TOOLBAR.map((t) => (
            <span key={t} className="cursor-default hover:text-navy">
              {t}
            </span>
          ))}
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-navy">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
        <div className="mx-auto max-w-sm rounded-lg bg-white p-6 text-[11px] leading-relaxed text-slate-700 shadow-sm">
          <div className="mb-3">
            <div className="text-sm font-bold text-navy">2026년 1분기 사업 실적 보고</div>
            <div className="text-[10px] text-slate-400">한컴오피스 · 경영기획팀 · 2026-04-10</div>
          </div>

          <div className="mb-2 font-semibold text-navy">1. 개요</div>
          <p className="mb-3 text-slate-500">
            본 보고서는 2026년 1분기 주요 사업 부문의 매출 및 영업이익 실적을 요약하고,
            전분기 대비 변동 요인을 분석한다. 전사 매출은 전년 대비 8.2% 증가하였으며,
            AI 포털이 성장을 견인하였다.
          </p>

          <div className="mb-2 font-semibold text-navy">2. 부문별 실적</div>
          <table className="mb-3 w-full border-collapse text-[10px]">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-400">
                <th className="py-1">부문</th>
                <th className="py-1">매출(억)</th>
                <th className="py-1">증감</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-1">문서 솔루션</td>
                <td className="py-1">128</td>
                <td className="py-1 text-teal">+2.1%</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1">AI 포털</td>
                <td className="py-1">41</td>
                <td className="py-1 text-teal">+38.4%</td>
              </tr>
              <tr>
                <td className="py-1">공공 SI</td>
                <td className="py-1">76</td>
                <td className="py-1 text-teal">+12.0%</td>
              </tr>
            </tbody>
          </table>

          <div className="mb-2 font-semibold text-navy">3. 리스크 요인</div>
          <p className="text-slate-500">
            대내외 환율 변동성이 인건비·비용 상승에 영향을 줄 수 있다. 특히 AI 부문은
            GPU 조달 단가에 민감하며, 장기 공급 계약을 통해 이를 완화하고 있다.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 border-t border-slate-100 py-2 text-[11px] text-slate-400">
        <span>◂</span>
        <span>1 / 3쪽</span>
        <span>▸</span>
      </div>
    </aside>
  );
}
