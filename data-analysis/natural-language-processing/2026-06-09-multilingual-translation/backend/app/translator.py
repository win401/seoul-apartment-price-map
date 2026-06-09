from threading import Lock
from typing import Optional

from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

from app.schemas import Language


MODEL_NAME = "facebook/nllb-200-distilled-600M"

LANGUAGES = {
    "en": Language(code="en", name="English", nllb_code="eng_Latn"),
    "ko": Language(code="ko", name="Korean", nllb_code="kor_Hang"),
    "ja": Language(code="ja", name="Japanese", nllb_code="jpn_Jpan"),
    "zh": Language(code="zh", name="Chinese", nllb_code="zho_Hans"),
    "fr": Language(code="fr", name="French", nllb_code="fra_Latn"),
    "de": Language(code="de", name="German", nllb_code="deu_Latn"),
    "es": Language(code="es", name="Spanish", nllb_code="spa_Latn"),
}


class MultilingualTranslator:
    def __init__(self, model_name: str = MODEL_NAME):
        self.model_name = model_name
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
        self.model.eval()
        self._lock = Lock()

    def translate(self, text: str, source_language: str, target_language: str) -> str:
        if source_language not in LANGUAGES:
            raise ValueError(f"Unsupported source language: {source_language}")
        if target_language not in LANGUAGES:
            raise ValueError(f"Unsupported target language: {target_language}")

        source_code = LANGUAGES[source_language].nllb_code
        target_code = LANGUAGES[target_language].nllb_code

        with self._lock:
            self.tokenizer.src_lang = source_code
            inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
            forced_bos_token_id = self.tokenizer.convert_tokens_to_ids(target_code)

            output_tokens = self.model.generate(
                **inputs,
                forced_bos_token_id=forced_bos_token_id,
                max_length=256,
            )

            return self.tokenizer.batch_decode(output_tokens, skip_special_tokens=True)[0]


_translator: Optional[MultilingualTranslator] = None
_translator_lock = Lock()


def get_translator() -> MultilingualTranslator:
    global _translator

    with _translator_lock:
        if _translator is None:
            _translator = MultilingualTranslator()

    return _translator
