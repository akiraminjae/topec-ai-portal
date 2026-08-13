"use client";

// 로그인/회원가입 — auth_service(/auth/login, /auth/register)와 실제로 연동됩니다.
// 실제 사내 SSO(SAML/OAuth)는 아직 없고, 로컬 이메일/비밀번호 계정만 지원합니다.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const path = mode === "login" ? "/api/services/auth/auth/login" : "/api/services/auth/auth/register";
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "login" ? { email, password } : { email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "요청에 실패했습니다");
      }
      setAuth(data.token, data.user);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-orange-50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-1 text-xs font-bold tracking-wider text-teal">TOPEC</div>
        <div className="mb-6 text-xl font-bold text-navy">AI 포털 {mode === "login" ? "로그인" : "회원가입"}</div>

        <div className="space-y-3 text-sm">
          {mode === "register" && (
            <div>
              <label className="mb-1 block font-semibold text-steel">이름</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="mb-1 block font-semibold text-steel">이메일</label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="you@topec.co.kr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          <div>
            <label className="mb-1 block font-semibold text-steel">비밀번호</label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="8자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">{error}</div>}

          <button
            onClick={submit}
            disabled={loading || !email || !password}
            className="w-full rounded-xl bg-navy py-2 font-semibold text-white hover:bg-navyDark disabled:opacity-50"
          >
            {loading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
          </button>

          <button
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
            }}
            className="w-full text-center text-xs text-steel hover:text-navy"
          >
            {mode === "login" ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
          </button>
        </div>
      </div>
    </div>
  );
}
