"use client";

// Studio — 쉬운 AI 에이전트 제작 surface (노코드 빌더)
// 이름/설명/시스템 프롬프트/도구를 입력해 agent_lifecycle_service에 실제로 저장하고,
// 초안(draft) → 게시(published) → 보관(archived) 상태를 전이할 수 있습니다.
// 아래쪽에는 기존 LLM 하이브리드 라우팅 시뮬레이터를 그대로 둡니다.
// TODO(개발팀): 드래그앤드롭 워크플로우 캔버스, 실제 도구 연결/실행 런타임은 아직 없음 —
// 지금은 에이전트 메타데이터(이름/프롬프트/도구 목록) 등록·버전관리까지만 지원.

import { useEffect, useState } from "react";
import SurfaceShell from "@/components/SurfaceShell";

type Agent = {
  agent_id: string;
  name: string;
  description: string;
  system_prompt: string;
  tools: string[];
  owner: string;
  status: "draft" | "pending_approval" | "published" | "archived";
  version: number;
  updated_at: string;
};

const STATUS_LABEL: Record<Agent["status"], string> = {
  draft: "초안",
  pending_approval: "승인 대기",
  published: "게시됨",
  archived: "보관됨",
};

const STATUS_COLOR: Record<Agent["status"], string> = {
  draft: "bg-slate-100 text-slate-500",
  pending_approval: "bg-amber-100 text-amber-600",
  published: "bg-teal/15 text-teal",
  archived: "bg-slate-100 text-slate-400",
};

