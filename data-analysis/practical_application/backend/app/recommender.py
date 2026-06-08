from __future__ import annotations

import csv
import json
import math
import os
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

from app.movie_info import fetch_movie_info

try:
    from openai import OpenAI
except Exception:  # pragma: no cover - openai is optional at runtime
    OpenAI = None  # type: ignore


load_dotenv()

DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "ratings_train.txt"
MAX_INDEX_DOCS = int(os.getenv("MOVIE_REVIEW_MAX_DOCS", "50000"))

STOPWORDS = {
    "영화",
    "진짜",
    "너무",
    "정말",
    "보고",
    "봤는데",
    "있는",
    "없는",
    "입니다",
    "합니다",
    "그리고",
    "하지만",
    "그냥",
    "이거",
    "저는",
    "나는",
}

INTENT_KEYWORDS = {
    "romance": {"로맨스", "로맨틱", "사랑", "연애", "감성", "설레", "멜로"},
    "emotional": {"감동", "눈물", "여운", "따뜻", "힐링", "슬픈", "울림"},
    "action": {"액션", "스릴", "전투", "긴장", "속도감", "화려"},
    "comedy": {"코미디", "웃긴", "유쾌", "재미", "가볍", "웃음"},
    "dark": {"공포", "스릴러", "잔인", "무서", "긴장감", "범죄"},
    "family": {"가족", "아이", "함께", "애니", "따뜻", "교훈"},
}

MOVIE_CANDIDATES = {
    "romance": ["어바웃 타임", "클래식", "노트북"],
    "emotional": ["인생은 아름다워", "코코", "원더"],
    "action": ["매드맥스: 분노의 도로", "탑건: 매버릭", "존 윅"],
    "comedy": ["극한직업", "세 얼간이", "스쿨 오브 락"],
    "dark": ["기생충", "나를 찾아줘", "조커"],
    "family": ["코코", "인사이드 아웃", "월-E"],
}

MOVIE_DOMAIN_TERMS = {
    "영화",
    "무비",
    "시네마",
    "극장",
    "관람",
    "배우",
    "감독",
    "장르",
    "로맨스",
    "로맨틱",
    "멜로",
    "드라마",
    "액션",
    "코미디",
    "스릴러",
    "공포",
    "애니",
    "가족",
    "감동",
    "눈물",
    "여운",
    "결말",
    "스토리",
}

OUT_OF_DOMAIN_TERMS = {
    "맛집",
    "식당",
    "카페",
    "음식",
    "메뉴",
    "레시피",
    "요리",
    "여행",
    "숙소",
    "호텔",
    "날씨",
    "주식",
    "코인",
    "부동산",
    "병원",
    "약",
    "운동",
    "쇼핑",
    "옷",
    "노래",
    "음악",
}


@dataclass
class ReviewDoc:
    review_id: str
    text: str
    label: int
    tokens: list[str]
    vector: dict[str, float]


def tokenize(text: str) -> list[str]:
    text = re.sub(r"[^0-9A-Za-z가-힣\s]", " ", text.lower())
    raw_tokens = re.findall(r"[0-9A-Za-z가-힣]{2,}", text)
    tokens: list[str] = []
    for token in raw_tokens:
        normalized = re.sub(r"(은|는|이|가|을|를|에|의|도|만|로|으로)$", "", token)
        if len(normalized) < 2 or normalized in STOPWORDS:
            continue
        tokens.append(normalized)
    return tokens


def detect_intents(query: str) -> list[str]:
    detected: list[str] = []
    for intent, keywords in INTENT_KEYWORDS.items():
        if any(keyword in query for keyword in keywords):
            detected.append(intent)
    return detected or ["emotional"]


def normalize_profile(profile: dict[str, Any] | None) -> dict[str, str]:
    if not profile:
        return {}
    normalized: dict[str, str] = {}
    for key in ("mood", "genre", "ending", "avoid"):
        value = str(profile.get(key, "")).strip()
        if value:
            normalized[key] = value
    return normalized


