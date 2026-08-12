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
| ③ 공통 서비스 레이어 | `backend/services/*` | 문서처리 / 데이터·지식연동(RAG) / 에이전트 라이프사이클 / 관측·모니터링 / 거버넌스·감사·가드레일 / 계정·권한(SSO) — 총 6개 독립 FastAPI 서비스 |
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

## 아직 비어있는 부분 (TODO)

- 각 공통 서비스의 실제 비즈니스 로직 (지금은 스켈레톤 + mock 응답)
- hwp(x)/docx/xlsx/pdf 실제 파서 연동 (document_service)
- Vector DB 임베딩·검색 파이프라인 (knowledge_service)
- 사내 SSO(SAML/OAuth) 연동 (auth_service)
- HITL 승인 워크플로우 UI 및 감사로그 저장소 (governance_service)
- 사내 GPU 서버에 vLLM/Ollama 등으로 실제 사내 서빙 구축 (internal-llm 교체)
- 사내 시스템 커넥터(그룹웨어·전자결재·ERP) — 게이트웨이에 추가
- 인증/인가 미들웨어를 게이트웨이 앞단에 적용
- CI/CD, 폐쇄망 배포 파이프라인
