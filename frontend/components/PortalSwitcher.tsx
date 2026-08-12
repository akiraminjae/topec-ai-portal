"use client";

// 포털 스위처 — 참고 이미지(구축계획서 원본 PDF 스크린샷) 우측 "포털 이동" 플라이아웃을 그대로 구현.
// 하나의 계정으로 5개 surface(Agentic OS / Marketplace / Studio / Admin / Developer)를 전환합니다.

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const PORTALS = [
  {
    href: "/",
    key: "agentic-os",
    icon: "◧",
    name: "Agentic OS",
    desc: "대화형 인터페이스로 업무 수행",
  },
  {
    href: "/marketplace",
    key: "marketplace",
    icon: "▤",
    name: "Marketplace",
    desc: "AI 에이전트 승인 및 공유",
  },
  {
    href: "/builder",
    key: "studio",
    icon: "✦",
    name: "Studio",
    desc: "쉬운 AI 에이전트 제작",
  },
  {
    href: "/admin",
    key: "admin",
    icon: "◎",
    name: "Admin",
    desc: "대시보드 · 도구 관리 · 가드레일",
  },
];

export default function PortalSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const current =
    PORTALS.find((p) => (p.href === "/" ? pathname === "/" : pathname.startsWith(p.href))) || PORTALS[0];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-navy hover:bg-slate-100"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-navy text-xs text-white">
          {current.icon}
        </span>
        {current.name}
        <span className="text-[10px] text-slate-400">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-50 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          <div className="px-3 pb-2 pt-1 text-[11px] font-semibold text-slate-400">포털 이동 · 다른 surface로 전환</div>
          {PORTALS.map((p) => {
            const active = p.key === current.key;
            return (
              <button
                key={p.key}
                onClick={() => {
                  setOpen(false);
                  router.push(p.href);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                  active ? "bg-iceLight" : "hover:bg-slate-50"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
                    active ? "bg-navy text-white" : "bg-slate-100 text-navy"
                  }`}
                >
                  {p.icon}
                </span>
                <span className="flex-1">
                  <div className="flex items-center gap-2 font-semibold text-navy">
                    {p.name}
                    {active && (
                      <span className="rounded-full bg-teal/20 px-1.5 py-0.5 text-[10px] font-bold text-teal">
                        현재
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">{p.desc}</div>
                </span>
              </button>
            );
          })}
          <div className="mt-1 border-t border-slate-100 pt-1">
            <div className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-400">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-sm">{"</>"}</span>
              <span className="flex-1">
                <div className="font-semibold">Developer</div>
                <div className="text-xs">API · 새 탭 열기 (TODO)</div>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
