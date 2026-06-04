# Next.js Map Service Plan

## Working Title

3억 투자자를 위한 서울 아파트 3년 후 가격 예측 지도

## Goal

수업 머신러닝 실습 결과를 Next.js 기반 지도 서비스 프로토타입으로 확장한다.

사용자는 지도에서 관심 지역을 보고, 해당 화면 안의 아파트 후보에 대해 현재 가격과 3년 후 예상 가격을 확인한다.

## User

초보 부동산 투자자.

투자금은 약 3억 원이고, 서울에서 접근 가능한 아파트 후보를 찾고 싶다.

## Core Scenario

1. 사용자가 서울 지도를 연다.
2. 지도 화면 안에 있는 아파트 후보가 표시된다.
3. 사용자가 `3억 이하`, `3억 근처`, `상승률 높은 순`으로 필터링한다.
4. 마커를 클릭하면 현재 가격과 3년 후 예상 가격이 보인다.
5. 사용자는 후보를 비교하고 관심 지역을 좁힌다.

## MVP Features

- 서울 지도 표시
- 아파트 후보 마커 표시
- 3억 기준 필터
- 현재 가격 표시
- 3년 후 예상 가격 표시
- 예상 상승액/상승률 표시
- 동별 평균 상승률 레이어

## Data Pipeline Draft

1. `seoul_train_cleaned_baseline.csv` 사용
2. 거래 데이터를 기준 시점과 미래 시점으로 나눈다.
3. `apartment_id`, `dong`, `apt`, `exclusive_use_area` 기준으로 3년 후 가격 target을 만든다.
4. 모델이 현재 특성으로 3년 후 가격을 예측한다.
5. 예측 결과를 지도 프론트엔드에서 읽기 쉬운 JSON으로 export한다.

## First ML Experiment

과거 데이터로 3년 후 예측을 검증한다.

- 기준 데이터: 2014년 이하 거래
- 미래 target: 2017년 거래가
- 투자금 필터: 기준 가격 3억 이하 또는 3억 근처
- 평가: MAE, 상승률 오차, 상승/하락 방향 정확도

## Map Technology Candidates

- Kakao Maps API
- Naver Maps API
- Mapbox
- Leaflet + OpenStreetMap

초기 포트폴리오 프로토타입은 Leaflet 또는 Kakao Maps 중 하나로 시작한다.

## Important Caveat

이 프로젝트는 실제 투자 추천 서비스가 아니라 교육용/포트폴리오용 데이터 분석 서비스다.

예측값은 투자 판단의 근거가 아니라 참고용 지표로 표시한다.
