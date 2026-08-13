# 실제 배포 가이드 (Vercel + Render)

이 문서는 `topec-ai-portal`을 실제 URL로 접속 가능하게 배포하는 절차입니다.
**주의**: 이건 데모/공개 배포용입니다. TOPEC의 실제 목표는 사내 서버(폐쇄망) 구축이므로,
이 배포는 검증·시연 목적으로만 사용하고 민감한 실데이터는 넣지 마세요.

계정 생성이나 로그인은 보안상 사용자가 직접 진행해야 합니다. 아래는 단계별 진행 방법입니다.

---

## 0. 사전 준비

- [ ] GitHub 계정
- [ ] Render 계정 (https://render.com — GitHub으로 가입 가능, 무료)
- [ ] Vercel 계정 (https://vercel.com — GitHub으로 가입 가능, 무료)
- [ ] LLM API 키 (Anthropic/OpenAI/Gemini 중 최소 1개)

## 1. GitHub 저장소에 코드 올리기

새 저장소를 만들고 이 폴더 전체(`topec-ai-portal/`)를 푸시합니다.

```bash
cd topec-ai-portal
git init
git add .
git commit -m "TOPEC AI 포털 초기 스캐폴드"
git branch -M main
git remote add origin https://github.com/<your-id>/topec-ai-portal.git
git push -u origin main
```

`.env`는 `.gitignore`에 포함되어 있어 실수로 API 키가 올라가지 않습니다. **커밋 전에
`git status`로 `.env` 파일이 목록에 없는지 한 번 더 확인하세요.**

## 2. 백엔드 배포 (Render Blueprint)

1. Render 대시보드 → **New** → **Blueprint**
2. 방금 만든 GitHub 저장소 선택 → Render가 저장소 루트의 `render.yaml`을 자동 인식
3. 8개 서비스(topec-gateway + 공통서비스 6종 + hwp-parser-service)가 한 번에 생성됩니다 — **Apply**
4. `topec-gateway` 서비스 → **Environment** 탭에서 다음 값을 입력 (사용하는 공급자 키만 넣으면 됩니다):
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY`
   - `GOOGLE_API_KEY`
5. 배포가 끝나면 각 서비스 상단에 실제 URL이 표시됩니다 (예: `https://topec-gateway-xxxx.onrender.com`).
   **7개 URL을 모두 메모해두세요** (hwp-parser-service는 document-service 내부에서만
   호출되므로 별도로 프론트엔드에 알릴 필요는 없습니다) — 3단계에서 필요합니다.

무료 플랜은 15분 미사용 시 슬립되며, 첫 요청 시 기동에 30초~1분 정도 걸릴 수 있습니다.

## 3. 프론트엔드 배포 (Vercel)

1. Vercel 대시보드 → **Add New** → **Project** → 같은 GitHub 저장소 선택
2. **Root Directory**를 `frontend`로 설정 (중요 — 저장소 루트가 아니라 frontend 폴더)
3. **Environment Variables**에 2단계에서 메모한 URL을 그대로 입력:

   | 이름 | 값 |
   |---|---|
   | `GATEWAY_URL` | `https://topec-gateway-xxxx.onrender.com` |
   | `DOCUMENT_SERVICE_URL` | `https://topec-document-service-xxxx.onrender.com` |
   | `KNOWLEDGE_SERVICE_URL` | `https://topec-knowledge-service-xxxx.onrender.com` |
   | `AGENT_LIFECYCLE_SERVICE_URL` | `https://topec-agent-lifecycle-service-xxxx.onrender.com` |
   | `OBSERVABILITY_SERVICE_URL` | `https://topec-observability-service-xxxx.onrender.com` |
   | `GOVERNANCE_SERVICE_URL` | `https://topec-governance-service-xxxx.onrender.com` |
   | `AUTH_SERVICE_URL` | `https://topec-auth-service-xxxx.onrender.com` |

4. **Deploy** 클릭. 완료되면 `https://topec-ai-portal-xxxx.vercel.app` 형태의 실제 URL이 발급됩니다.

## 4. 확인

- `/` — 대화형 인터페이스에서 메시지 전송 → 실제 LLM 응답이 오는지 확인
- `/admin` — 공통 서비스 상태가 전부 "정상"으로 뜨는지 확인 (Render 슬립 직후엔 첫 조회가 실패할 수 있음 — 새로고침)
- `/marketplace`, `/builder`, `/document-agent` 정상 렌더링 확인

## 5. 이후

배포된 URL을 알려주시면 제가 페이지가 정상적으로 뜨는지 점검하고 문제를 함께
디버깅해 드릴 수 있습니다. 다만 대화형 인터페이스가 실제 LLM 응답을 정확히 받아오는지는
사용자님 브라우저에서 직접 메시지를 보내 확인하시는 게 가장 정확합니다.
