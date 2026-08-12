# TOPEC AI 포털 — 아키텍처 스캐폴드

`TOPEC_AI포털_구축계획서_v2.pptx`에서 설계한 5계층 아키텍처(사용자접점 · 빌더스튜디오 ·
공통서비스 · 연동게이트웨이 · 인프라)를 실제 실행 가능한 코드 구조로 옮긴 스캐폴드입니다.

**이 스캐폴드의 목적**: 구조를 잡아 개발팀이 이어받아 채워 넣을 수 있게 하는 것입니다.
각 서비스는 health check와 최소 스텁 API만 동작하며, 실제 비즈니스 로직은 `TODO` 주석으로
표시되어 있습니다. (자세한 매핑은 `ARCHITECTURE.md` 참고)

## 폴더 구조

```
topec-ai-portal/
├── frontend/                    # Next.js — 사용자 접점 + 빌더 스튜디오
├── backend/
│   ├── gateway/                 # MCP/API 게이트웨이 + LLM 하이브리드 라우팅
│   └── services/                # 공통 서비스 레이어 (6개 독립 FastAPI 서비스)
│       ├── document_service/
│       ├── knowledge_service/
│       ├── agent_lifecycle_service/
│       ├── observability_service/
│       ├── governance_service/
│       └── auth_service/
├── docker-compose.yml            # 인프라 포함 전체 로컬 실행
└── .env.example                  # 환경변수 템플릿
```

## 실제 URL로 배포하기

로컬 실행이 아니라 실제 접속 가능한 URL로 배포하려면 `DEPLOY.md`를 참고하세요
(Vercel + Render 무료 플랜 기준 단계별 가이드, `render.yaml` 블루프린트 포함).

## 다른 서버(PC)로 옮기기

이 프로젝트를 통째로 다른 PC나 사내 서버로 옮겨서 운영하려면 `SERVER_MIGRATION.md`를
참고하세요. PostgreSQL 연동(승인함·연동설정 데이터 영구 저장) 설정 방법을 포함합니다.

## 로컬 실행 방법

### 1) 환경변수 설정

```bash
cp .env.example backend/gateway/.env
# backend/gateway/.env 를 열어 API 키 등을 채워 넣으세요.
```

### 2) 전체 실행 (Docker — 권장)

```bash
docker compose up --build
```

- 프론트엔드: http://localhost:3000
- 게이트웨이: http://localhost:8100 (Swagger: /docs)
- 공통 서비스: 8101~8106 포트

### 3) 개별 서비스만 로컬로 실행 (개발 중)

```bash
# 게이트웨이
cd backend/gateway
pip install -r requirements.txt
uvicorn main:app --reload --port 8100

# 프론트엔드
cd frontend
npm install
npm run dev
```

## LLM 하이브리드 전략

게이트웨이가 요청마다 **외부 API**(빠른 도입, 최신 모델) 또는 **사내 서빙**(폐쇄망, 데이터
주권)으로 자동 라우팅합니다. 기준과 구현은 `backend/gateway/routing.py`, 실제 호출은
`backend/gateway/llm_client.py`를 참고하세요. 빌더 스튜디오(`/builder`) 페이지에서 라우팅
시뮬레이터로 직접 확인할 수 있습니다.

지원 외부 공급자: Anthropic(Claude, 기본값) · OpenAI · Gemini — `LLM_PROVIDER` 환경변수로 전환.

## 다음 단계 (구축계획서 STEP 03~06과 연결)

이 스캐폴드는 구축계획서의 **STEP 03 핵심 플랫폼 개발(MVP)** 착수 시점의 시작점입니다.
다음은 TOPEC 개발팀이 이어받아야 할 작업입니다.

1. 각 공통 서비스의 실제 로직 구현 (`ARCHITECTURE.md`의 TODO 목록 참고)
2. 사내 GPU 서버에 vLLM/Ollama 등으로 실제 "사내 서빙" 구축 → `INTERNAL_LLM_ENDPOINT` 교체
3. 사내 SSO 연동 (`auth_service`), 그룹웨어·전자결재·ERP 커넥터 (`gateway`)
4. 보안 검토 및 폐쇄망 배포 파이프라인 구성
5. 파일럿 부서 대상 테스트 (구축계획서 STEP 05)

## 주의사항

- `.env` 파일에는 실제 API 키가 들어갑니다. **git에 커밋하지 마세요** (`.gitignore`에 이미 포함됨).
- 이 스캐폴드는 로컬 개발/데모용입니다. 실제 TOPEC 사내 서버(폐쇄망) 배포 전 보안 검토가
  필요합니다.