export default function BuilderPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", system_prompt: "", tools: "", owner: "" });

  async function loadAgents() {
    setLoadingAgents(true);
    try {
      const res = await fetch("/api/services/agent-lifecycle/agents");
      const data = await res.json();
      setAgents(data.items || []);
    } catch {
      setAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  }

  useEffect(() => {
    loadAgents();
  }, []);

  async function createAgent() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/services/agent-lifecycle/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          system_prompt: form.system_prompt,
          tools: form.tools
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          owner: form.owner || "익명",
        }),
      });
      setForm({ name: "", description: "", system_prompt: "", tools: "", owner: "" });
      await loadAgents();
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(agentId: string, status: string) {
    await fetch(`/api/services/agent-lifecycle/agents/${agentId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadAgents();
  }

  return (
    <SurfaceShell title="Studio" subtitle="코드 없이 에이전트를 만들고 배포합니다.">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 에이전트 만들기 */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 text-sm font-bold text-navy">새 에이전트 만들기</div>
          <div className="space-y-3 text-sm">
            <div>
              <label className="mb-1 block font-semibold text-steel">이름</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="예) 법령질의응답봇"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-steel">설명</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="이 에이전트가 하는 일"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-steel">시스템 프롬프트</label>
              <textarea
                className="h-24 w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="당신은 ...하는 에이전트입니다."
                value={form.system_prompt}
                onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-steel">도구 (쉼표로 구분)</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="document_search, knowledge_search"
                value={form.tools}
                onChange={(e) => setForm({ ...form, tools: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-steel">담당 부서/소유자</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="예) 총무팀"
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
              />
            </div>
            <button
              onClick={createAgent}
              disabled={saving || !form.name.trim()}
              className="w-full rounded-xl bg-navy py-2 font-semibold text-white hover:bg-navyDark disabled:opacity-50"
            >
              {saving ? "저장 중..." : "초안으로 저장"}
            </button>
          </div>
        </div>

        {/* 내 에이전트 목록 */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-bold text-navy">내 에이전트</div>
            <button onClick={loadAgents} className="text-xs text-steel hover:text-navy">
              새로고침
            </button>
          </div>
          {loadingAgents ? (
            <div className="text-xs text-slate-400">불러오는 중...</div>
          ) : agents.length === 0 ? (
            <div className="text-xs text-slate-400">아직 만든 에이전트가 없습니다.</div>
          ) : (
            <div className="space-y-3">
              {agents.map((a) => (
                <div key={a.agent_id} className="rounded-xl border border-slate-100 p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-navy">{a.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLOR[a.status]}`}>
                      {STATUS_LABEL[a.status]}
                    </span>
                  </div>
                  <div className="mb-1 text-xs text-slate-400">
                    {a.owner || "소유자 없음"} · v{a.version}
                    {a.tools.length > 0 && ` · 도구 ${a.tools.length}개`}
                  </div>
                  {a.description && <div className="mb-2 text-xs text-slate-500">{a.description}</div>}
                  <div className="flex gap-2">
                    {(a.status === "draft" || a.status === "pending_approval") && (
                      <button
                        onClick={() => setStatus(a.agent_id, "published")}
                        className="rounded-lg bg-teal/15 px-3 py-1 text-[11px] font-semibold text-teal hover:bg-teal/25"
                      >
                        게시하기
                      </button>
                    )}
                    {a.status === "published" && (
                      <button
                        onClick={() => setStatus(a.agent_id, "archived")}
                        className="rounded-lg bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-200"
                      >
                        보관하기
                      </button>
                    )}
                    {a.status === "archived" && (
                      <button
                        onClick={() => setStatus(a.agent_id, "draft")}
                        className="rounded-lg bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-200"
                      >
                        초안으로 복원
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <RoutingSimulator />
    </SurfaceShell>
  );
}

function RoutingSimulator() {
  const [sensitivity, setSensitivity] = useState("public");
  const [securityGrade, setSecurityGrade] = useState("standard");
  const [volume, setVolume] = useState(10);
  const [perf, setPerf] = useState("normal");
  const [result, setResult] = useState<{ route: string; reason: string; score: number } | null>(null);
  const [loading, setLoading] = useState(false);

  async function preview() {
    setLoading(true);
    try {
      const res = await fetch("/api/gateway/route/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "preview",
          data_sensitivity: sensitivity,
          security_grade: securityGrade,
          daily_call_volume: volume,
          performance_requirement: perf,
        }),
      });
      setResult(await res.json());
    } catch (err) {
      setResult({ route: "error", reason: String(err), score: 0 });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 max-w-xl rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 text-sm font-bold text-navy">라우팅 시뮬레이터 — 외부 API vs 사내 서빙</div>

      <div className="space-y-4 text-sm">
        <div>
          <label className="mb-1 block font-semibold text-steel">데이터 민감도</label>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
            value={sensitivity}
            onChange={(e) => setSensitivity(e.target.value)}
          >
            <option value="public">public (공개)</option>
            <option value="internal">internal (사내)</option>
            <option value="sensitive">sensitive (민감)</option>
            <option value="confidential">confidential (기밀)</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block font-semibold text-steel">보안 등급</label>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
            value={securityGrade}
            onChange={(e) => setSecurityGrade(e.target.value)}
          >
            <option value="standard">standard</option>
            <option value="high">high</option>
            <option value="restricted">restricted</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block font-semibold text-steel">일 평균 호출 빈도: {volume}회</label>
          <input
            type="range"
            min={0}
            max={2000}
            step={10}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="mb-1 block font-semibold text-steel">성능 요구 수준</label>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
            value={perf}
            onChange={(e) => setPerf(e.target.value)}
          >
            <option value="low">low</option>
            <option value="normal">normal</option>
            <option value="high">high</option>
          </select>
        </div>

        <button
          onClick={preview}
          disabled={loading}
          className="w-full rounded-xl bg-navy py-2 font-semibold text-white hover:bg-navyDark disabled:opacity-50"
        >
          {loading ? "확인 중..." : "라우팅 경로 미리보기"}
        </button>

        {result && (
          <div className="rounded-xl bg-iceLight p-4">
            <div className="text-xs font-semibold text-steel">결정된 경로</div>
            <div className="text-lg font-bold text-navy">
              {result.route === "internal_serving"
                ? "사내 서빙 (폐쇄망)"
                : result.route === "external_api"
                ? "외부 API 연동"
                : "오류"}
            </div>
            <div className="mt-1 text-xs text-steel">{result.reason}</div>
          </div>
        )}
      </div>
    </div>
  );
}
