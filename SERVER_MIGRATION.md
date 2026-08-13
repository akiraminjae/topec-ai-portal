# 서버 이전 가이드 (다른 PC/사내 서버로 옮기기)

이 문서는 지금까지 Vercel + Render(클라우드 데모)에서 돌아가던 TOPEC AI 포털을
**다른 PC나 사내 서버로 통째로 옮겨서** 그 서버에서 직접 운영하기 위한 가이드입니다.
이번 이전부터는 승인함(governance)·연동 설정(auth) 데이터가 **PostgreSQL에 실제로
저장**되어 서버를 재시작해도 데이터가 사라지지 않습니다.

---

## 0. 이 zip에 들어있는 것 / 빠진 것

- 포함: 전체 소스 코드(`frontend/`, `backend/`), `docker-compose.yml`, 각종 문서(README,
  ARCHITECTURE, DEPLOY 등), `.env.example`
- **제외됨: `backend/gateway/.env` (실제 API 키가 들어있는 파일)** — 보안상 zip에 담지
  않았습니다. 새 서버에서 아래 1단계처럼 다시 만들어야 합니다.
- 제외됨: `node_modules/`, `.next/`, `__pycache__/`, `.git/` — 새 서버에서 자동
  생성되거나(`docker compose up`이 빌드) 불필요한 폴더입니다.

## 1. 사전 준비 (새 서버)

- Docker + Docker Compose가 설치되어 있어야 합니다 (인터넷 연결된 서버 기준 —
  `docker compose up --build` 실행 시 필요한 이미지·패키지를 그때 내려받습니다).
- LLM API 키 (Anthropic/OpenAI/Gemini 중 최소 1개) — 기존에 쓰던 키를 그대로 쓰거나
  새로 발급받으세요.

## 2. 폴더 옮기기

1. 이 zip을 새 서버의 원하는 위치에 풀어주세요. 예: `/opt/topec-ai-portal`
2. 환경변수 파일을 다시 만듭니다.

   ```bash
   cd topec-ai-portal
   cp .env.example backend/gateway/.env
   # backend/gateway/.env 를 열어 ANTHROPIC_API_KEY 등 실제 값을 채워 넣으세요.
   ```

3. (권장) `docker-compose.yml`의 `postgres` 서비스 비밀번호를 기본값
   (`change-me-in-prod`)에서 실제 운영 비밀번호로 바꾸세요. 바꾼 경우
   `governance-service`, `auth-service`의 `DATABASE_URL` 환경변수도 같은 비밀번호로
   맞춰주세요 (`docker-compose.yml` 안에 세 군데 모두 있습니다).

## 3. 실행

```bash
docker compose up --build -d
docker compose ps        # 9개 컨테이너(postgres, vector-db, internal-llm, gateway,
                          # document/knowledge/agent-lifecycle/observability/governance/
                          # auth-service, hwp-parser-service, frontend)가 모두 Up 상태인지 확인
```

- 프론트엔드: `http://<서버IP>:3000`
- 게이트웨이 Swagger: `http://<서버IP>:8100/docs`

## 4. 데이터베이스 확인

승인함(HITL)·이메일/일정 연동 설정·문서 추출 결과는 이제 `postgres` 컨테이너의
PostgreSQL에 저장됩니다. 다음으로 실제 저장 여부를 확인할 수 있습니다.

```bash
docker compose exec postgres psql -U topec -d topec_portal -c "\dt"
# approvals, integrations, documents 테이블이 보이면 정상입니다.

docker compose restart governance-service auth-service document-service
# 재시작 후에도 /governance/approvals, /auth/integrations, /documents 데이터가 그대로면 성공.
```

`knowledge_service`(RAG)는 PostgreSQL이 아니라 `vector-db`(Chroma) 컨테이너에 문서 청크를
저장합니다 — `document_service`가 문서를 추출할 때마다 자동으로 색인 요청을 보냅니다
(`GET /knowledge/search`로 확인 가능). 나머지 2개 공통 서비스(agent-lifecycle/observability)는
아직 비즈니스 로직이 없는 스텁 상태입니다 — 개발팀이 실제 기능을 구현할 때 DB가 필요하면
같은 `postgres` 컨테이너를 재사용하면 됩니다 (document_service/governance_service/
auth_service의 `db.py`/`models.py` 패턴을 그대로 복사해서 시작하면 빠릅니다).

## 5. 클라우드 데모(Vercel/Render)와의 관계

기존에 배포해둔 `https://topec-ai-portal.vercel.app` 데모는 이 서버 이전과
별개로 계속 동작합니다. 다만 그쪽은 `DATABASE_URL`을 지정하지 않아 SQLite로
자동 폴백되어 있고, Render 컨테이너가 재배포될 때마다 초기화됩니다 — 데모/시연
용도로만 쓰고, 실제 운영 데이터는 이번에 옮기는 사내 서버 쪽을 기준으로
삼으세요.

## 6. 다음 단계 (구축계획서 STEP 04~06과 연결)

1. 사내 GPU 서버에 vLLM/Ollama로 실제 "사내 서빙" 구축 → `INTERNAL_LLM_ENDPOINT` 교체
2. 사내 SSO 연동 (`auth_service`), 그룹웨어·전자결재·ERP 커넥터 (`gateway`)
3. 리버스 프록시·방화벽 등 폐쇄망 보안 구성
4. 나머지 4개 공통 서비스에 실제 비즈니스 로직 + DB 연동 추가