def profile_to_text(profile: dict[str, str]) -> str:
    labels = {
        "mood": "원하는 감정",
        "genre": "선호 장르/소재",
        "ending": "결말 취향",
        "avoid": "피하고 싶은 요소",
    }
    return "\n".join(f"- {labels[key]}: {value}" for key, value in profile.items())


def is_movie_request(query: str) -> bool:
    compact_query = query.replace(" ", "")
    has_movie_signal = any(term in compact_query for term in MOVIE_DOMAIN_TERMS)
    has_out_of_domain_signal = any(term in compact_query for term in OUT_OF_DOMAIN_TERMS)

    if has_out_of_domain_signal and not has_movie_signal:
        return False
    return True


def build_search_query(query: str, profile: dict[str, str]) -> str:
    if not profile:
        return query
    profile_terms = " ".join(
        value for key, value in profile.items() if key != "avoid"
    )
    return f"{query} {profile_terms}"


def cosine_score(query_vector: dict[str, float], doc_vector: dict[str, float]) -> float:
    return sum(weight * doc_vector.get(token, 0.0) for token, weight in query_vector.items())


def parse_openai_recommendation(content: str) -> dict[str, Any]:
    cleaned = content.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        return {
            "provider": "openai",
            "raw": content,
        }

    confidence = parsed.get("confidence")
    if isinstance(confidence, str):
        try:
            confidence = float(confidence)
        except ValueError:
            confidence = None

    if isinstance(confidence, (int, float)):
        confidence = max(0.0, min(1.0, float(confidence)))
    else:
        confidence = None

    tags = parsed.get("tags")
    if not isinstance(tags, list):
        tags = []

    return {
        "provider": "openai",
        "title": str(parsed.get("title") or "추천 결과"),
        "reason": str(parsed.get("reason") or content),
        "confidence": confidence,
        "tags": [str(tag) for tag in tags],
        "raw": content,
    }


def with_movie_info(recommendation: dict[str, Any]) -> dict[str, Any]:
    title = str(recommendation.get("title") or "").strip()
    if not title or recommendation.get("provider") == "domain-guard":
        return {
            **recommendation,
            "movieInfo": fetch_movie_info(""),
        }
    return {
        **recommendation,
        "movieInfo": fetch_movie_info(title),
    }


