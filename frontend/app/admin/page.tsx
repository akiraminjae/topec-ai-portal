"use client";

// Admin — 대시보드 · 도구 관리 · 가드레일 surface
// PDF 슬라이드 9(특화 기술), 10(실행 기능), 16(FDE 컨설팅 프로세스)를 전부 반영.
// 공통 서비스 6종은 실제 /health로 상태를 조회하고, HITL 승인함은 governance_service의
// 실제 승인 API(GET/POST /governance/approvals)와 연동되어 승인/반려가 실제로 동작합니다.
// 상단 STATS도 agent_lifecycle_service(배포된 에이전트) + observability_service(처리 건수·
// 응답시간) + governance_service(승인 대기)의 실제 데이터로 채워집니다.
// TODO(개발팀): GUARDRAILS 토글은 아직 실제 정책 저장소에 연결되지 않은 표시용 UI

import { useEffect, useState } from "react";
import SurfaceShell from "@/components/SurfaceShell";

const SERVICES = [
  { key: "document", name: "문서 처리 엔진" },
  { key: "knowledge", name: "데이터·지식 연동 (RAG)" },
  { key: "agent-lifecycle", name: "에이전트 라이프사이클" },
  { key: "observability", name: "관측·모니터링" },
  { key: "governance", name: "거버넌스·감사·가드레일" },
  { key: "auth", name: "계정·접근권한 (SSO)" },
];

const GUARDRAILS = [
  { name: "중요 작업 사전 승인(HITL)", on: true },
  { name: "프롬프트 가드레일 필터", on: true },
  { name: "민감정보 자동 마스킹", on: true },
  { name: "미승인 도구 접근 차단", on: false },
];

// PDF 슬라이드10 — 에이전트 실행 및 오케스트레이션 5대 기능
const EXECUTION_FEATURES = [
  { n: "01", name: "질의이해 / 의도분류", desc: "자연어 의도를 기반으로 하위 작업으로 분해하고 실행 흐름을 계획" },
  { n: "02", name: "시스템 도구 연동/호출", desc: "레거시 시스템 도구를 선택하고 호출" },
  { n: "03", name: "멀티 에이전트 협업·오케스트레이션", desc: "상위 에이전트가 하위 에이전트 역할을 배분하고 결과를 취합·점검" },
  { n: "04", name: "권한 통제", desc: "HITL 사전 승인 · 사용자 권한 기반 실행 · 도구 화이트리스트로 미승인 접근 차단" },
  { n: "05", name: "오류 처리 · 시스템 복원", desc: "LLM/API 장애 시 이중화 폴백 전환, 백오프·임계치 관리, 이상 상황 자동 중단·복원" },
];

// PDF 슬라이드9 — 특화 기술 3개 카테고리
const TECH_CATEGORIES = [
  {
    title: "정확한 처리를 위한 데이터 특화 기술",
    items: [
      "hwp(x) 원천 기술로 표·다단·병합 셀 구조까지 손실 없는 파싱",
      "OCR·레이아웃·표·차트·수식·이미지 설명까지 AI 기반 추출",
      "청킹·검색·리랭킹 조합 자동 평가를 통한 RAG 품질 최적화",
    ],
  },
  {
    title: "일 잘하는 AI를 위한 에이전트 특화 기술",
    items: [
      "획일적인 AI 문서가 아닌, 서식과 품질을 갖춘 고품질 문서 생성",
      "실행 로그 평가·실패 원인 분석으로 에이전트 자동 지속 개선 (FitOps)",
      "사용자가 필요한 시점에 에이전트를 직접 만들어 즉시 활용·확장",
    ],
  },
  {
    title: "안전한 에이전트 활용을 위한 보안·거버넌스 기술",
    items: [
      "에이전트의 격리된 실행환경 제공 및 프롬프트 가드레일 적용",
      "모든 데이터 연계는 데이터 커넥터와 MCP/A2A 게이트웨이 단일 경유",
      "폐쇄망 시스템 구축 노하우 및 온프레미스 지원",
    ],
  },
];

