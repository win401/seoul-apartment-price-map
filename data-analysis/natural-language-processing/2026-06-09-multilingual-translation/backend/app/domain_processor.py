from app.openai_translator import (
    LANGUAGE_NAMES,
    OPENAI_MODEL,
    OpenAITranslationProvider,
    is_openai_configured,
)
from app.legal_analyzer import get_legal_analyzer
from app.translator import MODEL_NAME, get_translator


DOMAIN_LABELS = {
    "general": "general text",
    "legal": "legal text",
    "finance": "financial text",
    "fashion": "fashion and shopping product text",
}

TASK_LABELS = {
    "translate": "translate",
    "explain": "explain in plain language",
    "summarize": "summarize",
    "terms": "extract and explain important terms",
}

DISCLAIMERS = {
    "legal": "학습용 법률 설명이며 법률 자문이 아닙니다.",
    "finance": "학습용 금융 설명이며 투자 자문이 아닙니다.",
    "fashion": "학습용 상품 설명 보조 결과입니다.",
    "general": "학습용 번역/설명 결과입니다.",
}


def process_domain_text(
    domain: str,
    task: str,
    source_text: str,
    source_language: str,
    target_language: str,
) -> dict:
    if domain not in DOMAIN_LABELS:
        raise ValueError(f"Unsupported domain: {domain}")
    if task not in TASK_LABELS:
        raise ValueError(f"Unsupported task: {task}")

    if is_openai_configured():
        result_text = process_with_openai(
            domain,
            task,
            source_text,
            source_language,
            target_language,
        )
        provider = "openai"
        model_name = OPENAI_MODEL
    elif task == "translate":
        result_text = get_translator().translate(
            source_text,
            source_language,
            target_language,
        )
        provider = "nllb"
        model_name = MODEL_NAME
    else:
        result_text = ""
        provider = "none"
        model_name = ""

    error = ""
    if not result_text:
        error = "OPENAI_API_KEY is required for explain, summarize, and terms tasks."

    legal_analysis = None
    if domain == "legal" and result_text:
        legal_analysis = get_legal_analyzer().analyze(result_text)

    return {
        "domain": domain,
        "task": task,
        "source_language": source_language,
        "target_language": target_language,
        "source_text": source_text,
        "result_text": result_text,
        "model_name": model_name,
        "provider": provider,
        "disclaimer": DISCLAIMERS[domain],
        "error": error,
        "legal_analysis": legal_analysis,
    }


def process_with_openai(
    domain: str,
    task: str,
    source_text: str,
    source_language: str,
    target_language: str,
) -> str:
    provider = OpenAITranslationProvider()
    source_name = LANGUAGE_NAMES.get(source_language, source_language)
    target_name = LANGUAGE_NAMES.get(target_language, target_language)
    domain_label = DOMAIN_LABELS[domain]
    task_label = TASK_LABELS[task]

    instructions = (
        "You are a domain-aware language assistant. "
        f"The domain is {domain_label}. The task is to {task_label}. "
        f"Input language: {source_name}. Output language: {target_name}. "
        "Preserve important domain terms. Prefer clear, practical Korean when "
        "the target language is Korean. Do not invent facts. If the text is legal "
        "or financial, keep the wording cautious and educational."
    )

    response = provider.client.responses.create(
        model=provider.model,
        instructions=instructions,
        input=source_text,
    )

    return response.output_text.strip()