class MovieRecommender:
    def __init__(self) -> None:
        self.docs: list[ReviewDoc] = []
        self.idf: dict[str, float] = {}
        self.total_reviews = 0
        self._load_index()

    def _load_rows(self) -> list[tuple[str, str, int]]:
        rows: list[tuple[str, str, int]] = []
        if not DATA_PATH.exists():
            return rows

        with DATA_PATH.open("r", encoding="utf-8", newline="") as file:
            reader = csv.DictReader(file, delimiter="\t")
            for row in reader:
                review_id = row.get("id", "")
                document = (row.get("document") or "").strip()
                label = int(row.get("label") or 0)
                if len(document) < 5:
                    continue
                rows.append((review_id, document, label))
                if len(rows) >= MAX_INDEX_DOCS:
                    break
        return rows

    def _load_index(self) -> None:
        rows = self._load_rows()
        self.total_reviews = len(rows)
        doc_freq: defaultdict[str, int] = defaultdict(int)
        tokenized_rows: list[tuple[str, str, int, list[str]]] = []

        for review_id, text, label in rows:
            tokens = tokenize(text)
            if not tokens:
                continue
            tokenized_rows.append((review_id, text, label, tokens))
            for token in set(tokens):
                doc_freq[token] += 1

        total_docs = max(len(tokenized_rows), 1)
        self.idf = {
            token: math.log((1 + total_docs) / (1 + count)) + 1
            for token, count in doc_freq.items()
        }

        self.docs = [
            ReviewDoc(
                review_id=review_id,
                text=text,
                label=label,
                tokens=tokens,
                vector=self._tfidf(tokens),
            )
            for review_id, text, label, tokens in tokenized_rows
        ]

    def _tfidf(self, tokens: list[str]) -> dict[str, float]:
        counts = Counter(tokens)
        vector = {
            token: (count / len(tokens)) * self.idf.get(token, 0.0)
            for token, count in counts.items()
        }
        norm = math.sqrt(sum(weight * weight for weight in vector.values())) or 1.0
        return {token: weight / norm for token, weight in vector.items()}

    def _query_vector(self, query: str) -> tuple[list[str], dict[str, float]]:
        tokens = tokenize(query)
        return tokens, self._tfidf(tokens) if tokens else {}

    def _similar_reviews(self, query: str, top_k: int) -> list[dict[str, Any]]:
        tokens, query_vector = self._query_vector(query)
        if not query_vector:
            return []

        scored = []
        for doc in self.docs:
            score = cosine_score(query_vector, doc.vector)
            if score > 0:
                scored.append((score, doc))

        scored.sort(key=lambda item: item[0], reverse=True)
        return [
            {
                "id": doc.review_id,
                "text": doc.text,
                "label": "긍정" if doc.label == 1 else "부정",
                "score": round(score, 4),
                "matchedTokens": sorted(set(tokens) & set(doc.tokens)),
            }
            for score, doc in scored[:top_k]
        ]

    def _few_shot_examples(self) -> list[dict[str, str]]:
        return [
            {
                "label": "긍정",
                "review": "액션이 없는데도 재미 있는 몇 안 되는 영화",
                "analysis": "느린 전개라도 몰입감과 감정선이 좋으면 긍정적으로 평가한다.",
            },
            {
                "label": "부정",
                "review": "아 더빙.. 진짜 짜증나네요 목소리",
                "analysis": "연기, 더빙, 몰입 방해 요소가 있으면 부정적으로 평가한다.",
            },
            {
                "label": "중립",
                "review": "담백하고 깔끔해서 좋다. 신문기사로만 보다 직접 보니 느낌이 다르다.",
                "analysis": "강한 재미보다 담백한 분위기와 현실감 있는 구성을 선호한다.",
            },
        ]

    def _build_prompt(
        self,
        query: str,
        intents: list[str],
        similar_reviews: list[dict[str, Any]],
        preference_profile: dict[str, str] | None = None,
    ) -> str:
        examples = "\n".join(
            f"- 예제({item['label']}): \"{item['review']}\" -> {item['analysis']}"
            for item in self._few_shot_examples()
        )
        reviews = "\n".join(
            f"{idx + 1}. ({item['label']}, score={item['score']}) {item['text']}"
            for idx, item in enumerate(similar_reviews)
        )
        intent_text = ", ".join(intents)
        profile_text = (
            profile_to_text(preference_profile or {})
            or "- 추가 취향 정보 없음"
        )
        return f"""당신은 영화 추천 전문가입니다.

사용자 요청을 분석하고, few-shot 예제와 유사 리뷰를 참고해 영화를 추천하세요.

【Few-shot 예제】
{examples}

【검색된 유사 리뷰】
{reviews}

【사용자 요청】
{query}

【심층 취향 프로필】
{profile_text}

【분석된 의도】
{intent_text}

조건:
- 사용자가 피하고 싶은 요소는 추천 이유에서 반드시 고려하세요.
- 취향 프로필과 유사 리뷰가 충돌하면 취향 프로필을 우선하세요.
- 영화 추천과 관련 없는 답변은 하지 마세요.

아래 JSON 형식으로만 답변하세요.
{{
  "title": "추천 영화 제목",
  "reason": "추천 이유",
  "confidence": 0.0,
  "tags": ["태그1", "태그2"]
}}
"""

    def _fallback_recommendation(
        self,
        query: str,
        intents: list[str],
        similar_reviews: list[dict[str, Any]],
        preference_profile: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        primary = intents[0]
        candidates = MOVIE_CANDIDATES.get(primary, MOVIE_CANDIDATES["emotional"])
        positive_count = sum(1 for item in similar_reviews if item["label"] == "긍정")
        confidence = min(0.96, 0.58 + positive_count * 0.07 + len(similar_reviews) * 0.025)
        review_hint = similar_reviews[0]["text"] if similar_reviews else "유사 리뷰가 부족합니다."
        profile_text = (
            " ".join(f"{key}: {value}" for key, value in (preference_profile or {}).items())
            or "추가 취향 정보 없음"
        )
        return {
            "provider": "fallback",
            "title": candidates[0],
            "reason": (
                f"'{query}' 요청에서 {', '.join(intents)} 성향이 감지되었습니다. "
                f"심층 취향({profile_text})을 함께 고려했습니다. "
                f"가장 가까운 리뷰인 '{review_hint[:80]}' 흐름을 참고하면, "
                "감정선과 분위기가 분명한 영화를 먼저 추천하는 것이 적절합니다."
            ),
            "confidence": round(confidence, 2),
            "tags": intents,
        }

    def _call_openai(self, prompt: str) -> dict[str, Any] | None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key or OpenAI is None:
            return None

        try:
            client = OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,
            )
            content = response.choices[0].message.content or ""
            return parse_openai_recommendation(content)
        except Exception as exc:
            return {
                "provider": "openai-error",
                "raw": str(exc),
            }

    def recommend(
        self,
        query: str,
        top_k: int = 5,
        preference_profile: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        normalized_profile = normalize_profile(preference_profile)
        if not is_movie_request(query):
            return {
                "query": query,
                "generatedAt": datetime.now().isoformat(timespec="seconds"),
                "indexedReviews": self.total_reviews,
                "status": "out_of_domain",
                "isMovieRequest": False,
                "message": "저는 영화 추천 챗봇이라 영화 이외의 대화나 추천은 지원하지 않습니다. 보고 싶은 영화의 분위기, 장르, 감정을 알려주세요.",
                "preferenceProfile": normalized_profile,
                "searchQuery": "",
                "intents": [],
                "similarReviews": [],
                "fewShotExamples": [],
                "prompt": "",
                "recommendation": {
                    "provider": "domain-guard",
                    "title": "영화 추천만 도와드릴 수 있어요",
                    "reason": "이 요청은 영화 추천 주제가 아니어서 답변 범위를 제한했습니다.",
                    "confidence": 1.0,
                    "tags": ["out-of-domain"],
                },
                "fallbackRecommendation": {
                    "provider": "domain-guard",
                    "title": "영화 추천만 도와드릴 수 있어요",
                    "reason": "이 요청은 영화 추천 주제가 아니어서 답변 범위를 제한했습니다.",
                    "confidence": 1.0,
                    "tags": ["out-of-domain"],
                },
            }

        search_query = build_search_query(query, normalized_profile)
        intents = detect_intents(search_query)
        similar_reviews = self._similar_reviews(search_query, top_k)
        prompt = self._build_prompt(query, intents, similar_reviews, normalized_profile)
        openai_result = self._call_openai(prompt)
        fallback = self._fallback_recommendation(
            query,
            intents,
            similar_reviews,
            normalized_profile,
        )
        recommendation = with_movie_info(openai_result or fallback)
        fallback = with_movie_info(fallback)

        return {
            "query": query,
            "generatedAt": datetime.now().isoformat(timespec="seconds"),
            "indexedReviews": self.total_reviews,
            "status": "ok",
            "isMovieRequest": True,
            "message": "",
            "preferenceProfile": normalized_profile,
            "searchQuery": search_query,
            "intents": intents,
            "similarReviews": similar_reviews,
            "fewShotExamples": self._few_shot_examples(),
            "prompt": prompt,
            "recommendation": recommendation,
            "fallbackRecommendation": fallback,
        }
