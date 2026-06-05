from __future__ import annotations

import base64
import json
import mimetypes
import os
import urllib.request

from .schemas import ImageAnalysis
from .service import load_menus


def _fallback_from_filename(filename: str) -> ImageAnalysis:
    menus = load_menus()
    lowered = filename.lower()
    detected_name = ""
    for menu in menus:
        if menu["name"] and menu["name"].lower() in lowered:
            detected_name = menu["name"]
            break

    if detected_name:
        query = f"{detected_name}와 비슷한 음식"
        note = "OPENAI_API_KEY가 없어 파일명에서 메뉴명을 추정했습니다."
        confidence = 0.55
        keywords = [detected_name]
    else:
        query = "음식 이미지와 비슷한 메뉴"
        note = "OPENAI_API_KEY가 없어 실제 이미지 판별 대신 일반 메뉴 추천으로 fallback했습니다."
        confidence = 0.0
        keywords = ["음식", "메뉴"]

    return ImageAnalysis(
        provider="filename-fallback",
        detectedName=detected_name or "알 수 없음",
        confidence=confidence,
        visualKeywords=keywords,
        query=query,
        note=note,
    )


def analyze_food_image(filename: str, content_type: str | None, image_bytes: bytes) -> ImageAnalysis:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return _fallback_from_filename(filename)

    mime_type = content_type or mimetypes.guess_type(filename)[0] or "image/jpeg"
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")
    image_url = f"data:{mime_type};base64,{image_base64}"
    menu_names = [menu["name"] for menu in load_menus()]

    prompt = (
        "이미지에 보이는 음식을 한국어로 판별해줘. "
        "반드시 JSON만 반환해. "
        "스키마: {\"detectedName\": string, \"confidence\": number, "
        "\"visualKeywords\": string[], \"query\": string}. "
        f"가능하면 다음 메뉴명 중 하나와 매칭해줘: {', '.join(menu_names)}. "
        "query는 기존 메뉴 추천 시스템에 넣을 한국어 검색 문장으로 만들어줘."
    )
    payload = {
        "model": os.getenv("OPENAI_VISION_MODEL", "gpt-4o-mini"),
        "input": [
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": prompt},
                    {"type": "input_image", "image_url": image_url},
                ],
            }
        ],
    }

    request = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            data = json.loads(response.read().decode("utf-8"))
        text = data.get("output_text", "")
        if not text:
            for output in data.get("output", []):
                for content in output.get("content", []):
                    if content.get("type") in {"output_text", "text"}:
                        text = content.get("text", "")
                        break
                if text:
                    break
        parsed = json.loads(text)
        return ImageAnalysis(
            provider="openai-vision",
            detectedName=str(parsed.get("detectedName") or "알 수 없음"),
            confidence=float(parsed.get("confidence") or 0),
            visualKeywords=[
                str(keyword) for keyword in parsed.get("visualKeywords", [])[:8]
            ],
            query=str(parsed.get("query") or parsed.get("detectedName") or "음식 이미지"),
            note="OpenAI Vision 모델로 이미지 음식을 추정했습니다.",
        )
    except Exception as error:
        fallback = _fallback_from_filename(filename)
        fallback.note = f"Vision API 호출 실패로 fallback했습니다: {error}"
        return fallback
