from __future__ import annotations

import csv
import math
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

from .schemas import RecommendationResponse

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "data" / "menu-data.csv"

STOPWORDS = {
    "음식",
    "메뉴",
    "추천",
    "좋은",
    "먹고",
    "싶어",
    "먹을",
    "만한",
    "오늘",
    "약간",
    "좀",
    "있는",
    "없는",
    "으로",
    "하고",
    "되는",
}

INTENT_RULES = [
    {
        "intent": "해장",
        "triggers": ["해장", "숙취", "술", "국물", "시원", "뜨끈", "따뜻"],
        "expansions": ["국물", "얼큰", "칼칼", "시원", "육수", "찌개", "탕", "라면", "국수"],
    },
    {
        "intent": "칼칼함",
        "triggers": ["칼칼", "얼큰", "매운", "맵", "매콤", "사천", "자극"],
        "expansions": ["칼칼", "얼큰", "매콤", "고추장", "두반장", "짬뽕", "김치", "떡볶이"],
    },
    {
        "intent": "다이어트",
        "triggers": ["다이어트", "가벼운", "가볍", "건강", "채소", "담백", "깔끔"],
        "expansions": ["신선", "나물", "채소", "가볍", "담백", "쌀국수", "비빔밥", "상큼"],
    },
    {
        "intent": "든든함",
        "triggers": ["든든", "배부른", "고기", "보양", "힘", "단백질"],
        "expansions": ["고기", "소갈비", "돼지고기", "진한", "탕", "삼겹살", "돈카츠"],
    },
    {
        "intent": "고소함",
        "triggers": ["고소", "크림", "치즈", "부드러운", "느끼", "꾸덕"],
        "expansions": ["고소", "치즈", "크림", "버터", "모짜렐라", "까르보나라", "리조또"],
    },
    {
        "intent": "상큼함",
        "triggers": ["상큼", "새콤", "개운", "깔끔", "산뜻"],
        "expansions": ["상큼", "새콤", "고수", "숙주", "쌀국수", "팟타이", "토마토"],
    },
]


def load_menus() -> list[dict[str, str]]:
    with DATA_PATH.open(encoding="utf-8-sig", newline="") as file:
        rows = list(csv.DictReader(file))
    return [
        {
            "id": f"menu-{index + 1}",
            "name": row.get("메뉴명", ""),
            "category": row.get("카테고리", ""),
            "description": row.get("설명", ""),
        }
        for index, row in enumerate(rows)
    ]


def normalize_korean_token(token: str) -> str:
    token = re.sub(r"(으로|에서|에게|에는|으로는|하고)$", "", token)
    token = re.sub(r"(에|은|는|이|가|을|를|와|과)$", "", token)
    token = re.sub(r"(스러운|스럽|하고|하게|한)$", "", token)
    return token


def tokenize_korean(text: str) -> list[str]:
    tokens = re.findall(r"[가-힣]+|[a-zA-Z]+|\d+(?:\.\d+)?", str(text).lower())
    normalized: list[str] = []
    for token in tokens:
        if re.search(r"[가-힣]", token):
            token = normalize_korean_token(token)
        if len(token) <= 1 or token in STOPWORDS:
            continue
        normalized.append(token)
    return normalized


def expand_query_tokens(query: str, tokens: Iterable[str]) -> tuple[list[str], list[str]]:
    expanded = set(tokens)
    matched_intents: list[str] = []
    for rule in INTENT_RULES:
        if not any(trigger in query for trigger in rule["triggers"]):
            continue
        matched_intents.append(rule["intent"])
        expanded.update(rule["expansions"])
    return list(expanded), matched_intents


def build_tfidf_vectors(token_docs: list[list[str]]) -> list[dict[str, float]]:
    doc_count = len(token_docs)
    vocabulary = sorted({token for doc in token_docs for token in doc})
    document_frequency = {
        term: sum(1 for doc in token_docs if term in doc) for term in vocabulary
    }

    vectors: list[dict[str, float]] = []
    for tokens in token_docs:
        tf = Counter(tokens)
        vector: dict[str, float] = {}
        for term in vocabulary:
            count = tf.get(term, 0)
            if not count:
                continue
            term_tf = count / max(len(tokens), 1)
            idf = math.log((doc_count + 1) / (document_frequency[term] + 1)) + 1
            vector[term] = term_tf * idf
        vectors.append(vector)
    return vectors


def cosine_similarity(vec_a: dict[str, float], vec_b: dict[str, float]) -> float:
    norm_a = sum(value * value for value in vec_a.values())
    norm_b = sum(value * value for value in vec_b.values())
    if not norm_a or not norm_b:
        return 0
    dot = sum(value * vec_b.get(term, 0) for term, value in vec_a.items())
    return dot / ((norm_a**0.5) * (norm_b**0.5))


def get_intent_score(query: str, menu: dict[str, str]) -> tuple[float, list[str]]:
    text = f"{menu['name']} {menu['category']} {menu['description']}"
    matched: list[str] = []
    score = 0.0
    for rule in INTENT_RULES:
        if not any(trigger in query for trigger in rule["triggers"]):
            continue
        hits = [keyword for keyword in rule["expansions"] if keyword in text]
        if not hits:
            continue
        matched.append(rule["intent"])
        score += min(0.35, len(hits) * 0.08)
    return min(score, 0.6), matched


def top_keywords(tokens: list[str], limit: int = 7) -> list[str]:
    counts = Counter(tokens)
    return [keyword for keyword, _ in counts.most_common(limit)]


def recommend_menus(
    query: str,
    *,
    candidate_names: list[str] | None = None,
    top_n: int = 8,
) -> RecommendationResponse:
    safe_query = query.strip() or "해장 잘되는 음식"
    menus = load_menus()
    query_tokens = tokenize_korean(safe_query)
    expanded_tokens, _ = expand_query_tokens(safe_query, query_tokens)
    candidate_names = candidate_names or []

    token_docs = [
        expanded_tokens,
        *[
            tokenize_korean(f"{menu['name']} {menu['category']} {menu['description']}")
            for menu in menus
        ],
    ]
    vectors = build_tfidf_vectors(token_docs)
    query_vector = vectors[0]
    menu_vectors = vectors[1:]

    results = []
    for menu, menu_vector, menu_tokens in zip(menus, menu_vectors, token_docs[1:]):
        tfidf_score = cosine_similarity(query_vector, menu_vector)
        intent_score, matched_intents = get_intent_score(safe_query, menu)
        image_bonus = 0.0
        if any(candidate in menu["name"] for candidate in candidate_names):
            image_bonus = 0.45
            matched_intents = [*matched_intents, "이미지 매칭"]

        score = min(1, tfidf_score * 0.78 + intent_score + image_bonus)
        results.append(
            {
                **menu,
                "score": score,
                "tfidfScore": tfidf_score,
                "intentScore": intent_score + image_bonus,
                "matchedIntents": matched_intents,
                "keywords": top_keywords(menu_tokens),
            }
        )

    results.sort(key=lambda row: row["score"], reverse=True)
    return RecommendationResponse(
        query=safe_query,
        generatedAt=datetime.now(timezone.utc).isoformat(),
        totalMenus=len(menus),
        tokenizedQuery=query_tokens,
        expandedQuery=expanded_tokens,
        results=results[:top_n],
    )
