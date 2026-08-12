"use client";

// 중앙 채팅 워크스페이스 — 원본 PDF 참고 이미지의 "대화형 인터페이스" 영역을 재현.
// 상단: 포털 스위처 + 에이전트/LLM 선택 + 레이아웃(문서패널) 토글
// 빈 화면: 그라디언트 배경 + 추천 프롬프트 칩
// 하단: 메시지 입력창 — 실제 게이트웨이(/api/gateway/chat)와 연동되어 하이브리드 라우팅 동작

import { useState } from "react";
import PortalSwitcher from "./PortalSwitcher";
import DocumentPanel from "./DocumentPanel";

type ChatMessage = { role: "user" | "assistant"; text: string; route?: string };

const SUGGESTIONS = ["이 계약서의 독소조항을 찾아줘", "Q2 매출 데이터를 요약해줘", "신규 입사자 환영 메일 초안 작성"];

const AGENTS = ["Ara", "문서 분석", "이메일 비서", "일정 관리"];

const LLM_MODES = [
  { key: "auto", label: "자동 라우팅 (하이브리드)", force: null },
  { key: "external", label: "TOPEC LLM · 외부 API 강제", force: "external_api" },
  { key: "internal", label: "TOPEC LLM · 사내 서빙 강제 (폐쇄망)", force: "internal_serving" },
];

export default function ChatWorkspace() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [agent, setAgent] = useState(AGENTS[0]);
  const [agentOpen, setAgentOpen] = useState(false);
  const [llmMode, setLlmMode] = useState(LLM_MODES[0]);
  const [llmOpen, setLlmOpen] = useState(false);
  const [showDoc, setShowDoc] = useState(true);

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message || loading) return;
    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/gateway/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          system: `당신은 TOPEC AI 포털의 "${agent}" 에이전트입니다.`,
          force_route: llmMode.force,
        }),
      });
      const data = await res.json();
      const result = data.result || {};
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: result.ok ? result.text : `⚠️ ${result.error || "게이트웨이 호출에 실패했습니다."}`,
          route: data.routing?.route,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", text: `⚠️ 게이트웨이 연결 실패: ${String(err)}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1">
      <div className="flex flex-1 flex-col">
        {/* 상단 바 */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
          <PortalSwitcher />

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setAgentOpen((v) => !v)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50"
              >
                {agent} ▾
              </button>
              {agentOpen && (
                <div className="absolute right-0 top-9 z-40 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                  {AGENTS.map((a) => (
                    <button
                      key={a}
                      onClick={() => {
                        setAgent(a);
                        setAgentOpen(false);
                      }}
                      className="block w-full rounded-lg px-3 py-1.5 text-left text-xs text-slate-600 hover:bg-iceLight"
                    >
                      {a}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setLlmOpen((v) => !v)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50"
              >
                {llmMode.label.split(" ")[0]} ▾
              </button>
              {llmOpen && (
                <div className="absolute right-0 top-9 z-40 w-64 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                  {LLM_MODES.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => {
                        setLlmMode(m);
                        setLlmOpen(false);
                      }}
                      className={`block w-full rounded-lg px-3 py-2 text-left text-xs ${
                        m.key === llmMode.key ? "bg-iceLight font-semibold text-navy" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowDoc((v) => !v)}
              title="레이아웃"
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
            >
              ▦
            </button>
          </div>
        </div>

        {/* 본문 */}
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-orange-50 px-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
              ✦
            </div>
            <div className="mb-1 text-lg font-bold text-navy">무엇을 도와드릴까요?</div>
            <div className="mb-6 text-sm text-slate-400">상단에서 에이전트·모델을 고르고 대화를 시작하세요.</div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 shadow-sm hover:border-teal hover:text-navy"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-br from-indigo-50/40 via-purple-50/40 to-orange-50/40 p-6">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    m.role === "user" ? "bg-navy text-white" : "bg-white text-navy"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  {m.route && (
                    <div className="mt-2 inline-block rounded-full bg-teal/15 px-2 py-0.5 text-[10px] font-semibold text-teal">
                      경로: {m.route === "internal_serving" ? "사내 서빙(폐쇄망)" : "외부 API"}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-slate-400">에이전트가 응답을 생성하는 중...</div>}
          </div>
        )}

        {/* 입력창 */}
        <div className="border-t border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 shadow-sm">
            <span className="text-slate-300">+</span>
            <input
              className="flex-1 text-sm outline-none placeholder:text-slate-400"
              placeholder="메시지를 입력하세요... (Shift+Enter 줄바꿈)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            />
            <span className="text-slate-300">🎤</span>
            <button
              onClick={() => send()}
              disabled={loading}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-navy text-white disabled:opacity-40"
            >
              ➤
            </button>
          </div>
          <div className="mt-1.5 text-center text-[10px] text-slate-300">
            응답은 프로토타입의 목업 스트리밍입니다.
          </div>
        </div>
      </div>

      {showDoc && <DocumentPanel onClose={() => setShowDoc(false)} />}
    </div>
  );
}
