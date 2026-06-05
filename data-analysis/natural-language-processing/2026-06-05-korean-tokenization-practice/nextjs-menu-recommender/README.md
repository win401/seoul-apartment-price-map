# Menu Recommender

맛집 메뉴 CSV 데이터를 이용해 자연어 입력과 음식 이미지에 맞는 메뉴를 추천하는 한국어 NLP/멀티모달 실습 앱입니다.

이 실습은 `Python backend + Next.js frontend` 구조를 사용합니다.

## Goal

사용자가 `해장 잘되는 음식`, `칼칼한 음식`, `다이어트에 좋은 음식`처럼 상황이나 취향을 입력하면 CSV에 있는 메뉴 설명과 비교해 어울리는 메뉴를 추천합니다.

또한 음식 이미지를 업로드하면 Python backend가 음식을 추정하고, 추정 결과를 기존 메뉴 추천 로직에 연결합니다.

## Structure

```text
backend/
  main.py
  requirements.txt
  app/
    service.py   # CSV, 토큰화, TF-IDF, 추천 로직
    vision.py    # 이미지 분석, Vision API/fallback
    schemas.py
  data/
    menu-data.csv

src/app/
  page.tsx       # Next.js frontend
```

## Data

```text
backend/data/menu-data.csv
```

CSV 컬럼:

```text
메뉴명, 카테고리, 설명
```

## Recommendation Logic

1. 사용자 입력을 한국어 정규식 기반으로 토큰화
2. `해장`, `칼칼함`, `다이어트`, `든든함`, `고소함`, `상큼함` 같은 의도 키워드 확장
3. 메뉴명 + 카테고리 + 설명을 토큰화
4. TF-IDF 벡터와 코사인 유사도 계산
5. 의도 키워드가 메뉴 설명과 맞으면 보정 점수 추가
6. 이미지에서 추정한 메뉴명이 CSV 메뉴와 맞으면 이미지 매칭 보너스 추가
7. 최종 점수순으로 메뉴 추천

## Image Recognition

이미지 추천은 두 방식으로 동작합니다.

1. `OPENAI_API_KEY`가 있으면 OpenAI Vision 모델로 음식명을 추정합니다.
2. 키가 없으면 파일명에서 메뉴명을 추정하는 fallback으로 동작합니다.

예를 들어 `kimchi-jjigae.jpg`, `김치찌개.png` 같은 파일명은 김치찌개 후보로 매칭될 수 있습니다.

## Run Backend

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8000
```

Optional:

```bash
export OPENAI_API_KEY=your_api_key
export OPENAI_VISION_MODEL=gpt-4o-mini
```

Backend URL:

```text
http://127.0.0.1:8000
```

## Run Frontend

```bash
npm install
npm run dev -- --port 3012
```

Open:

```text
http://localhost:3012
```

If the backend port changes:

```bash
NEXT_PUBLIC_MENU_API_BASE=http://127.0.0.1:8001 npm run dev -- --port 3012
```

## API

Text recommendation:

```text
POST /recommend/text
```

Image recommendation:

```text
POST /recommend/image
```

## Practice Ideas

- 형태소 분석기(Okt/MeCab) 결과와 현재 정규식 토큰화 결과 비교
- 사용자 입력 로그를 모아 자주 나오는 의도 키워드 사전 만들기
- 메뉴별 `매운맛`, `국물`, `가벼움`, `고기`, `치즈` 같은 태그를 별도 컬럼으로 추가
- TF-IDF 추천과 임베딩 기반 추천 결과 비교
- OpenAI Vision API 방식과 직접 학습한 음식 분류 모델 비교
- 실제 식당 메뉴판 CSV를 넣어 업종별 추천 챗봇으로 확장
