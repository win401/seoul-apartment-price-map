import json
from pathlib import Path

from sacrebleu.metrics import BLEU

from app.schemas import EvaluationCase
from app.openai_translator import (
    OPENAI_MODEL,
    OpenAITranslationProvider,
    is_openai_configured,
)
from app.translator import get_translator


CASES_PATH = Path(__file__).with_name("evaluation_cases.json")
PASS_THRESHOLD = 8
BLEU_THRESHOLD = 25.0


def interpret_bleu(score: float) -> str:
    if score >= 70:
        return "매우 높음"
    if score >= 50:
        return "높음"
    if score >= 30:
        return "보통"
    if score >= 10:
        return "낮음"
    return "매우 낮음"


def calculate_sentence_bleu(hypothesis: str, reference: str) -> dict:
    bleu = BLEU(effective_order=True)
    result = bleu.sentence_score(hypothesis, [reference])
    score = round(result.score, 2)

    return {
        "score": score,
        "reference_text": reference,
        "interpretation": interpret_bleu(score),
    }


def load_evaluation_cases() -> list[EvaluationCase]:
    raw_cases = json.loads(CASES_PATH.read_text(encoding="utf-8"))
    return [EvaluationCase(**case) for case in raw_cases]


def evaluate_translation(actual_text: str, case: EvaluationCase) -> dict:
    bleu = calculate_sentence_bleu(actual_text, case.expected_text)
    matched_keywords = [
        keyword for keyword in case.required_keywords if keyword in actual_text
    ]

    return {
        "actual_text": actual_text,
        "matched_keywords": matched_keywords,
        "bleu_score": bleu["score"],
        "passed": bool(matched_keywords) or bleu["score"] >= BLEU_THRESHOLD,
    }


def summarize_provider(
    provider: str,
    model_name: str,
    available: bool,
    provider_results: list[dict],
    error: str = "",
) -> dict:
    total = len(provider_results)
    passed_count = sum(1 for result in provider_results if result["passed"])
    average_bleu = (
        round(sum(result["bleu_score"] for result in provider_results) / total, 2)
        if total
        else 0.0
    )

    return {
        "provider": provider,
        "model_name": model_name,
        "available": available,
        "total": total,
        "passed": passed_count,
        "failed": total - passed_count,
        "average_bleu": average_bleu,
        "suite_passed": available and passed_count >= PASS_THRESHOLD,
        "error": error,
    }


def run_evaluation_suite(include_openai: bool = True) -> dict:
    cases = load_evaluation_cases()
    nllb_translator = get_translator()
    openai_provider = None
    openai_error = ""

    if include_openai:
        if is_openai_configured():
            try:
                openai_provider = OpenAITranslationProvider()
            except Exception as error:
                openai_error = str(error)
        else:
            openai_error = "OPENAI_API_KEY is not configured"

    results = []
    nllb_provider_results = []
    openai_provider_results = []

    for case in cases:
        nllb_text = nllb_translator.translate(
            case.source_text,
            case.source_language,
            case.target_language,
        )
        nllb_result = evaluate_translation(nllb_text, case)
        nllb_provider_results.append(nllb_result)

        evaluations = {
            "nllb": {
                "provider": "nllb",
                "model_name": "facebook/nllb-200-distilled-600M",
                "error": "",
                **nllb_result,
            }
        }

        if include_openai:
            if openai_provider:
                try:
                    openai_text = openai_provider.translate(
                        case.source_text,
                        case.source_language,
                        case.target_language,
                    )
                    openai_result = evaluate_translation(openai_text, case)
                    openai_provider_results.append(openai_result)
                    evaluations["openai"] = {
                        "provider": "openai",
                        "model_name": OPENAI_MODEL,
                        "error": "",
                        **openai_result,
                    }
                except Exception as error:
                    openai_error = str(error)
                    evaluations["openai"] = {
                        "provider": "openai",
                        "model_name": OPENAI_MODEL,
                        "actual_text": "",
                        "matched_keywords": [],
                        "bleu_score": 0.0,
                        "passed": False,
                        "error": openai_error,
                    }
            else:
                evaluations["openai"] = {
                    "provider": "openai",
                    "model_name": OPENAI_MODEL,
                    "actual_text": "",
                    "matched_keywords": [],
                    "bleu_score": 0.0,
                    "passed": False,
                    "error": openai_error,
                }

        results.append(
            {
                "id": case.id,
                "source_language": case.source_language,
                "target_language": case.target_language,
                "source_text": case.source_text,
                "expected_text": case.expected_text,
                "required_keywords": case.required_keywords,
                "evaluations": evaluations,
            }
        )

    models = [
        summarize_provider(
            "nllb",
            "facebook/nllb-200-distilled-600M",
            True,
            nllb_provider_results,
        )
    ]

    if include_openai:
        models.append(
            summarize_provider(
                "openai",
                OPENAI_MODEL,
                bool(openai_provider) and not openai_error,
                openai_provider_results,
                openai_error,
            )
        )

    available_models = [model for model in models if model["available"]]
    winner = ""
    if available_models:
        winner = max(
            available_models,
            key=lambda model: (model["passed"], model["average_bleu"]),
        )["provider"]

    return {
        "total": len(cases),
        "pass_threshold": PASS_THRESHOLD,
        "bleu_threshold": BLEU_THRESHOLD,
        "models": models,
        "winner": winner,
        "results": results,
    }


