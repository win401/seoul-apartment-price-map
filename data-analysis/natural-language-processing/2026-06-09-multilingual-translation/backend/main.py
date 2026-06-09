from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.evaluation import (
    calculate_sentence_bleu,
    evaluate_article_against_reference,
    run_evaluation_suite,
)
from app.domain_processor import process_domain_text
from app.schemas import (
    ArticleEvaluationRequest,
    ArticleEvaluationResponse,
    DomainProcessRequest,
    DomainProcessResponse,
    EvaluationSuiteResponse,
    TranslateRequest,
    TranslateResponse,
)
from app.translator import LANGUAGES, MODEL_NAME, get_translator


app = FastAPI(title="Multilingual Translation Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3014",
        "http://127.0.0.1:3014",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "name": "Multilingual Translation Backend",
        "model": MODEL_NAME,
        "endpoints": [
            "/health",
            "/languages",
            "/translate",
            "/evaluation/run",
            "/evaluation/article",
            "/domain/process",
        ],
    }


@app.get("/health")
def health():
    return {"ok": True, "model": MODEL_NAME, "languages": len(LANGUAGES)}


@app.get("/languages")
def languages():
    return {"languages": [language.model_dump() for language in LANGUAGES.values()]}


@app.post("/translate", response_model=TranslateResponse)
def translate(payload: TranslateRequest):
    try:
        translated_text = get_translator().translate(
            payload.text,
            payload.source_language,
            payload.target_language,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    reference_text = payload.reference_text.strip()
    bleu = (
        calculate_sentence_bleu(translated_text, reference_text)
        if reference_text
        else None
    )

    return TranslateResponse(
        source_language=payload.source_language,
        target_language=payload.target_language,
        source_text=payload.text,
        translated_text=translated_text,
        model_name=MODEL_NAME,
        source_length=len(payload.text),
        translated_length=len(translated_text),
        bleu=bleu,
    )


@app.post("/evaluation/run", response_model=EvaluationSuiteResponse)
def run_evaluation():
    return run_evaluation_suite()


@app.post("/evaluation/article", response_model=ArticleEvaluationResponse)
def evaluate_article(payload: ArticleEvaluationRequest):
    try:
        return evaluate_article_against_reference(
            source_text=payload.source_text,
            reference_text=payload.reference_text,
            source_language=payload.source_language,
            target_language=payload.target_language,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.post("/domain/process", response_model=DomainProcessResponse)
def process_domain(payload: DomainProcessRequest):
    try:
        return process_domain_text(
            domain=payload.domain,
            task=payload.task,
            source_text=payload.source_text,
            source_language=payload.source_language,
            target_language=payload.target_language,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
