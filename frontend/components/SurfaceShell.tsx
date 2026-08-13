"use client";

// 공통 상단 바 — Marketplace / Studio / Admin 등 Agentic OS 이외의 surface에서 공통으로 사용.
// 좌측에 PortalSwitcher를 두어 언제든 다른 surface로 이동할 수 있게 합니다.

import PortalSwitcher from "./PortalSwitcher";

export default function SurfaceShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <div className="flex items-center border-b border-slate-200 bg-white px-4 py-2">
        <PortalSwitcher />
      </div>
      <div className="flex-1 overflow-y-auto p-8">
        <h1 className="mb-1 text-2xl font-bold text-navy">{title}</h1>
        <p className="mb-6 text-sm text-steel">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
