# Practice Workflow

이 저장소의 수업 실습은 `Python-first, Next.js-frontend` 원칙으로 진행한다.

## Core Principle

수업 개념과 모델 로직은 Python으로 먼저 구현하고, 사용자가 보는 화면은 Next.js로 구현한다.

```text
Jupyter Notebook
→ Python backend
→ Next.js frontend
→ README / portfolio note
→ Git commit / push
```

## 1. Python First

수업에서 제공되는 예제 코드가 Python이면 Python 흐름을 우선한다.

필수 산출물:

- `notebooks/`: 수업용 Jupyter Notebook
- `backend/`: FastAPI 기반 API 서버
- `backend/app/`: 분석, 추천, 예측 로직
- `backend/requirements.txt`: Python 의존성

Python에서 담당할 것:

- CSV/Excel/PDF 등 데이터 읽기
- 전처리
- 토큰화, TF-IDF, 머신러닝, 딥러닝, 추천/예측 로직
- 모델 학습/추론
- 결과를 JSON으로 반환하는 API

## 2. Next.js Frontend

Next.js는 사용자 화면과 서비스 경험을 담당한다.

필수 산출물:

- `frontend/`: Next.js app
- 입력 폼
- 결과 카드/표/그래프
- 로딩/에러 상태
- API 호출 코드

Next.js에서 담당할 것:

- 사용자 입력 받기
- Python API 호출
- 결과 시각화
- 포트폴리오용 화면 완성도

Next.js에서 하지 않을 것:

- 수업 핵심 로직을 Python 없이 TypeScript로만 대체하지 않는다.
- 단순 UI를 넘는 ML/NLP 계산을 프론트에 숨기지 않는다.

## 3. Recommended Folder Structure

```text
YYYY-MM-DD-topic/
  README.md

  data/
    raw/
    processed/

  notebooks/
    01_practice.ipynb

  backend/
    requirements.txt
    main.py
    app/
      service.py
      schemas.py

  frontend/
    package.json
    src/app/
      page.tsx

  reports/
  outputs/
  notes/
```

## 4. API Rule

Python backend는 FastAPI를 기본으로 사용한다.

기본 흐름:

```text
Browser
→ Next.js frontend
→ FastAPI backend
→ Python logic
→ JSON response
→ Next.js rendering
```

기본 포트:

- FastAPI: `8000`, 이미 사용 중이면 `8001`, `8002`
- Next.js: 실습별로 `3010+` 범위 사용

## 5. README Rule

새 실습을 만들 때 README에는 반드시 아래를 적는다.

- 수업 주제
- 데이터 출처/파일
- Python Notebook 실행 방법
- FastAPI backend 실행 방법
- Next.js frontend 실행 방법
- 핵심 로직 요약
- 포트폴리오로 확장할 포인트

## 6. Git Rule

실습 단위로 작업 후 Git에 남긴다.

커밋 전 확인:

- 수업용 노트북 존재
- Python backend 실행 가능
- Next.js build 가능
- README 업데이트
- 원본 데이터 또는 샘플 데이터 포함 여부 확인

커밋 대상에서 제외:

- `node_modules/`
- `.next/`
- `.venv/`
- 대용량 원본 데이터
- 사용자 개인 API 키가 담긴 `.env`

## 7. Current Exception

이미 만들어진 아래 실습은 Next.js 내부 TypeScript로 로직이 구현되어 있다.

- `nextjs-news-search`
- `nextjs-menu-recommender`

이들은 기존 실습 자산으로 유지하되, 이후 새 실습부터는 Python backend와 Next.js frontend를 분리한다.

필요하면 기존 앱도 나중에 FastAPI backend 구조로 리팩터링한다.
