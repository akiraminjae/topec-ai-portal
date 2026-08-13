"use client";

// 우측 문서 패널 — document_service(/api/services/document)와 실제로 연동됩니다.
// 업로드된 문서를 document_service가 구조 분석 + 텍스트 추출하고(파서: parsers.py),
// 그 결과가 knowledge_service(RAG)에도 자동 색인됩니다.

import { useRef, useState } from "react";

const TOOLBAR = ["파일", "편집", "보기", "입력", "서식", "쪽", "도구"];

type ExtractResult = {
  file_id: string;
  filename: string;
  format: string;
  structure: { paragraphs: number; tables: number; images: number };
  text: string;
  indexed: boolean;
};

export default function DocumentPanel({ onClose }: { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/services/document/documents/extract", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `요청 실패 (${res.status})`);
      }
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

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

      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50 disabled:opacity-50"
        >
          {loading ? "추출 중..." : "문서 업로드"}
        </button>
        <span className="text-[10px] text-slate-300">docx · xlsx · pdf · hwpx · hwp</span>
        <input
          ref={inputRef}
          type="file"
          accept=".docx,.xlsx,.pdf,.hwpx,.hwp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
        {error && (
          <div className="mb-3 rounded-lg bg-red-50 p-3 text-[11px] text-red-600">{error}</div>
        )}

        {result ? (
          <div className="mx-auto max-w-sm rounded-lg bg-white p-6 text-[11px] leading-relaxed text-slate-700 shadow-sm">
            <div className="mb-3">
              <div className="text-sm font-bold text-navy">{result.filename}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                <span className="rounded-full bg-iceLight px-2 py-0.5 font-semibold text-navy">
                  {result.format.toUpperCase()}
                </span>
                <span>문단 {result.structure.paragraphs}</span>
                <span>표 {result.structure.tables}</span>
                <span>이미지 {result.structure.images}</span>
                <span className={result.indexed ? "text-teal" : "text-slate-300"}>
                  {result.indexed ? "지식베이스 색인됨" : "지식베이스 미색인"}
                </span>
              </div>
            </div>
            <div className="whitespace-pre-wrap text-slate-600">
              {result.text ? result.text.slice(0, 4000) : "(추출된 텍스트가 없습니다)"}
            </div>
          </div>
        ) : (
          !error && (
            <div className="mx-auto max-w-sm rounded-lg bg-white p-6 text-center text-[11px] text-slate-400 shadow-sm">
              문서를 업로드하면 document_service가 실제로 구조를 분석하고 텍스트를 추출해
              여기에 보여줍니다. 추출 결과는 knowledge_service(RAG)에도 자동으로 색인됩니다.
            </div>
          )
        )}
      </div>

      <div className="flex items-center justify-center gap-3 border-t border-slate-100 py-2 text-[11px] text-slate-400">
        <span>◂</span>
        <span>{result ? "1 / 1쪽" : "-"}</span>
        <span>▸</span>
      </div>
    </aside>
  );
}
