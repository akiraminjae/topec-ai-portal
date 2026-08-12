"""
LLM 하이브리드 라우팅 로직 — MCP/API 게이트웨이

TOPEC AI 포털 구축 계획서(slide 11 "LLM 확보 전략") 기준의 라우팅 기준을 코드로 구현합니다.

라우팅 기준 (게이트웨이 라우팅 기준):
  1. 데이터 민감도  — 개인정보·기밀정보 포함 여부
  2. 처리 성능 요구  — 응답속도·정확도 요구 수준
  3. 처리 빈도      — 고빈도 반복 업무는 사내 서빙 우선
  4. 보안 규정      — 부서·업무별 보안 등급 기준

이 모듈은 위 4가지 기준을 하나의 점수로 합산해 EXTERNAL_API 또는 INTERNAL_SERVING
경로를 선택합니다. 실제 운영 시에는 부서별 보안 등급 테이블, 업무별 호출 빈도 통계 등을
DB/설정에서 읽어와 대체해야 합니다. (TODO 표시)
"""
from dataclasses import dataclass
from enum import Enum


class LLMRoute(str, Enum):
    EXTERNAL_API = "external_api"
    INTERNAL_SERVING = "internal_serving"


@dataclass
class RoutingCriteria:
    # "public" | "internal" | "sensitive" | "confidential"
    data_sensitivity: str = "public"
    # "low" | "normal" | "high" — 응답속도·정확도 요구 수준
    performance_requirement: str = "normal"
    # 예상 호출 빈도 (일 평균 호출 수) — 값이 클수록 사내 서빙 우선
    daily_call_volume: int = 0
    # "standard" | "high" | "restricted" — 부서/업무 보안 등급
    security_grade: str = "standard"


@dataclass
class RoutingDecision:
    route: LLMRoute
    reason: str
    score: int  # 사내 서빙 점수(높을수록 사내 서빙 선호)


# 사내 서빙으로 우선 라우팅해야 하는 임계값들 (TODO: 운영 정책에 맞게 조정)
SENSITIVITY_INTERNAL_SET = {"sensitive", "confidential"}
SECURITY_GRADE_INTERNAL_SET = {"high", "restricted"}
HIGH_VOLUME_THRESHOLD = 500  # 일 평균 호출 수


def decide_route(criteria: RoutingCriteria) -> RoutingDecision:
    """4가지 기준을 점수화하여 라우팅 경로를 결정합니다."""
    score = 0
    reasons = []

    if criteria.data_sensitivity in SENSITIVITY_INTERNAL_SET:
        score += 3
        reasons.append(f"데이터 민감도({criteria.data_sensitivity}) → 사내 서빙 우선")

    if criteria.security_grade in SECURITY_GRADE_INTERNAL_SET:
        score += 3
        reasons.append(f"보안 등급({criteria.security_grade}) → 사내 서빙 우선")

    if criteria.daily_call_volume >= HIGH_VOLUME_THRESHOLD:
        score += 2
        reasons.append(f"고빈도 호출({criteria.daily_call_volume}회/일) → 비용 효율상 사내 서빙 우선")

    if criteria.performance_requirement == "high":
        # 성능 요구가 매우 높은 경우, 최신 고성능 모델이 필요할 수 있어 외부 API에 가점
        score -= 1
        reasons.append("높은 성능 요구 → 최신 고성능 모델(외부 API) 우선 고려")

    if score >= 3:
        route = LLMRoute.INTERNAL_SERVING
    else:
        route = LLMRoute.EXTERNAL_API
        if not reasons:
            reasons.append("비민감·저빈도 업무 → 빠른 도입을 위해 외부 API 우선")

    return RoutingDecision(route=route, reason="; ".join(reasons), score=score)
