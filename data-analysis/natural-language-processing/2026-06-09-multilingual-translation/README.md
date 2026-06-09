# 2026-06-09 Multilingual Translation Practice

## Class Context

- 수업 주제: Seq2Seq, BLEU, 사전학습 번역 모델
- 예제 파일:
  - `notebooks/example1_seq2seq_basic.ipynb`
  - `notebooks/example2_bleu_evaluation.ipynb`
  - `notebooks/example3_pretrained_translation.ipynb`
- 실습 방향: 수업 노트북으로 번역 모델의 원리를 이해한 뒤, Hugging Face 다국어 모델을 FastAPI와 Next.js로 연결한다.

## Goal

오늘 실습의 목표는 직접 구현한 Seq2Seq 모델과 사전학습 번역 모델의 차이를 이해하고, 실제로 사용할 수 있는 다국어 번역기 프로토타입을 만드는 것이다.

핵심 질문:

- Encoder-Decoder 구조는 문장을 어떻게 읽고 생성하는가?
- BLEU는 번역 품질을 어떤 방식으로 평가하는가?
- 사전학습 모델은 직접 학습한 작은 Seq2Seq 모델보다 왜 좋은 결과를 내는가?
- Python 추론 로직과 Next.js 화면을 어떻게 분리할 수 있는가?

## Files

```text
notebooks/
  example1_seq2seq_basic.ipynb
  example2_bleu_evaluation.ipynb
  example3_pretrained_translation.ipynb

backend/
  main.py
  requirements.txt
  .env.example
  app/
    schemas.py
    translator.py
    openai_translator.py
    domain_processor.py
    legal_analyzer.py
    evaluation.py
    evaluation_cases.json

frontend/
  package.json
  src/app/
    page.tsx
    layout.tsx
    globals.css
    page.module.css

data/
  raw/.gitkeep
  processed/.gitkeep

reports/
outputs/
notes/
```

## Backend

FastAPI backend는 Hugging Face의 NLLB 다국어 번역 모델을 사용한다.

지원 언어:

- English `en`
- Korean `ko`
- Japanese `ja`
- Chinese `zh`
- French `fr`
- German `de`
- Spanish `es`

실행 방법:

```bash
cd data-analysis/natural-language-processing/2026-06-09-multilingual-translation/backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8000
```

API:

```text
GET  /health
GET  /languages
POST /translate
POST /evaluation/run
POST /evaluation/article
POST /domain/process
```

번역 요청 예시:

```json
{
  "text": "Artificial intelligence helps people translate ideas across languages.",
  "source_language": "en",
  "target_language": "ko"
}
```

## Frontend

Next.js frontend는 원문 입력, 원본 언어 선택, 번역 언어 선택, 결과 표시 화면을 담당한다.

실행 방법:

```bash
cd data-analysis/natural-language-processing/2026-06-09-multilingual-translation/frontend
npm install
npm run dev -- --port 3014
```

로컬 URL:

```text
http://localhost:3014
```

평가 페이지:

```text
http://localhost:3014/evaluation
```

평가 페이지는 사용자가 붙여넣은 영어 기사 원문과 파파고 기준 번역문을 비교한다. 백엔드는 NLLB와 OpenAI가 각각 같은 원문을 한국어로 번역하고, 각 결과를 파파고 기준 번역문과 BLEU로 비교한다.

OpenAI 비교 평가를 사용하려면 `backend/.env`에 API 키를 입력한다.

```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-5.2
```

키가 비어 있으면 평가 페이지는 NLLB 결과만 실행하고 OpenAI는 `미설정`으로 표시한다. 키를 입력한 뒤 백엔드 서버를 재시작하면 `/evaluation` 페이지에서 NLLB와 OpenAI 번역 결과, BLEU 점수, 더 높은 점수를 받은 모델을 비교할 수 있다.

도메인 실험실:

```text
http://localhost:3014/domain
```

도메인 실험실은 일반, 법률, 금융, 의류/쇼핑 도메인을 선택하고 번역, 쉬운 설명, 요약, 용어 풀이 작업을 실행한다. OpenAI API 키가 설정되어 있으면 도메인별 프롬프트를 사용하고, 키가 없으면 `번역` 작업에 한해 NLLB 모델로 fallback한다.

법률 도메인은 Hugging Face의 `EunB2/KL-RoBERTa` 모델을 추가로 사용한다. 생성 결과를 한국어 법률 도메인 임베딩으로 분석해 법률 문맥 유사도, 토큰 수, 매칭된 법률 용어를 표시한다. 법률/금융 결과는 학습용이며 전문 자문이 아니다.

## Practice Flow

1. `example1_seq2seq_basic.ipynb`로 Seq2Seq 구조를 이해한다.
2. `example2_bleu_evaluation.ipynb`로 BLEU 평가 방식을 확인한다.
3. `example3_pretrained_translation.ipynb`로 Hugging Face 번역 모델을 실행한다.
4. `backend/`에서 다국어 번역 API를 구현한다.
5. `frontend/`에서 번역기 화면을 완성한다.
6. 번역 결과, 길이 분석, BLEU 평가를 포트폴리오 기능으로 확장한다.
7. `/evaluation` 페이지에서 영어 기사 원문과 파파고 기준 번역문을 입력해 NLLB와 OpenAI 번역 품질을 비교한다.
8. `/domain` 페이지에서 도메인별 번역/설명/요약/용어 풀이를 실험한다.

## Portfolio Direction

- 다국어 고객 문의 번역
- 한국어 포트폴리오 설명의 영어 번역
- 번역 결과와 기준 문장의 BLEU 비교
- 번역 이력 저장 및 언어별 사용 통계
