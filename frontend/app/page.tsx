import ChatSidebar from "@/components/ChatSidebar";
import ChatWorkspace from "@/components/ChatWorkspace";

// Agentic OS 홈 — 원본 PDF 참고 이미지의 3단 레이아웃(좌: 채팅사이드바 / 중앙: 대화형 인터페이스 /
// 우: 문서패널)을 그대로 재현한 기본 진입 화면.
export default function HomePage() {
  return (
    <div className="flex h-screen">
      <ChatSidebar />
      <ChatWorkspace />
    </div>
  );
}
