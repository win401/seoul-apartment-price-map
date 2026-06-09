from functools import lru_cache

import torch
from transformers import AutoModel, AutoTokenizer


LEGAL_MODEL_NAME = "EunB2/KL-RoBERTa"

LEGAL_TERMS = [
    "계약",
    "합의",
    "조항",
    "의무",
    "권리",
    "책임",
    "손해배상",
    "해지",
    "관할",
    "법률",
    "법령",
    "위반",
    "분쟁",
    "소송",
    "당사자",
    "효력",
    "개인정보",
    "동의",
    "규정",
    "약관",
]

LEGAL_PROTOTYPES = [
    "이 계약은 당사자의 권리와 의무, 책임, 손해배상 및 계약 해지 조건을 규정합니다.",
    "분쟁이 발생하는 경우 관할 법원과 준거법에 따라 법률적 판단이 이루어집니다.",
    "개인정보 처리, 동의, 보관 기간 및 제3자 제공은 관련 법령과 약관을 따라야 합니다.",
]


class KoreanLegalAnalyzer:
    def __init__(self, model_name: str = LEGAL_MODEL_NAME):
        self.model_name = model_name
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name)
        self.model.eval()
        self.prototype_embeddings = [
            self._embed_text(prototype) for prototype in LEGAL_PROTOTYPES
        ]

    def analyze(self, text: str) -> dict:
        embedding = self._embed_text(text)
        similarities = [
            torch.nn.functional.cosine_similarity(embedding, prototype, dim=0).item()
            for prototype in self.prototype_embeddings
        ]
        matched_terms = [term for term in LEGAL_TERMS if term in text]

        return {
            "model_name": self.model_name,
            "token_count": len(self.tokenizer.tokenize(text)),
            "legal_similarity_score": round(max(similarities), 4),
            "matched_terms": matched_terms,
            "note": "KL-RoBERTa 임베딩 기반 법률 문맥 유사도입니다. 법률 판단이나 자문이 아닙니다.",
        }

    def _embed_text(self, text: str) -> torch.Tensor:
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=256,
            padding=True,
        )

        with torch.no_grad():
            outputs = self.model(**inputs)

        hidden = outputs.last_hidden_state.squeeze(0)
        mask = inputs["attention_mask"].squeeze(0).unsqueeze(-1)
        pooled = (hidden * mask).sum(dim=0) / mask.sum(dim=0).clamp(min=1)
        return torch.nn.functional.normalize(pooled, dim=0)


@lru_cache(maxsize=1)
def get_legal_analyzer() -> KoreanLegalAnalyzer:
    return KoreanLegalAnalyzer()
