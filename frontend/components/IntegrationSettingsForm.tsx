"use client";

// 이메일 비서 / 일정 관리 에이전트 상세 페이지에서 공용으로 쓰는 연동 설정 폼.
// auth_service의 /auth/integrations 엔드포인트와 실제로 통신해 저장 · 해제가 동작합니다.

import { useEffect, useState } from "react";
import { CURRENT_USER_ID, IntegrationConfig } from "@/lib/integrations";

type SavedIntegration = {
  provider: string;
  connected: boolean;
  fields: Record<string, string>;
  updated_at: string;
};

export default function IntegrationSettingsForm({ config }: { config: IntegrationConfig }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<SavedIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/services/auth/auth/integrations?user_id=${CURRENT_USER_ID}`);
      const data = await res.json();
      const item = (data.items || []).find((i: SavedIntegration) => i.provider === config.provider) || null;
      setSaved(item);
    } catch {
      setSaved(null);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    const missing = config.fields.filter((f) => f.required && !values[f.key]?.trim());
    if (missing.length > 0) {
      setMessage(`⚠️ 필수 항목을 입력해주세요: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/services/auth/auth/integrations/${config.provider}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: CURRENT_USER_ID, fields: values }),
      });
      if (!res.ok) throw new Error(await res.text());
      const item = await res.json();
      setSaved(item);
      setValues({});
      setMessage("✅ 연동 설정이 저장됐습니다.");
    } catch (err) {
      setMessage(`⚠️ 저장에 실패했습니다: ${String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  async function disconnect() {
    setSaving(true);
    setMessage(null);
    try {
      await fetch(`/api/services/auth/auth/integrations/${config.provider}?user_id=${CURRENT_USER_ID}`, {
        method: "DELETE",
      });
      setSaved(null);
      setMessage("연동이 해제됐습니다.");
    } catch (err) {
      setMessage(`⚠️ 해제에 실패했습니다: ${String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-iceLight text-lg">{config.icon}</span>
        <div className="flex-1">
          <div className="text-sm font-bold text-navy">
            {loading ? "상태 확인 중..." : saved ? "연동됨" : "연동 안 됨"}
          </div>
          <div className="text-xs text-slate-400">
            {saved
              ? `마지막 저장: ${new Date(saved.updated_at).toLocaleString("ko-KR")}`
              : "아래에서 연동 정보를 입력하고 저장하세요."}
          </div>
        </div>
        <span
          className={`h-2.5 w-2.5 rounded-full ${loading ? "bg-slate-300" : saved ? "bg-teal" : "bg-slate-300"}`}
        />
      </div>

      {saved && (
        <div className="mb-6 rounded-2xl bg-white p-4 text-xs shadow-sm">
          <div className="mb-2 font-semibold text-navy">현재 저장된 값 (민감정보는 마스킹 표시)</div>
          <dl className="space-y-1">
            {Object.entries(saved.fields).map(([k, v]) => {
              const field = config.fields.find((f) => f.key === k);
              return (
                <div key={k} className="flex justify-between gap-4 text-slate-500">
                  <dt>{field?.label ?? k}</dt>
                  <dd className="font-mono text-navy">{v}</dd>
                </div>
              );
            })}
          </dl>
          <button
            onClick={disconnect}
            disabled={saving}
            className="mt-3 rounded-full border border-red-200 px-3 py-1.5 text-[11px] font-semibold text-red-500 hover:bg-red-50 disabled:opacity-40"
          >
            연동 해제
          </button>
        </div>
      )}

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 text-sm font-bold text-navy">{saved ? "연동 정보 변경" : "연동 정보 입력"}</div>
        <div className="space-y-3">
          {config.fields.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-xs font-semibold text-steel">
                {f.label} {f.required && <span className="text-red-400">*</span>}
              </label>
              {f.type === "select" ? (
                <select
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-navy outline-none focus:border-teal"
                >
                  <option value="">선택하세요</option>
                  {f.options?.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-navy outline-none placeholder:text-slate-300 focus:border-teal"
                />
              )}
            </div>
          ))}
        </div>

        {message && <div className="mt-3 text-xs text-slate-500">{message}</div>}

        <button
          onClick={save}
          disabled={saving}
          className="mt-4 w-full rounded-full bg-navy py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-40"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}
