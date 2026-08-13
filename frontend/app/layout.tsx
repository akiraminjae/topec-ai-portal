import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TOPEC AI 포털",
  description: "사내 서버(폐쇄망)에 구축하는 TOPEC AI 에이전트 공통 플랫폼",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="h-screen overflow-hidden bg-white text-navy">{children}</body>
    </html>
  );
}
