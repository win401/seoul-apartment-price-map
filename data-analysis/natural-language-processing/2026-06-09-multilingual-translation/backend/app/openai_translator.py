import os

from dotenv import load_dotenv
from openai import OpenAI


load_dotenv()

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.2")

LANGUAGE_NAMES = {
    "en": "English",
    "ko": "Korean",
    "ja": "Japanese",
    "zh": "Chinese",
    "fr": "French",
    "de": "German",
    "es": "Spanish",
}


def is_openai_configured() -> bool:
    return bool(os.getenv("OPENAI_API_KEY", "").strip())


class OpenAITranslationProvider:
    def __init__(self, model: str = OPENAI_MODEL):
        if not is_openai_configured():
            raise ValueError("OPENAI_API_KEY is not configured")

        self.model = model
        self.client = OpenAI()

    def translate(self, text: str, source_language: str, target_language: str) -> str:
        source_name = LANGUAGE_NAMES.get(source_language, source_language)
        target_name = LANGUAGE_NAMES.get(target_language, target_language)

        response = self.client.responses.create(
            model=self.model,
            instructions=(
                "You are a professional translation engine. "
                f"Translate from {source_name} to {target_name}. "
                "Return only the translated text. Do not add explanations, quotes, "
                "markdown, alternatives, or pronunciation guides."
            ),
            input=text,
        )

        return response.output_text.strip()
