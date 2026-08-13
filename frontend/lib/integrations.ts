// 이메일 비서 / 일정 관리 에이전트가 사용할 사용자별 연동 설정 스키마.
// 실제 값은 auth_service(/auth/integrations)에 저장되며, 이 파일은 폼 구성만 정의합니다.

export type IntegrationField = {
  key: string;
  label: string;
  type: "text" | "email" | "password" | "select";
  placeholder?: string;
  options?: string[];
  required?: boolean;
};

export type IntegrationConfig = {
  provider: string;
  title: string;
  subtitle: string;
  icon: string;
  fields: IntegrationField[];
};

// 지금은 로그인 체계가 데모 단일 사용자라 고정값을 씁니다.
// TODO(개발팀): auth_service의 실제 세션/SSO 사용자 ID로 교체.
export const CURRENT_USER_ID = "u-minjae";

export const EMAIL_INTEGRATION: IntegrationConfig = {
  provider: "email",
  title: "이메일 비서 연동 설정",
  subtitle: "메일함을 연결하면 이메일 비서 에이전트가 요약 · 초안 작성 · 분류 작업을 대신 수행합니다.",
  icon: "✉️",
  fields: [
    {
      key: "provider_type",
      label: "메일 서비스",
      type: "select",
      options: ["Gmail", "Outlook / Microsoft 365", "사내 메일 서버 (IMAP/SMTP)"],
      required: true,
    },
    { key: "email", label: "이메일 주소", type: "email", placeholder: "you@topec.co.kr", required: true },
    { key: "imap_host", label: "IMAP 서버 주소", type: "text", placeholder: "mail.topec.co.kr (사내 서버 선택 시)" },
    { key: "imap_port", label: "IMAP 포트", type: "text", placeholder: "993" },
    {
      key: "app_password",
      label: "앱 비밀번호 / 액세스 토큰",
      type: "password",
      placeholder: "••••••••",
      required: true,
    },
  ],
};

export const CALENDAR_INTEGRATION: IntegrationConfig = {
  provider: "calendar",
  title: "일정 관리 연동 설정",
  subtitle: "캘린더를 연결하면 일정 관리 에이전트가 일정 조회 · 등록 · 회의 조율을 대신 수행합니다.",
  icon: "🗓️",
  fields: [
    {
      key: "provider_type",
      label: "캘린더 서비스",
      type: "select",
      options: ["Google Calendar", "Outlook Calendar", "사내 그룹웨어"],
      required: true,
    },
    { key: "calendar_email", label: "캘린더 계정", type: "email", placeholder: "you@topec.co.kr", required: true },
    { key: "calendar_id", label: "캘린더 ID (선택)", type: "text", placeholder: "primary" },
    {
      key: "access_token",
      label: "액세스 토큰 / API 키",
      type: "password",
      placeholder: "••••••••",
      required: true,
    },
    {
      key: "sync_direction",
      label: "동기화 방향",
      type: "select",
      options: ["읽기 전용", "양방향 동기화"],
      required: true,
    },
  ],
};
