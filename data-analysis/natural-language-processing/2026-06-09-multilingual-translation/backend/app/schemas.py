from pydantic import BaseModel, Field
from typing import Optional


class Language(BaseModel):
    code: str
    name: str
    nllb_code: str


class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)
    source_language: str = Field(..., min_length=2, max_length=10)
    target_language: str = Field(..., min_length=2, max_length=10)
    reference_text: str = Field("", max_length=1000)


class BleuEvaluation(BaseModel):
    score: float
    reference_text: str
    interpretation: str


class TranslateResponse(BaseModel):
    source_language: str
    target_language: str
    source_text: str
    translated_text: str
    model_name: str
    source_length: int
    translated_length: int
    bleu: Optional[BleuEvaluation] = None


class EvaluationCase(BaseModel):
    id: int
    source_language: str
    target_language: str
    source_text: str
    expected_text: str
    required_keywords: list[str] = []


class ModelEvaluation(BaseModel):
    provider: str
    model_name: str
    actual_text: str
    matched_keywords: list[str]
    bleu_score: float
    passed: bool
    error: str = ""


class EvaluationResult(BaseModel):
    id: int
    source_language: str
    target_language: str
    source_text: str
    expected_text: str
    required_keywords: list[str]
    evaluations: dict[str, ModelEvaluation]


class ModelEvaluationSummary(BaseModel):
    provider: str
    model_name: str
    available: bool
    total: int
    passed: int
    failed: int
    average_bleu: float
    suite_passed: bool
    error: str = ""


class EvaluationSuiteResponse(BaseModel):
    total: int
    pass_threshold: int
    bleu_threshold: float
    models: list[ModelEvaluationSummary]
    winner: str
    results: list[EvaluationResult]


class ArticleEvaluationRequest(BaseModel):
    source_text: str = Field(..., min_length=1, max_length=3000)
    reference_text: str = Field(..., min_length=1, max_length=3000)
    source_language: str = Field("en", min_length=2, max_length=10)
    target_language: str = Field("ko", min_length=2, max_length=10)


class ArticleModelEvaluation(BaseModel):
    provider: str
    model_name: str
    available: bool
    translated_text: str
    bleu_score: float
    bleu_interpretation: str
    source_length: int
    translated_length: int
    error: str = ""


class ArticleEvaluationResponse(BaseModel):
    source_language: str
    target_language: str
    source_text: str
    reference_text: str
    reference_provider: str
    winner: str
    results: dict[str, ArticleModelEvaluation]


class DomainProcessRequest(BaseModel):
    domain: str = Field(..., min_length=2, max_length=20)
    task: str = Field(..., min_length=2, max_length=20)
    source_text: str = Field(..., min_length=1, max_length=2000)
    source_language: str = Field("en", min_length=2, max_length=10)
    target_language: str = Field("ko", min_length=2, max_length=10)


class LegalAnalysis(BaseModel):
    model_name: str
    token_count: int
    legal_similarity_score: float
    matched_terms: list[str]
    note: str


class DomainProcessResponse(BaseModel):
    domain: str
    task: str
    source_language: str
    target_language: str
    source_text: str
    result_text: str
    model_name: str
    provider: str
    disclaimer: str
    error: str = ""
    legal_analysis: Optional[LegalAnalysis] = None
