# TOPEC AI 포털 — 아키텍처 매핑

`TOPEC_AI포털_구축계획서_v2.pptx` (슬라이드 5 구성도) 의 5개 레이어를 실제 코드 구조에
그대로 대응시켰습니다.

| 구성도 레이어 | 코드 위치 | 설명 |
|---|---|---|
| ① 사용자 접점 (Agentic OS) | `frontend/app/page.tsx` + `components/ChatSidebar.tsx` + `components/ChatWorkspace.tsx` + `components/DocumentPanel.tsx` | 원본 PDF 참고 화면 그대로: 좌측 채팅 이력/에이전트 목록, 중앙 대화형 인터페이스, 우측 문서 뷰어 3단 레이아웃 |
| 포털 스위처 | `components/PortalSwitcher.tsx` | 좌상단 드롭다운으로 Agentic OS/Marketplace/Studio/Admin 간 전환 (원본 PDF 우측 "포털 이동" 플라이아웃 재현) |
| Marketplace | `frontend/app/marketplace` | 승인된 에이전트 전사 공유 |
| ② 빌더 스튜디오 (Studio) | `frontend/app/builder` | 노코드 에이전트 제작 (현재는 LLM 라우팅 시뮬레이터만 구현) |
| Admin | `frontend/app/admin` | 대시보드 · 도구 관리 · 가드레일. 공통 서비스 6종의 `/health`를 실시간 조회하는 상태 대시보드 포함 |
| ③ 공통 서비스 레이어 | `backend/services/*` | 문서처리 / 데이터·지식연동(RAG) / 에이전트 라이프사이클 / 관측·모니터링 / 거버넌스·감사·가드레일 / 계정·권한(SSO) — 총 6개 독립 FastAPI 서비스. + `hwp_parser_service`(Node.js, hwp/hwpx 전문 파싱을 document_service가 위임 호출) |
| ④ 연동 게이트웨이 | `backend/gateway` | 모든 요청의 단일 경유점. `routing.py`가 LLM 하이브리드 라우팅(외부 API ↔ 사내 서빙)을 결정하고, `llm_client.py`가 실제 호출을 수행. `frontend/next.config.js`의 rewrites가 `/api/gateway/*`, `/api/services/{name}/*` 프록시를 담당 |
| ⑤ 인프라·데이터 | `docker-compose.yml` | postgres(구조화 데이터), vector-db(RAG), internal-llm(사내 서빙 로컬 대역) |

## LLM 하이브리드 라우팅 (구축계획서 슬라이드 11)

`backend/gateway/routing.py`의 `decide_route()`가 4가지 기준을 점수화합니다.

1. 데이터 민감도 (`data_sensitivity`) — sensitive/confidential이면 +3점
2. 보안 등급 (`security_grade`) — high/restricted이면 +3점
3. 처리 빈도 (`daily_call_volume`) — 일 500회 이상이면 +2점
4. 성능 요구 (`performance_requirement`) — high이면 -1점(외부 API의 최신 모델 활용 유리)

합산 점수가 3점 이상이면 **사내 서빙(폐쇄망)**, 미만이면 **외부 API**로 라우팅합니다.
임계값과 가중치는 `routing.py` 상단 상수로 조정 가능합니다. (TODO: 실제 운영 데이터 기반 튜닝)

## RAG 파이프라인 (document_service → knowledge_service)

`document_service`가 문서를 추출할 때마다 결과 텍스트를 `knowledge_service`의
`POST /knowledge/index`로 자동 전달해 색인합니다 (`document_service/main.py`의
`_index_in_knowledge_service()`). `knowledge_service`는 텍스트를 문자 수 기준으로
청킹(`chunking.py`)한 뒤 로컬 다국어 임베딩 모델(sentence-transformers,
paraphrase-multilingual-MiniLM-L12-v2)로 임베딩해 `vector-db`(Chroma)에 저장합니다.
`POST /knowledge/search`로 의미 기반 검색이 가능합니다. 외부 API 키가 필요 없어
폐쇄망에서도 동작하지만, 최초 실행 시 임베딩 모델 파일(~470MB)을 1회 내려받습니다.

프론트엔드 `DocumentPanel.tsx`가 이 파이프라인과 실제로 연동되어 있습니다 — 문서를
업로드하면 `document_service`가 구조 분석 + 텍스트 추출을 하고, 그 결과가 자동으로
`knowledge_service`에 색인됩니다.

## hwp/hwpx 파싱 (hwp_parser_service)

docx/xlsx/pdf는 `document_service`가 파이썬 라이브러리(python-docx/openpyxl/pypdf)로
직접 파싱하지만, hwp(3.x/5.x 바이너리)·hwpx(OWPML)는 자체 구현 대신 Node.js 라이브러리
[kordoc](https://github.com/chrisryugj/kordoc)(MIT)을 쓰는 별도 서비스
`backend/services/hwp_parser_service`에 위임합니다. `document_service/parsers.py`가
`HWP_PARSER_URL`(기본값 `http://hwp-parser-service:8107`)로 파일을 전달하고 구조 요약 +
텍스트를 돌려받습니다.

**알려진 트레이드오프**: kordoc이 의존하는 `@huggingface/transformers`(OCR용) 트리에
`sharp`/`adm-zip` 관련 high severity npm 취약점이 남아있습니다(`npm audit`) — 상위
kordoc 자체를 구버전으로 내리지 않는 한 지금 시점엔 완전히 해소할 수 없는, kordoc
상류(upstream)의 이슈입니다. 이 서비스는 사내 전용으로만 노출하고, 파일 업로드
크기 제한(50MB, `server.js`)을 유지하며, kordoc 업데이트를 주기적으로 확인하세요.

## 아직 비어있는 부분 (TODO)

- agent_lifecycle_service/observability_service의 실제 비즈니스 로직 (지금은 스켈레톤 +
  mock 응답. document_service/knowledge_service/governance_service/auth_service는 실제
  로직까지 구현됨)
- knowledge_service 청킹은 문자 수 기준 슬라이딩 윈도우 — 문장/문단 경계 인식 등 고도화 여지
- 사내 SSO(SAML/OAuth) 연동 (auth_service)
- HITL 승인 워크플로우 UI 및 감사로그 저장소 (governance_service)
- 사내 GPU 서버에 vLLM/Ollama 등으로 실제 사내 서빙 구축 (internal-llm 교체)
- 사내 시스템 커넥터(그룹웨어·전자결재·ERP) — 게이트웨이에 추가
- 인증/인가 미들웨어를 게이트웨이 앞단에 적용
- CI/CD, 폐쇄망 배포 파이프라인
