"use client";

// Studio — 쉬운 AI 에이전트 제작 surface (노코드 빌더)
// TODO(개발팀): 실제 워크플로우 캔버스, 도구 연결, 배포 기능 구현
// 지금은 게이트웨이의 LLM 하이브리드 라우팅을 미리 확인할 수 있는 "라우팅 시뮬레이터"를 제공합니다.

import { useState } from "react";
import SurfaceShell from "@/components/SurfaceShell";

export default function BuilderPage() {
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
    <SurfaceShell title="Studio" subtitle="코드 없이 에이전트를 만들고 배포합니다. (지금은 LLM 하이브리드 라우팅 시뮬레이터만 제공)">
      <div className="max-w-xl rounded-2xl bg-white p-6 shadow-sm">
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
    </SurfaceShell>
  );
}
