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

DEFAULT_FOOD_INFO = {
    "calories": 650,
    "servingSize": "1인분",
    "difficulty": "보통",
    "cookingTime": "30분",
    "recipeSteps": [
        "주재료를 먹기 좋은 크기로 손질합니다.",
        "기본 양념이나 소스를 준비합니다.",
        "재료를 익힌 뒤 간을 맞춰 완성합니다.",
    ],
    "nutritionNotes": ["메뉴별 영양 정보가 없을 때 사용하는 기본 추정값입니다."],
}

FOOD_INFO = {
    "된장찌개": {
        "calories": 430,
        "servingSize": "1인분",
        "difficulty": "쉬움",
        "cookingTime": "25분",
        "recipeSteps": [
            "멸치 육수나 물에 된장을 풀어 끓입니다.",
            "두부, 애호박, 양파, 버섯을 넣고 익힙니다.",
            "청양고추와 대파를 넣어 간을 맞춥니다.",
        ],
        "nutritionNotes": ["단백질과 채소를 함께 먹기 좋습니다.", "나트륨은 된장 양에 따라 높아질 수 있습니다."],
    },
    "김치찌개": {
        "calories": 520,
        "servingSize": "1인분",
        "difficulty": "쉬움",
        "cookingTime": "30분",
        "recipeSteps": [
            "잘 익은 김치와 돼지고기를 먼저 볶습니다.",
            "물이나 육수를 붓고 충분히 끓입니다.",
            "두부, 대파, 고춧가루를 넣어 칼칼하게 마무리합니다.",
        ],
        "nutritionNotes": ["해장용 국물 메뉴로 잘 어울립니다.", "김치와 국물 때문에 나트륨 섭취에 주의합니다."],
    },
    "비빔밥": {
        "calories": 590,
        "servingSize": "1그릇",
        "difficulty": "보통",
        "cookingTime": "35분",
        "recipeSteps": [
            "나물과 채소를 각각 데치거나 볶아 준비합니다.",
            "밥 위에 채소, 달걀, 고추장을 올립니다.",
            "참기름을 넣고 골고루 비벼 먹습니다.",
        ],
        "nutritionNotes": ["채소 섭취량을 늘리기 좋습니다.", "고추장과 참기름 양을 줄이면 더 가볍게 먹을 수 있습니다."],
    },
    "갈비탕": {
        "calories": 700,
        "servingSize": "1그릇",
        "difficulty": "어려움",
        "cookingTime": "2시간 이상",
        "recipeSteps": [
            "갈비의 핏물을 빼고 한 번 데칩니다.",
            "무, 대파, 마늘과 함께 오래 끓입니다.",
            "국물 기름을 걷고 소금과 후추로 간합니다.",
        ],
        "nutritionNotes": ["단백질이 풍부하고 든든합니다.", "국물과 고기 지방 섭취량을 조절하면 좋습니다."],
    },
    "삼겹살": {
        "calories": 900,
        "servingSize": "1인분 180g",
        "difficulty": "쉬움",
        "cookingTime": "15분",
        "recipeSteps": [
            "팬이나 불판을 충분히 달굽니다.",
            "삼겹살을 앞뒤로 노릇하게 굽습니다.",
            "쌈채소, 마늘, 쌈장과 함께 곁들입니다.",
        ],
        "nutritionNotes": ["지방 함량이 높은 편입니다.", "쌈채소와 함께 먹으면 식이섬유를 보완할 수 있습니다."],
    },
    "마르게리타피자": {
        "calories": 780,
        "servingSize": "1판 기준 일부",
        "difficulty": "보통",
        "cookingTime": "25분",
        "recipeSteps": [
            "도우에 토마토소스를 얇게 바릅니다.",
            "모짜렐라 치즈와 바질을 올립니다.",
            "오븐에서 치즈가 녹을 때까지 굽습니다.",
        ],
        "nutritionNotes": ["치즈로 인한 지방과 나트륨이 있습니다.", "토마토와 바질 향이 산뜻한 편입니다."],
    },
    "페퍼로니피자": {
        "calories": 920,
        "servingSize": "1판 기준 일부",
        "difficulty": "보통",
        "cookingTime": "25분",
        "recipeSteps": [
            "도우에 토마토소스를 바릅니다.",
            "치즈와 페퍼로니를 넉넉히 올립니다.",
            "오븐에서 바삭하게 구워 완성합니다.",
        ],
        "nutritionNotes": ["열량과 나트륨이 높은 편입니다.", "매콤하고 짭조름한 맛이 강합니다."],
    },
    "까르보나라": {
        "calories": 820,
        "servingSize": "1접시",
        "difficulty": "보통",
        "cookingTime": "25분",
        "recipeSteps": [
            "파스타 면을 삶습니다.",
            "베이컨을 볶고 크림 또는 달걀 소스를 준비합니다.",
            "면과 소스를 섞어 농도를 맞춥니다.",
        ],
        "nutritionNotes": ["크림과 베이컨으로 열량이 높은 편입니다.", "고소하고 부드러운 메뉴를 원할 때 적합합니다."],
    },
    "토마토파스타": {
        "calories": 620,
        "servingSize": "1접시",
        "difficulty": "쉬움",
        "cookingTime": "25분",
        "recipeSteps": [
            "파스타 면을 삶습니다.",
            "올리브오일에 마늘과 토마토소스를 볶습니다.",
            "면을 넣고 소스가 배도록 섞습니다.",
        ],
        "nutritionNotes": ["크림 파스타보다 상대적으로 가벼운 편입니다.", "토마토의 산미가 깔끔합니다."],
    },
    "스테이크": {
        "calories": 750,
        "servingSize": "1인분",
        "difficulty": "보통",
        "cookingTime": "20분",
        "recipeSteps": [
            "고기에 소금과 후추로 밑간합니다.",
            "강한 불에서 겉면을 먼저 굽습니다.",
            "원하는 굽기로 익힌 뒤 잠시 레스팅합니다.",
        ],
        "nutritionNotes": ["단백질이 풍부합니다.", "소스와 버터 사용량에 따라 열량이 달라집니다."],
    },
    "함박스테이크": {
        "calories": 780,
        "servingSize": "1인분",
        "difficulty": "보통",
        "cookingTime": "35분",
        "recipeSteps": [
            "다진 고기와 양파, 빵가루를 섞어 반죽합니다.",
            "패티를 빚어 팬에 굽습니다.",
            "데미글라스 소스를 곁들여 완성합니다.",
        ],
        "nutritionNotes": ["단백질과 지방이 함께 높은 편입니다.", "소스 당류와 나트륨을 조절하면 좋습니다."],
    },
    "초밥": {
        "calories": 520,
        "servingSize": "8~10피스",
        "difficulty": "어려움",
        "cookingTime": "40분",
        "recipeSteps": [
            "식초로 간한 밥을 준비합니다.",
            "생선이나 재료를 얇게 손질합니다.",
            "밥 위에 재료를 올려 모양을 잡습니다.",
        ],
        "nutritionNotes": ["밥 비중이 있어 탄수화물이 포함됩니다.", "간장 사용량에 따라 나트륨이 증가합니다."],
    },
    "라멘": {
        "calories": 760,
        "servingSize": "1그릇",
        "difficulty": "보통",
        "cookingTime": "30분",
        "recipeSteps": [
            "육수를 데우고 면을 삶습니다.",
            "그릇에 소스와 육수를 담습니다.",
            "면, 차슈, 달걀, 파를 올립니다.",
        ],
        "nutritionNotes": ["국물 나트륨이 높은 편입니다.", "든든하고 진한 국물 메뉴입니다."],
    },
    "돈카츠": {
        "calories": 830,
        "servingSize": "1접시",
        "difficulty": "보통",
        "cookingTime": "30분",
        "recipeSteps": [
            "돼지고기를 두드려 소금과 후추로 밑간합니다.",
            "밀가루, 달걀, 빵가루 순서로 입힙니다.",
            "기름에 바삭하게 튀깁니다.",
        ],
        "nutritionNotes": ["튀김 메뉴라 열량이 높은 편입니다.", "샐러드와 함께 먹으면 균형을 맞추기 좋습니다."],
    },
    "짬뽕": {
        "calories": 690,
        "servingSize": "1그릇",
        "difficulty": "보통",
        "cookingTime": "30분",
        "recipeSteps": [
            "해산물과 채소를 센 불에 볶습니다.",
            "고춧가루와 육수를 넣어 얼큰하게 끓입니다.",
            "삶은 면을 담고 국물을 부어 완성합니다.",
        ],
        "nutritionNotes": ["칼칼하고 시원한 국물 메뉴입니다.", "국물 섭취량을 조절하면 나트륨을 줄일 수 있습니다."],
    },
    "짜장면": {
        "calories": 760,
        "servingSize": "1그릇",
        "difficulty": "보통",
        "cookingTime": "30분",
        "recipeSteps": [
            "돼지고기와 양파를 볶습니다.",
            "춘장을 볶아 소스를 만듭니다.",
            "삶은 면 위에 소스를 얹습니다.",
        ],
        "nutritionNotes": ["탄수화물과 소스 열량이 높은 편입니다.", "단맛과 짭조름한 맛이 강합니다."],
    },
    "마파두부": {
        "calories": 580,
        "servingSize": "1접시",
        "difficulty": "보통",
        "cookingTime": "25분",
        "recipeSteps": [
            "다진 고기와 두반장을 볶습니다.",
            "두부와 육수를 넣어 끓입니다.",
            "전분물로 농도를 맞춰 마무리합니다.",
        ],
        "nutritionNotes": ["두부 단백질을 섭취하기 좋습니다.", "매운맛과 나트륨이 강할 수 있습니다."],
    },
    "쌀국수": {
        "calories": 480,
        "servingSize": "1그릇",
        "difficulty": "쉬움",
        "cookingTime": "25분",
        "recipeSteps": [
            "쌀면을 불리거나 삶습니다.",
            "소고기 육수를 데웁니다.",
            "숙주, 고수, 고기를 올려 완성합니다.",
        ],
        "nutritionNotes": ["국수류 중 비교적 가볍게 먹기 좋습니다.", "국물 나트륨은 조절이 필요합니다."],
    },
    "팟타이": {
        "calories": 700,
        "servingSize": "1접시",
        "difficulty": "보통",
        "cookingTime": "25분",
        "recipeSteps": [
            "쌀국수면을 불립니다.",
            "새우, 달걀, 숙주를 볶습니다.",
            "소스와 면을 넣고 땅콩을 뿌립니다.",
        ],
        "nutritionNotes": ["새콤달콤하고 고소한 맛이 강합니다.", "소스 당류와 기름 사용량을 조절하면 좋습니다."],
    },
    "떡볶이": {
        "calories": 650,
        "servingSize": "1인분",
        "difficulty": "쉬움",
        "cookingTime": "20분",
        "recipeSteps": [
            "떡과 어묵을 준비합니다.",
            "고추장, 고춧가루, 설탕으로 소스를 만듭니다.",
            "재료를 소스에 졸여 매콤달콤하게 완성합니다.",
        ],
        "nutritionNotes": ["탄수화물 비중이 높은 간식형 메뉴입니다.", "매운맛과 당류 섭취량을 조절하면 좋습니다."],
    },
}


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


def get_food_info(menu_name: str) -> dict:
    return FOOD_INFO.get(menu_name, DEFAULT_FOOD_INFO)


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
                "foodInfo": get_food_info(menu["name"]),
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