// PDF 슬라이드16 — FDE 기반 AX 프로세스 5단계
const FDE_STEPS = [
  { n: 1, name: "업무 관찰·인터뷰", sub: "Shadow 관찰·인터뷰", desc: "Pain Point 발견" },
  { n: 2, name: "시스템 분석", sub: "Workflow 분석", desc: "과제 정의 및 우선순위 도출" },
  { n: 3, name: "Build-to-Learn", sub: "프로토타이핑 및 작은 검증", desc: "추진 로드맵 수립" },
  { n: 4, name: "현업 검증", sub: "기대 효과 검증", desc: "비용 절감 및 효율성 극대화" },
  { n: 5, name: "시스템 연동/배포", sub: "실제 시스템 연동/적용", desc: "지속 가능한 서비스 품질 향상" },
];

type Approval = { id: number; status: string; agent_name: string; action: string; requested_by: string };
type ObsStats = { requests_today: number; avg_latency_ms: number | null };

export default function AdminPage() {
  const [status, setStatus] = useState<Record<string, "checking" | "ok" | "down">>(
    Object.fromEntries(SERVICES.map((s) => [s.key, "checking"]))
  );
  const [gatewayStatus, setGatewayStatus] = useState<"checking" | "ok" | "down">("checking");
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [approvalsError, setApprovalsError] = useState(false);
  const [agentCount, setAgentCount] = useState<number | null>(null);
  const [obsStats, setObsStats] = useState<ObsStats | null>(null);

  const pendingApprovals = approvals.filter((a) => a.status === "pending").length;
  const STATS = [
    { label: "배포된 에이전트", value: agentCount === null ? "-" : String(agentCount) },
    { label: "오늘 처리 건수", value: obsStats === null ? "-" : obsStats.requests_today.toLocaleString() },
    {
      label: "평균 응답시간",
      value: obsStats?.avg_latency_ms == null ? "-" : `${(obsStats.avg_latency_ms / 1000).toFixed(1)}초`,
    },
    { label: "승인 대기(HITL)", value: `${pendingApprovals}건` },
  ];

  async function loadApprovals() {
    try {
      const res = await fetch("/api/services/governance/governance/approvals");
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      setApprovals(data.items || []);
      setApprovalsError(false);
    } catch {
      setApprovalsError(true);
    }
  }

  async function decide(id: number, decision: "approved" | "rejected") {
    try {
      await fetch(`/api/services/governance/governance/approvals/${id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      loadApprovals();
    } catch {
      setApprovalsError(true);
    }
  }

  useEffect(() => {
    SERVICES.forEach(async (s) => {
      try {
        const res = await fetch(`/api/services/${s.key}/health`);
        setStatus((prev) => ({ ...prev, [s.key]: res.ok ? "ok" : "down" }));
      } catch {
        setStatus((prev) => ({ ...prev, [s.key]: "down" }));
      }
    });
    fetch("/api/gateway/health")
      .then((r) => setGatewayStatus(r.ok ? "ok" : "down"))
      .catch(() => setGatewayStatus("down"));
    loadApprovals();

    fetch("/api/services/agent-lifecycle/agents")
      .then((r) => r.json())
      .then((data) => setAgentCount((data.items || []).length))
      .catch(() => setAgentCount(null));

    fetch("/api/services/observability/observability/stats")
      .then((r) => r.json())
      .then((data) => setObsStats({ requests_today: data.requests_today ?? 0, avg_latency_ms: data.avg_latency_ms }))
      .catch(() => setObsStats(null));
  }, []);

  return (
    <SurfaceShell title="Admin" subtitle="대시보드 · 도구 관리 · 가드레일">
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-2xl font-bold text-navy">{s.value}</div>
            <div className="text-xs text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* HITL 승인함 — 실제 governance_service 연동 */}
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-navy">
          HITL 승인함
          <span className="rounded-full bg-teal/15 px-2 py-0.5 text-[10px] font-semibold text-teal">
            governance_service 실연동
          </span>
        </div>
        {approvalsError ? (
          <div className="rounded-2xl bg-white p-4 text-xs text-slate-400 shadow-sm">
            governance_service에 연결할 수 없습니다. (docker compose 또는 개별 uvicorn 실행 필요)
          </div>
        ) : approvals.length === 0 ? (
          <div className="rounded-2xl bg-white p-4 text-xs text-slate-400 shadow-sm">대기 중인 승인 요청이 없습니다.</div>
        ) : (
          <div className="rounded-2xl bg-white p-2 shadow-sm">
            {approvals.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm first:border-t-0">
                <div>
                  <div className="font-semibold text-navy">
                    {a.agent_name} <span className="font-normal text-slate-400">→ {a.action}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">요청자: {a.requested_by}</div>
                </div>
                {a.status === "pending" ? (
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => decide(a.id, "approved")}
                      className="rounded-full bg-teal px-3 py-1.5 text-[11px] font-semibold text-navyDark"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => decide(a.id, "rejected")}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-500"
                    >
                      반려
                    </button>
                  </div>
                ) : (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      a.status === "approved" ? "bg-teal/15 text-teal" : "bg-red-50 text-red-400"
                    }`}
                  >
                    {a.status === "approved" ? "승인됨" : "반려됨"}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8">
        <div className="mb-3 text-sm font-bold text-navy">공통 서비스 상태</div>
        <div className="rounded-2xl bg-white p-2 shadow-sm">
          <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm">
            <span className="font-semibold text-navy">MCP/API 게이트웨이</span>
            <StatusBadge status={gatewayStatus} />
          </div>
          {SERVICES.map((s) => (
            <div key={s.key} className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
              <span className="text-slate-600">{s.name}</span>
              <StatusBadge status={status[s.key]} />
            </div>
          ))}
        </div>
      </div>

      {/* 실행 엔진 — 슬라이드10 */}
      <div className="mb-8">
        <div className="mb-3 text-sm font-bold text-navy">에이전트 실행 엔진</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {EXECUTION_FEATURES.map((f) => (
            <div key={f.n} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-1 text-[10px] font-bold text-teal">{f.n}</div>
              <div className="mb-1 text-xs font-bold text-navy">{f.name}</div>
              <div className="text-[11px] leading-relaxed text-slate-500">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 가드레일 */}
      <div className="mb-8">
        <div className="mb-3 text-sm font-bold text-navy">가드레일</div>
        <div className="rounded-2xl bg-white p-2 shadow-sm">
          {GUARDRAILS.map((g) => (
            <div key={g.name} className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm first:border-t-0">
              <span className="text-slate-600">{g.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  g.on ? "bg-teal/15 text-teal" : "bg-slate-100 text-slate-400"
                }`}
              >
                {g.on ? "사용중" : "꺼짐"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 특화 기술 — 슬라이드9 */}
      <div className="mb-8">
        <div className="mb-3 text-sm font-bold text-navy">한컴 벤치마킹 특화 기술</div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {TECH_CATEGORIES.map((c) => (
            <div key={c.title} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-2 text-xs font-bold text-navy">{c.title}</div>
              <ul className="space-y-1.5 text-[11px] leading-relaxed text-slate-500">
                {c.items.map((it) => (
                  <li key={it}>· {it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* FDE 도입 프로세스 — 슬라이드16 */}
      <div>
        <div className="mb-3 text-sm font-bold text-navy">FDE(Forward Deployed Engineer) 기반 AX 도입 프로세스</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {FDE_STEPS.map((s, i) => (
            <div key={s.n} className="relative rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-1 text-[10px] font-bold text-steel">STEP {s.n}</div>
              <div className="mb-1 text-xs font-bold text-navy">{s.name}</div>
              <div className="mb-2 text-[10px] text-slate-400">{s.sub}</div>
              <div className="text-[11px] text-teal">{s.desc}</div>
              {i < FDE_STEPS.length - 1 && (
                <span className="absolute -right-2.5 top-1/2 hidden -translate-y-1/2 text-slate-300 md:block">›</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </SurfaceShell>
  );
}

function StatusBadge({ status }: { status: "checking" | "ok" | "down" }) {
  if (status === "checking") return <span className="text-xs text-slate-300">확인중...</span>;
  if (status === "ok")
    return <span className="rounded-full bg-teal/15 px-2 py-0.5 text-[11px] font-semibold text-teal">● 정상</span>;
  return <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-400">✕ 연결 안됨</span>;
}
