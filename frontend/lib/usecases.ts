// PDF("AgenticOS 소개자료_2026") Use Case 섹션(슬라이드 18~38) 전체를 데이터화한 파일.
// TOPEC 포털의 마켓플레이스 / 에이전트 목록에서 "설치 가능한 템플릿"으로 노출합니다.
// TODO(개발팀): 실제 배포 시 agent_lifecycle_service DB로 이관하고, 여기 데이터는 시드값으로만 사용

export type UseCase = {
  id: string;
  category: "공공" | "교육" | "기업";
  name: string;
  originOrg?: string; // 원본 PDF의 참고 도입 사례 기관 (있는 경우)
  painPoint: string;
  keyFeatures: string[];
  subAgents: string[];
  topecFit: string; // TOPEC 어느 부서/업무에 적용 가능한지
};

export const USE_CASES: UseCase[] = [
  // ── 공공 ──────────────────────────────────────────────
  {
    id: "gov-legal-qa",
    category: "공공",
    name: "법령·지침 질의응답 에이전트",
    painPoint: "실무자가 소관 법령·훈령·업무편람을 검색해 근거를 찾고 공문을 작성하는 데 많은 시간 소요",
    keyFeatures: [
      "소관 법령·훈령·편람 검색 및 근거 조문과 함께 답변",
      "유권해석 통보 공문·요청서 등 후속 문서 초안 자동 작성",
      "전자문서 유통 시스템 연동으로 공문 자동 발송",
    ],
    subAgents: ["지식 검색 Agent", "문서 처리 Agent", "시스템 등록 Agent"],
    topecFit: "총무팀·법무팀 — 사내 규정·정관·계약 표준양식 질의응답",
  },
  {
    id: "gov-assembly-rag",
    category: "공공",
    name: "입법·정책 자료 RAG 파이프라인 에이전트",
    originOrg: "국회 의정지원 사례",
    painPoint: "데이터 선정→메타→파싱→검토→임베딩→검색 전 과정이 수작업이라 1건 처리에 수일 소요",
    keyFeatures: [
      "수집원·키워드 규칙 기반 데이터 자동 선별",
      "표·이미지 포함 복잡 레이아웃 파싱 및 표준 메타 매핑",
      "이상 청크 자동 탐지(HITL은 예외 건만 검토)",
      "RAG 응답에 근거 출처 자동 첨부",
    ],
    subAgents: ["데이터 처리 Agent", "파이프라인 Agent", "RAG 검색 Agent"],
    topecFit: "경영기획팀 — 사내 규정·산업 리포트 대량 문서를 RAG 지식베이스로 자동 구축",
  },
  {
    id: "gov-form-writer",
    category: "공공",
    name: "AI 서식 문서 자동 작성 에이전트",
    originOrg: "한국수력원자력 사례",
    painPoint: "시행계획안·행정보고 서식을 담당자가 1~2시간씩 수기 작성, 완료 후 시스템 재등록 필요",
    keyFeatures: [
      "서식 선택 + 주제 입력만으로 사내 지식 검색 기반 초안 자동 생성",
      "사내 지식(전자결재 등) 연계와 범용 정보 활용을 구분해 사용",
      "HITL 심층 검토 후 원문 포맷 유지 다운로드/저장",
    ],
    subAgents: ["서식 분석 Agent", "지식 검색 Agent", "문서 생성 Agent"],
    topecFit: "행정팀 — 품의서·시행계획서 등 반복 서식 초안 자동 작성",
  },
  {
    id: "gov-org-chart",
    category: "공공",
    name: "조직도 정보 연계 에이전트",
    painPoint: "담당자를 찾기 위해 매번 인사 시스템에 개별 접속, 조직개편 시 갱신 누락으로 오연락 발생",
    keyFeatures: [
      "행정 표준 용어 사전 기반 질의 의도 해석",
      "내부 인사 시스템과 MCP 연동한 최신 조직·인사 정보 조회",
      "동명이인·다건 결과 시 후보 제시 및 근거 기반 응답",
    ],
    subAgents: ["질의 의도 분석 Agent", "조직도 연계 Agent", "응답 생성 Agent"],
    topecFit: "인사팀 — 담당자 조회, 사내 메신저·포털 챗봇 연동",
  },
  {
    id: "gov-budget",
    category: "공공",
    name: "예산 및 집행액 조회 에이전트",
    painPoint: "예산 관리 시스템에 매번 접속해 조회해야 하고, 부서·직책별 접근 통제가 체계화되어 있지 않아 정보 노출 위험 존재",
    keyFeatures: [
      "자연어 질의에서 부서·세부사업·회계연도 등 조회 조건 자동 추출",
      "소속·직책 기준 RBAC 기반 조회 가능 범위 검증",
      "집행률·잔액 자동 계산 및 표·차트 리포트 생성",
    ],
    subAgents: ["의도 분석 Agent", "권한 범위 검증 Agent", "예산 집행 리포트 Agent"],
    topecFit: "재무팀 — 부서별 예산 집행 현황 셀프 조회, 권한 기반 접근통제",
  },
  {
    id: "gov-doc-summary",
    category: "공공",
    name: "문서 요약 에이전트",
    painPoint: "HWP/PDF/XLSX 등 표·병합셀·이미지·직인 같은 비정형 요소가 많은 문서는 일반 텍스트 추출로 정확한 파싱이 어려움",
    keyFeatures: [
      "문서ID 기반 본문·첨부파일 자동 호출",
      "본문·표·첨부 구조 인식 후 Markdown/JSON 변환",
      "표준 기호 체계 기반 요약문 자동 생성",
    ],
    subAgents: ["문서 호출 Agent", "문서 파싱 Agent", "문서 요약 Agent"],
    topecFit: "전 부서 — 계약서·품의서·보고서 자동 요약",
  },
  {
    id: "gov-meeting-room",
    category: "공공",
    name: "회의실 예약 에이전트",
    originOrg: "한국수력원자력 사례",
    painPoint: "회의실 현황 조회부터 조건 확인·예약까지 담당자가 매번 직접 확인해야 하는 번거로움",
    keyFeatures: [
      "자연어 예약 조건 추출 및 운영 규정 대조 검증",
      "가용·대체 회의실 다중 옵션 추천",
      "HITL 최종 승인 후 예약 확정 및 이용안내 자동 발송",
    ],
    subAgents: ["예약 조건 추출 Agent", "운영 규정 검증 Agent", "예약 실행 Agent"],
    topecFit: "총무팀 — 사내 회의실·공용공간 예약 자동화",
  },
  {
    id: "gov-eval-committee",
    category: "공공",
    name: "제안평가 위원 자동 선정 에이전트",
    painPoint: "예비 명부 기반 위원 섭외·문자발송·참석확인·재섭외를 수작업 반복, 분야별 법령 검토 시 담당자 편차 발생",
    keyFeatures: [
      "예비 명부 우선순위 기반 후보자 자동 조회 및 분야별 규정 대조",
      "미충족 시 차순위 후보 자동 재섭외",
      "참석 확인 문자 발송 및 회신 자동 분석",
    ],
    subAgents: ["평가 명부 조회 Agent", "법령 규정 검증 Agent", "문자 수발신 Agent", "리포트 생성 Agent"],
    topecFit: "구매팀 — 입찰 평가위원 섭외 및 이해관계 검증 자동화",
  },

  // ── 교육 ──────────────────────────────────────────────
  {
    id: "edu-faq",
    category: "교육",
    name: "FAQ/상담 자동화 에이전트",
    painPoint: "유사 질문이 반복되지만 상담 이력이 FAQ로 체계화되지 못해 담당자 경험에 따라 답변 품질이 달라짐",
    keyFeatures: ["FAQ 지식 기반 자동 유형 분류 및 검색", "AI 답변 생성 및 응대", "자주 묻는 질문 자동 FAQ화"],
    subAgents: ["유형 분류 Agent", "응대 Agent", "지식 저장 Agent"],
    topecFit: "고객지원팀 — 반복 문의 1차 응대 자동화",
  },
  {
    id: "edu-eval-plan",
    category: "교육",
    name: "평가 계획서 생성 에이전트",
    originOrg: "경기도교육청 사례",
    painPoint: "매 학기 동일 양식을 담당자가 1~2시간씩 수기 작성, 서식 불일치로 이력관리 오류 발생",
    keyFeatures: [
      "과목·평가방법 선택만으로 성취기준 분석 및 초안 자동 생성",
      "RAG 기반 AI 추천으로 평가요소·방법 자동 매핑",
      "HITL 최종 검토 후 서식 자동 적용·저장",
    ],
    subAgents: ["문서 Parser Agent", "교과정보 Agent", "AI 추천 Agent"],
    topecFit: "교육/연수팀 — 사내 교육과정 평가계획서 자동 작성",
  },
  {
    id: "edu-business-trip",
    category: "교육",
    name: "출장·휴강 처리 자동화 에이전트",
    painPoint: "출장 유형 판단부터 휴강계·보강계획서·학생공지까지 여러 시스템에 흩어져 있어 누락 위험",
    keyFeatures: [
      "출장 유형 판단 및 일정 대조(학사시스템 연동)",
      "휴강계·보강계획서 자동 작성 및 서식 검증",
      "학생 개별 안내·포털 공지 및 출장 기안 자동 상신",
    ],
    subAgents: ["분석 Agent", "초안 설계 Agent", "문서화 Agent", "알림·기안 Agent"],
    topecFit: "인사팀 — 출장 신청부터 결재·공지까지 엔드투엔드 자동화",
  },
  {
    id: "edu-roadmap-student",
    category: "교육",
    name: "학사 설계 도우미 에이전트 (구성원용)",
    painPoint: "이수 현황 확인 후 앞으로 이수 요건을 스스로 분석해 로드맵을 설계하는 데 시간·혼란이 큼",
    keyFeatures: ["기이수 내역 자동 조회", "학사 규정·핵심역량 데이터 연동", "이수요건 기반 맞춤 로드맵 자동 생성 및 문서화"],
    subAgents: ["조회 Agent", "연동 Agent", "로드맵 설계 Agent", "문서화 Agent"],
    topecFit: "인사팀 — 사내 교육이수 현황 기반 개인별 성장 로드맵 자동 제안",
  },
  {
    id: "edu-roadmap-staff",
    category: "교육",
    name: "학사 설계 도우미 에이전트 (담당자용)",
    painPoint: "상담 요청마다 대상자의 이수 현황·규정을 매번 대조 확인, 담당자 숙련도에 따라 상담 품질 편차 발생",
    keyFeatures: ["상담 대상 이수내역 자동 조회", "이수요건 기반 매핑 및 로드맵 생성", "상담 이력 자동 기록 및 결과 공지"],
    subAgents: ["분석 Agent", "로드맵 설계 Agent", "문서화 Agent", "알림·기록 Agent"],
    topecFit: "인사팀 — 경력개발 상담 담당자용 보조 도구",
  },

  // ── 기업 ──────────────────────────────────────────────
  {
    id: "corp-it-helpdesk",
    category: "기업",
    name: "IT 헬프데스크 자동화 에이전트",
    painPoint: "담당자가 티켓을 확인하고 답변할 때까지 평균 수십분~수시간 대기, 동일 유형 문의를 매번 수동 작성",
    keyFeatures: [
      "질의 분석·분류 후 하위 Agent로 작업 자동 분기",
      "지식 기반 검색 및 답변 자동화",
      "표준 요청(VPN·계정 등) 자동 조치, 긴급 요청은 담당자 즉시 알림",
    ],
    subAgents: ["오케스트레이터 Agent", "지식 검색/응답 Agent", "자동 조치 Agent", "긴급 알림 Agent"],
    topecFit: "IT팀 — 사내 IT/시스템 문의 1차 대응 자동화 (가장 먼저 적용 추천)",
  },
  {
    id: "corp-proposal-writer",
    category: "기업",
    name: "제안서 작성 자동화 에이전트",
    painPoint: "RFP 확인 후 요구사항 분석, 목차·내용 작성에 많은 시간이 소요되고 반복 작성 시 품질 편차 발생",
    keyFeatures: [
      "입찰공고·RFP 수집 및 요구사항·평가기준 자동 파싱",
      "내부 제품정보·기존 제안서 기반 콘텐츠 자동 생성",
      "작성된 콘텐츠를 제안 서식 문서로 자동화 생성",
    ],
    subAgents: ["데이터 수집 Agent", "분석 Agent", "제안서 작성 Agent", "문서 생성 Agent"],
    topecFit: "영업/구매팀 — 입찰 제안서·견적서 초안 자동 작성",
  },
];

export const CATEGORIES = ["전체", "공공", "교육", "기업"] as const;
