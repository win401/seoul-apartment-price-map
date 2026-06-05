# Menu Recommender

맛집 메뉴 CSV 데이터를 이용해 자연어 입력에 맞는 메뉴를 추천하고, 추천 메뉴의 레시피/칼로리/영양 포인트를 보여주는 한국어 NLP 실습 앱입니다.

이 실습은 `Python backend + Next.js frontend` 구조를 사용합니다.

## Goal

사용자가 `해장 잘되는 음식`, `칼칼한 음식`, `다이어트에 좋은 음식`처럼 상황이나 취향을 입력하면 CSV에 있는 메뉴 설명과 비교해 어울리는 메뉴를 추천합니다.

추천 결과에서는 메뉴별 예상 칼로리, 조리 난이도, 조리 시간, 간단 레시피, 영양 포인트를 함께 확인할 수 있습니다.

## Structure

```text
backend/
  main.py
  requirements.txt
  app/
    service.py   # CSV, 토큰화, TF-IDF, 추천 로직
    vision.py    # 이미지 분석 보류 코드
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
6. 메뉴별 레시피/칼로리/영양 정보를 함께 반환
7. 최종 점수순으로 메뉴 추천

## Food Information

현재 추천 결과에는 실습용 음식 정보가 포함됩니다.

- 예상 칼로리
- 1회 제공량
- 조리 난이도
- 조리 시간
- 간단 레시피
- 영양 포인트

칼로리는 실습용 추정값이며 실제 재료와 조리 방식에 따라 달라질 수 있습니다.

## Paused Image Feature

이미지 업로드 기능은 현재 주석 처리되어 있습니다.

보류된 코드:

- `backend/app/vision.py`
- `backend/main.py`의 `/recommend/image` endpoint 주석
- `src/app/page.tsx`의 이미지 업로드 UI 주석

나중에 다시 활성화할 때는 `OPENAI_API_KEY`를 backend 환경에 넣고 `/recommend/image` endpoint와 업로드 UI를 복구하면 됩니다.

## Run Backend

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8000
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

## Practice Ideas

- 형태소 분석기(Okt/MeCab) 결과와 현재 정규식 토큰화 결과 비교
- 사용자 입력 로그를 모아 자주 나오는 의도 키워드 사전 만들기
- 메뉴별 `매운맛`, `국물`, `가벼움`, `고기`, `치즈` 같은 태그를 별도 컬럼으로 추가
- 식약처/공공데이터 영양 DB와 연결해 칼로리 정보를 실제 데이터로 교체
- TF-IDF 추천과 임베딩 기반 추천 결과 비교
- OpenAI Vision API 방식과 직접 학습한 음식 분류 모델 비교
- 실제 식당 메뉴판 CSV를 넣어 업종별 추천 챗봇으로 확장