def evaluate_article_against_reference(
    source_text: str,
    reference_text: str,
    source_language: str = "en",
    target_language: str = "ko",
    include_openai: bool = True,
) -> dict:
    nllb_translator = get_translator()
    results = {}

    nllb_text = nllb_translator.translate(source_text, source_language, target_language)
    nllb_bleu = calculate_sentence_bleu(nllb_text, reference_text)
    results["nllb"] = {
        "provider": "nllb",
        "model_name": "facebook/nllb-200-distilled-600M",
        "available": True,
        "translated_text": nllb_text,
        "bleu_score": nllb_bleu["score"],
        "bleu_interpretation": nllb_bleu["interpretation"],
        "source_length": len(source_text),
        "translated_length": len(nllb_text),
        "error": "",
    }

    if include_openai:
        if is_openai_configured():
            try:
                openai_provider = OpenAITranslationProvider()
                openai_text = openai_provider.translate(
                    source_text,
                    source_language,
                    target_language,
                )
                openai_bleu = calculate_sentence_bleu(openai_text, reference_text)
                results["openai"] = {
                    "provider": "openai",
                    "model_name": OPENAI_MODEL,
                    "available": True,
                    "translated_text": openai_text,
                    "bleu_score": openai_bleu["score"],
                    "bleu_interpretation": openai_bleu["interpretation"],
                    "source_length": len(source_text),
                    "translated_length": len(openai_text),
                    "error": "",
                }
            except Exception as error:
                results["openai"] = {
                    "provider": "openai",
                    "model_name": OPENAI_MODEL,
                    "available": False,
                    "translated_text": "",
                    "bleu_score": 0.0,
                    "bleu_interpretation": "",
                    "source_length": len(source_text),
                    "translated_length": 0,
                    "error": str(error),
                }
        else:
            results["openai"] = {
                "provider": "openai",
                "model_name": OPENAI_MODEL,
                "available": False,
                "translated_text": "",
                "bleu_score": 0.0,
                "bleu_interpretation": "",
                "source_length": len(source_text),
                "translated_length": 0,
                "error": "OPENAI_API_KEY is not configured",
            }

    available_results = [
        result for result in results.values() if result["available"] and not result["error"]
    ]
    winner = ""
    if available_results:
        winner = max(available_results, key=lambda result: result["bleu_score"])[
            "provider"
        ]

    return {
        "source_language": source_language,
        "target_language": target_language,
        "source_text": source_text,
        "reference_text": reference_text,
        "reference_provider": "papago",
        "winner": winner,
        "results": results,
    }
