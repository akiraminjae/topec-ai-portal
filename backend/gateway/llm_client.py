"""
LLM 클라이언트 — 외부 API 연동 + 사내 서빙(폐쇄망) 하이브리드

두 경로를 하나의 인터페이스(LLMClient.generate)로 감싸, 게이트웨이 상위 로직(main.py)은
어느 경로로 라우팅되었는지 신경 쓰지 않고 동일하게 호출할 수 있습니다.

환경변수:
  LLM_PROVIDER              anthropic | openai | gemini   (외부 API 공급자, 기본값 anthropic)
  ANTHROPIC_API_KEY         외부 API(Anthropic) 키
  OPENAI_API_KEY            외부 API(OpenAI) 키 (LLM_PROVIDER=openai 인 경우)
  GOOGLE_API_KEY            외부 API(Gemini) 키 (LLM_PROVIDER=gemini 인 경우)
  EXTERNAL_MODEL            외부 API 모델명 (기본값 claude-sonnet-5, gemini는 gemini-2.0-flash 권장)
  INTERNAL_LLM_ENDPOINT     사내 서빙 엔드포인트 (OpenAI 호환, 기본값 로컬 개발용 Ollama)
  INTERNAL_LLM_MODEL        사내 서빙 모델명

사내 서빙(INTERNAL_LLM_ENDPOINT)은 실제 TOPEC 폐쇄망 GPU 서버에 vLLM/Ollama 등으로
구축된 뒤 이 엔드포인트를 그 서버 주소로 교체하면 됩니다. (TODO: 실사내 서버 연동)
"""
import os
import httpx


EXTERNAL_MODEL = os.getenv("EXTERNAL_MODEL", "claude-sonnet-5")
INTERNAL_LLM_ENDPOINT = os.getenv("INTERNAL_LLM_ENDPOINT", "http://internal-llm:11434")
INTERNAL_LLM_MODEL = os.getenv("INTERNAL_LLM_MODEL", "llama3.1")
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "anthropic")


class LLMClient:
    async def generate_external(self, message: str, system: str = "") -> dict:
        """외부 API(Anthropic/OpenAI/Gemini)를 호출합니다."""
        key_env = {"anthropic": "ANTHROPIC_API_KEY", "openai": "OPENAI_API_KEY", "gemini": "GOOGLE_API_KEY"}.get(
            LLM_PROVIDER, "ANTHROPIC_API_KEY"
        )
        api_key = os.getenv(key_env)
        if not api_key:
            return {
                "ok": False,
                "route": "external_api",
                "error": f"{key_env} 환경변수가 설정되지 않았습니다. "
                         f".env 파일에 키를 채운 뒤 다시 시도하세요.",
            }

        try:
            if LLM_PROVIDER == "anthropic":
                return await self._call_anthropic(message, system, api_key)
            if LLM_PROVIDER == "gemini":
                return await self._call_gemini(message, system, api_key)
            return await self._call_openai(message, system, api_key)
        except Exception as exc:  # noqa: BLE001 — 데모용 스캐폴드이므로 광범위 예외 처리
            return {"ok": False, "route": "external_api", "error": str(exc)}

    async def _call_anthropic(self, message: str, system: str, api_key: str) -> dict:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": EXTERNAL_MODEL,
                    "max_tokens": 1024,
                    "system": system or "당신은 TOPEC AI 포털의 업무 보조 에이전트입니다.",
                    "messages": [{"role": "user", "content": message}],
                },
            )
            resp.raise_for_status()
            data = resp.json()
            text = "".join(block.get("text", "") for block in data.get("content", []))
            return {"ok": True, "route": "external_api", "provider": "anthropic", "text": text}

    async def _call_openai(self, message: str, system: str, api_key: str) -> dict:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "content-type": "application/json"},
                json={
                    "model": EXTERNAL_MODEL,
                    "messages": [
                        {"role": "system", "content": system or "당신은 TOPEC AI 포털의 업무 보조 에이전트입니다."},
                        {"role": "user", "content": message},
                    ],
                },
            )
            resp.raise_for_status()
            data = resp.json()
            text = data["choices"][0]["message"]["content"]
            return {"ok": True, "route": "external_api", "provider": "openai", "text": text}

    async def _call_gemini(self, message: str, system: str, api_key: str) -> dict:
        model = EXTERNAL_MODEL if EXTERNAL_MODEL != "claude-sonnet-5" else "gemini-2.0-flash"
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                params={"key": api_key},
                json={
                    "system_instruction": {
                        "parts": [{"text": system or "당신은 TOPEC AI 포털의 업무 보조 에이전트입니다."}]
                    },
                    "contents": [{"role": "user", "parts": [{"text": message}]}],
                },
            )
            resp.raise_for_status()
            data = resp.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return {"ok": True, "route": "external_api", "provider": "gemini", "text": text}

    async def generate_internal(self, message: str, system: str = "") -> dict:
        """사내 서빙(폐쇄망) 엔드포인트를 호출합니다. (OpenAI 호환 API 가정)

        로컬 개발 환경에서는 docker-compose의 internal-llm(Ollama) 컨테이너를 바라봅니다.
        실제 TOPEC 폐쇄망 배포 시 INTERNAL_LLM_ENDPOINT를 사내 GPU 서버 주소로 교체하세요.
        """
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    f"{INTERNAL_LLM_ENDPOINT}/v1/chat/completions",
                    json={
                        "model": INTERNAL_LLM_MODEL,
                        "messages": [
                            {"role": "system", "content": system or "당신은 TOPEC AI 포털의 업무 보조 에이전트입니다."},
                            {"role": "user", "content": message},
                        ],
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                text = data["choices"][0]["message"]["content"]
                return {"ok": True, "route": "internal_serving", "provider": "internal", "text": text}
        except Exception as exc:  # noqa: BLE001
            return {
                "ok": False,
                "route": "internal_serving",
                "error": f"사내 서빙 엔드포인트({INTERNAL_LLM_ENDPOINT}) 호출 실패: {exc}. "
                         f"TODO: 사내 GPU 서버에 vLLM/Ollama 구축 후 INTERNAL_LLM_ENDPOINT 설정 필요",
            }


llm_client = LLMClient()
