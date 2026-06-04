# Seoul Apartment Price Prediction Practice

서울 아파트 실거래 데이터를 활용해 `3억 투자금을 가진 초보 부동산 투자자`를 위한 3년 후 가격 예측 프로토타입을 만든 머신러닝 실습 프로젝트입니다.

분석 결과는 Jupyter Notebook과 리포트로 정리했고, 최종 후보 데이터는 Next.js + Leaflet 기반 지도 서비스로 시각화했습니다.

## Live Demo

- 배포 URL: https://nextjs-map-prototype.vercel.app
- 웹앱 폴더: `nextjs-map-prototype/`

## Project Goal

단순히 아파트 가격을 예측하는 것보다, 초보 투자자가 이해할 수 있는 형태로 `현재 가격`, `3년 후 예측 가격`, `실제 검증 가격`, `예측 오차`를 비교하는 것이 목표입니다.

핵심 질문:

- 3억 이하 투자금으로 볼 수 있는 서울 아파트 후보는 어디인가?
- 2014년 기준 정보만 가지고 2017년 가격을 어느 정도 예측할 수 있는가?
- 예측 결과를 지도 화면으로 보여주면 의사결정에 도움이 되는가?

## Dataset

- 데이터 출처: 수업 실습 데이터
- 원본 데이터 위치: `data/raw/21265_transaction_price_data/`
- 학습 데이터: `train.csv`, 1,216,553행, 13열
- 테스트 데이터: `test.csv`, 5,463행, 12열
- 분석 범위: 서울특별시 아파트 거래 데이터
- 예측 대상: `transaction_real_price`

단위 해석:

- `transaction_real_price`: 만원 단위
- 예: `50,000` = `50,000만 원` = `5억 원`
- `price_per_pyeong`: 만원/평 단위

## Practice Flow

1. 원본 데이터 구조 파악
2. 서울 데이터만 분리
3. 평수와 평당 단가 계산
4. 거래가/평당 단가 분포 시각화
5. 이상치 탐지 및 정리 기준 정의
6. baseline 회귀 모델 학습
7. 페르소나 정의: 3억 투자금을 가진 초보 부동산 투자자
8. 2014년 기준 3억 이하 후보 추출
9. 2017년 실제 가격과 비교하는 3년 후 백테스트
10. 예측 후보를 지도 서비스로 시각화
11. Kakao Local API로 주소 좌표 변환
12. Leaflet 지도와 Vercel 배포

## Key Results

서울 데이터:

- 서울 학습 데이터: 742,285행
- cleaned baseline 데이터: 741,987행
- 이상치 제거: 298건, 0.0401%

기초 가격 지표:

- 서울 거래가 중앙값: 40,000만원, 약 4억 원
- 서울 평당 단가 중앙값: 1,770만원/평
- 서울 평당 단가 평균: 2,063만원/평

Baseline 모델:

- 평균값 기준 모델 MAE: 약 2.2237억 원
- 릿지 회귀 모델 MAE: 약 1.6443억 원
- 수치형 부스팅 모델 MAE: 약 1.2186억 원

3년 후 예측 모델:

- 검증 방식: 2014년 데이터로 2017년 가격 예측
- 3억 이하 신뢰 후보: 1,292개
- 2014년 대비 2017년 상승률 중앙값: 약 26.35%
- 3년 후 가격 예측 MAE: 약 0.1854억 원
- 3년 후 가격 예측 RMSE: 약 0.2407억 원
- R2: 0.8718
- 상승/하락 방향 정확도: 98.76%

## Web Prototype

위치:

```bash
nextjs-map-prototype/
```

기능:

- 3억 이하 투자 후보 목록
- 예측 상승률 기준 필터
- Kakao Local API로 변환한 실제 좌표 표시
- Leaflet 지도 마커
- 후보별 상세 패널
- 2014 기준가, 2017 예측가, 2017 실제가 비교
- 예측 상승률, 실제 상승률, 절대오차, 거래 신뢰도 표시

실행:

```bash
cd nextjs-map-prototype
npm install
npm run dev
```

로컬 URL:

```text
http://localhost:3000
```

## Main Files

```text
notebooks/
  01_ml_practice_starter.ipynb
  02_seoul_eda_pyeong_price.ipynb
  03_baseline_regression_model.ipynb
  04_three_year_investment_prediction.ipynb

reports/
  seoul_eda_summary.md
  seoul_outlier_check.md
  baseline_regression_model.md
  ml-practice-persona.md
  three_year_investment_prediction.md
  three_year_prediction_model.md
  nextjs-map-service-plan.md

outputs/
  01_seoul_price_distribution.svg
  02_seoul_price_per_pyeong_distribution.svg
  07_three_year_growth_distribution.png
  08_three_year_actual_vs_predicted.png
  09_three_year_growth_actual_vs_predicted.png
  10_three_year_abs_error_distribution.png

nextjs-map-prototype/
  src/data/candidates.json
  src/app/page.tsx
  src/app/InvestmentMap.tsx
  scripts/geocode-kakao.mjs
```

## Portfolio Value

이 프로젝트는 데이터 분석, 머신러닝, 서비스 기획, 프론트엔드 구현을 하나의 흐름으로 연결합니다.

보여줄 수 있는 역량:

- 대용량 CSV 데이터 탐색
- 데이터 단위 해석 및 파생 변수 생성
- 이상치 탐지와 정제 기준 수립
- 회귀 모델 학습 및 평가
- 백테스트 기반 문제 설정
- 분석 결과를 사용자 관점의 웹 서비스로 전환
- 지도 기반 UI 구현
- GitHub/Vercel 배포 경험

## Limitations

이 프로젝트는 교육용/포트폴리오용 프로토타입입니다.

- 실제 투자 추천 서비스가 아닙니다.
- 2014년과 2017년 사이의 과거 데이터 검증 결과입니다.
- 금리, 정책, 교통, 학군, 재건축, 공급량 같은 외부 변수는 아직 반영하지 않았습니다.
- 데이터셋의 거래 단위와 후보 필터링 기준에 따라 결과가 달라질 수 있습니다.

## Next Steps

- 지도 화면 범위 기준 후보 필터
- 구/동 검색
- 단지명 검색
- 후보 즐겨찾기
- 외부 변수 추가: 지하철, 공원, 학교, 보육시설
- FastAPI 기반 실시간 예측 API
- 서비스 소개용 포트폴리오 페이지 작성
