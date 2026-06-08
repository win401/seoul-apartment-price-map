# Few-Shot Movie Recommendation Chatbot

영화 리뷰 데이터를 이용해 사용자의 취향 문장을 분석하고, 유사 리뷰 검색 결과와 few-shot 예제를 함께 넣어 영화 추천 응답을 생성하는 실무 응용 실습입니다.

## Goal

수업 문서 `docs/few_shot_추천챗봇.docx`의 흐름을 실제 동작하는 형태로 구현합니다.

1. 사용자 취향 입력
2. 키워드/감정/장르 의도 분석
3. `ratings_train.txt`에서 유사 리뷰 검색
4. 심층 질문 답변으로 취향 프로필 생성
5. Few-shot 예제와 유사 리뷰를 조합해 프롬프트 생성
6. GPT 또는 fallback recommender로 추천 결과 생성
7. Next.js 화면에서 결과 확인

## Structure

```text
practical_application/
  data/
    ratings_train.txt
  docs/
    few_shot_추천챗봇.docx
  notebooks/
    00_original_practical_application.ipynb
    01_few_shot_movie_recommendation.ipynb
  backend/
    main.py
    requirements.txt
    app/
      recommender.py
      schemas.py
  nextjs-movie-recommender/
    src/app/
```

## Run Backend

```bash
cd /Users/sungwoo/Desktop/work/class/data-analysis/practical_application/backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --port 8013 --reload
```

OpenAI API를 사용하려면:

```bash
cp .env.example .env
```

그다음 `.env` 파일에 실제 키를 넣습니다.

```text
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
MOVIE_REVIEW_MAX_DOCS=50000
TMDB_API_KEY=...
```

`.env` 파일은 Git에 올리지 않습니다. OpenAI 키가 없으면 유사 리뷰와 규칙 기반 fallback 추천이 동작합니다. TMDb 키가 없으면 포스터/영화 메타데이터 없이 추천 결과만 표시됩니다.

## Run Frontend

```bash
cd /Users/sungwoo/Desktop/work/class/data-analysis/practical_application/nextjs-movie-recommender
npm install
npm run dev -- --port 3013
```

Frontend URL:

```text
http://localhost:3013
```

## Learning Points

- Few-shot prompting
- TF-IDF style review retrieval
- Domain guard for non-movie requests
- Deep preference interview profile
- TMDb poster and movie metadata lookup
- 검색 결과를 LLM 프롬프트 컨텍스트로 넣는 RAG-like workflow
- Python backend + Next.js frontend 연결
- 수업 코드를 포트폴리오형 서비스 화면으로 확장
