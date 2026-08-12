"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "대화형 인터페이스" },
  { href: "/agents", label: "에이전트 목록" },
  { href: "/marketplace", label: "마켓플레이스" },
  { href: "/builder", label: "빌더 스튜디오" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 shrink-0 bg-navyDark text-white min-h-screen p-6">
      <div className="mb-8">
        <div className="text-teal text-xs font-bold tracking-wider">TOPEC</div>
        <div className="text-lg font-bold">AI 포털</div>
      </div>
      <nav className="space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                active ? "bg-navy text-teal font-semibold" : "text-ice hover:bg-navy/60"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-10 rounded-lg bg-navy/60 p-3 text-xs text-ice leading-relaxed">
        사내 서버(폐쇄망) 구축 · 하이브리드 LLM(외부 API + 사내 서빙) 스캐폴드
      </div>
    </aside>
  );
}
