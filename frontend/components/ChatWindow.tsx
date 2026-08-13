"use client";

import { useState } from "react";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  text: string;
  route?: string;
  reason?: string;
};

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "안녕하세요. TOPEC AI 포털 대화형 인터페이스 스캐폴드입니다. 메시지를 보내면 게이트웨이가 하이브리드 라우팅 기준(민감정보 여부)에 따라 외부 API 또는 사내 서빙으로 전달합니다.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sensitive, setSensitive] = useState(false);
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/gateway/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          data_sensitivity: sensitive ? "confidential" : "public",
          security_grade: sensitive ? "restricted" : "standard",
        }),
      });
      const data = await res.json();
      const result = data.result || {};
      const routing = data.routing || {};
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: result.ok ? result.text : `⚠️ ${result.error || "게이트웨이 호출에 실패했습니다."}`,
          route: routing.route,
          reason: routing.reason,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `⚠️ 게이트웨이에 연결할 수 없습니다. (${String(err)})` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between rounded-t-2xl border-b border-iceLight px-6 py-4">
        <div>
          <div className="text-lg font-bold text-navy">대화형 인터페이스</div>
          <div className="text-xs text-steel">MCP/API 게이트웨이 → 하이브리드 LLM 라우팅</div>
        </div>
        <label className="flex items-center gap-2 text-xs text-steel">
          <input type="checkbox" checked={sensitive} onChange={(e) => setSensitive(e.target.checked)} />
          민감정보 포함 업무로 표시 (사내 서빙 우선 라우팅)
        </label>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user" ? "bg-navy text-white" : "bg-iceLight text-navy"
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>
              {m.route && (
                <div className="mt-2 inline-block rounded-full bg-teal/20 px-2 py-0.5 text-[10px] font-semibold text-teal">
                  경로: {m.route === "internal_serving" ? "사내 서빙(폐쇄망)" : "외부 API"}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-steel">에이전트가 응답을 생성하는 중...</div>}
      </div>

      <div className="flex gap-2 border-t border-iceLight p-4">
        <input
          className="flex-1 rounded-xl border border-iceLight px-4 py-2 text-sm outline-none focus:border-teal"
          placeholder="업무를 지시해 보세요. 예) 이번 주 회의 내용을 정리해서 보고서로 만들어 줘"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          onClick={send}
          disabled={loading}
          className="rounded-xl bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navyDark disabled:opacity-50"
        >
          전송
        </button>
      </div>
    </div>
  );
}
