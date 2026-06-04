# 2026-06-04 Machine Learning Practice

## Class Context

- 수업명: 머신러닝 실습
- 강의 자료:
- 실습 주제: 아파트 실거래가 예측
- 사용 도구: Python, pandas, scikit-learn, Jupyter Notebook

## Today Goal

오늘 실습에서 이해해야 할 핵심 목표를 적는다.

- 데이터가 방대하므로 우선 `서울특별시` 기준으로만 분석한다.
- 데이터를 그래프로 시각화해서 가격 분포와 이상치를 눈으로 판단한다.
- `평당 단가`를 계산해서 가격 판단의 기준점을 만든다.
- 머신러닝 연습의 페르소나를 `3억 투자금을 가진 초보 부동산 투자자`로 정의한다.
- 3년 후 가격 상승 가능성을 예측하는 지도 서비스 방향으로 확장한다.

## Key Concepts

수업 중 나온 개념을 짧게 정리한다.

- 지도학습:
- 비지도학습:
- 훈련 데이터 / 테스트 데이터:
- 모델:
- 평가 지표:

## Dataset

- 데이터 출처: 수업 실습 데이터
- 데이터 파일 위치: `data/raw/21265_transaction_price_data/`
- 학습 데이터: `train.csv`, 1,216,553행, 13열
- 테스트 데이터: `test.csv`, 5,463행, 12열
- 서울 학습 데이터: `data/processed/seoul_train_with_pyeong_price.csv`, 742,285행
- 서울 테스트 데이터: `data/processed/seoul_test_with_features.csv`, 3,911행
- 서울 cleaned baseline 데이터: `data/processed/seoul_train_cleaned_baseline.csv`, 741,987행
- 서울 제거된 이상치 데이터: `data/processed/seoul_train_removed_outliers.csv`, 298행
- 3년 후 투자 후보 데이터: `data/processed/three_year_investment_candidates_2014_2017.csv`
- 지도 샘플 export 데이터: `data/processed/map_export_sample_top_growth_2014_2017.csv`
- 3년 후 예측 검증 데이터: `data/processed/three_year_prediction_validation_results.csv`
- 지도 예측 샘플 export 데이터: `data/processed/map_export_predicted_top_growth_2014_2017.csv`
- 제출 양식: `submission.csv`, 5,463행, 2열
- 보조 데이터: `day_care_center.csv`, `park.csv`
- 주요 컬럼: `apartment_id`, `city`, `dong`, `apt`, `exclusive_use_area`, `year_of_completion`, `transaction_year_month`, `transaction_date`, `floor`
- 예측 대상: `transaction_real_price`
- 파생 컬럼: `pyeong`, `price_per_pyeong`, `transaction_year`, `transaction_month`, `building_age`
- 거래가 단위 해석: `transaction_real_price`는 만원 단위로 해석한다. 예: `50,000` = `50,000만 원` = `5억 원`
- 평당 단가 단위 해석: `price_per_pyeong`은 만원/평 단위로 해석한다. 예: `1,770` = `평당 1,770만 원`

## Practice Flow

1. 원본 데이터 불러오기
2. 서울 데이터만 분리하기
3. 평수와 평당 단가 계산하기
4. 가격 분포 시각화하기
5. 평당 단가 분포 시각화하기
6. 연도별 평당 단가 변화 보기
7. 동별 평당 단가 기준점 만들기
8. 머신러닝 목적과 페르소나 정의하기
9. 베이스라인 모델 만들기
10. 예측 결과 해석하기
11. 3억 투자자 기준 3년 후 가격 실험 설계하기
12. Next.js 지도 서비스로 확장하기

## Notes

수업 중 강사님 설명, PDF 핵심 내용, 내가 헷갈린 부분을 적는다.

- `train.csv`에는 정답 컬럼인 `transaction_real_price`가 있고, `test.csv`에는 없다.
- `submission.csv`는 예측 결과를 제출할 때 맞춰야 하는 양식이다.
- `day_care_center.csv`, `park.csv`는 지역 주변 시설 정보를 붙여 성능을 올릴 때 쓸 수 있는 보조 데이터다.
- `transaction_real_price`의 단위는 원 단위가 아니라 데이터셋 기준 거래가 단위로 봐야 한다.
- 현재 실습에서는 `transaction_real_price`를 만원 단위로 해석한다.
- 평당 단가는 `transaction_real_price / (exclusive_use_area / 3.3058)`로 계산했다.

## EDA Output

- `reports/seoul_eda_summary.md`
- `reports/seoul_basic_summary.csv`
- `reports/seoul_top_dong_by_price_per_pyeong.csv`
- `reports/seoul_outlier_check.md`
- `reports/seoul_outlier_summary.csv`
- `reports/seoul_cleaned_baseline.md`
- `reports/seoul_cleaning_rule_summary.csv`
- `reports/seoul_cleaned_before_after_summary.csv`
- `reports/baseline_regression_model.md`
- `reports/baseline_model_metrics.csv`
- `reports/baseline_ridge_coefficients.csv`
- `reports/ml-practice-persona.md`
- `reports/nextjs-map-service-plan.md`
- `reports/three_year_investment_prediction.md`
- `reports/three_year_prediction_model.md`
- `reports/three_year_prediction_model_metrics.csv`
- `reports/three_year_prediction_high_error_samples.csv`
- `outputs/01_seoul_price_distribution.svg`
- `outputs/02_seoul_price_per_pyeong_distribution.svg`
- `outputs/03_median_price_per_pyeong_by_year.svg`
- `outputs/04_top_dong_price_per_pyeong.svg`
- `outputs/05_baseline_actual_vs_predicted.png`
- `outputs/06_baseline_residual_distribution.png`
- `outputs/07_three_year_growth_distribution.png`
- `outputs/08_three_year_actual_vs_predicted.png`
- `outputs/09_three_year_growth_actual_vs_predicted.png`
- `outputs/10_three_year_abs_error_distribution.png`

## Outlier Check

1차 이상치 후보:

- 20억 초과 거래: 4,733건, 0.638%
- 평당 1억 초과: 22건, 0.003%
- 전용면적 250㎡ 초과: 129건, 0.017%
- 건물 나이 음수: 3건
- 층수 0 이하: 144건

## Cleaned Baseline

첫 번째 머신러닝 모델용 데이터셋으로 `seoul_train_cleaned_baseline.csv`를 사용한다.

제거 기준:

- 평당 1억 원/평 초과
- 전용면적 10㎡ 미만
- 전용면적 250㎡ 초과
- 건물 나이 음수
- 층수 0 이하
- 층수 80층 초과

정리 결과:

- 정리 전: 742,285건
- 정리 후: 741,987건
- 제거: 298건
- 제거 비율: 0.0401%

20억 원 초과 거래는 고가 시장일 수 있으므로 첫 baseline에서는 제거하지 않는다.

## Result

- 사용 모델: 평균값 기준 모델, 릿지 회귀 모델, 수치형 부스팅 모델
- 평가 결과:
  - 수치형 부스팅 모델 MAE: 12,186만원, 약 1.2186억 원
  - 릿지 회귀 모델 MAE: 16,443만원, 약 1.6443억 원
  - 평균값 기준 모델 MAE: 22,237만원, 약 2.2237억 원
- 가장 중요한 인사이트:
  - 서울 학습 데이터는 742,285행이다.
  - 서울 기준 거래가 중앙값은 40,000이다.
  - 서울 기준 평당 단가 중앙값은 1,770이다.
  - 서울 기준 평당 단가 평균은 2,063이다.
  - 위치 정보 없이 수치형 변수만 사용하면 평균 오차가 약 1.22억 원까지 내려간다.
  - 다음 성능 개선의 핵심은 `dong`, `apt` 같은 위치/단지 정보다.
  - 2014년 3억 이하 후보를 2017년과 비교한 첫 백테스트에서, 거래 수 필터 통과 후보 1,292개의 상승률 중앙값은 약 26.35%다.
  - 2014년 기준 정보로 2017년 가격을 예측한 첫 모델의 MAE는 약 0.1854억 원이다.
  - 상승/하락 방향 정확도는 98.76%다.

## Portfolio Potential

이 실습을 취업 포트폴리오로 바꿀 수 있는지 판단한다.

- 포트폴리오 가능성: 낮음 / 중간 / 높음
- 연결 가능한 직무:
- 보강하면 좋은 점:

## Business Potential

이 실습이 현재 프로젝트와 연결될 수 있는지 판단한다.

- Kmong_project: 부동산/지역 기반 랜딩페이지 포트폴리오 소재로 확장 가능
- roomy_project: 고시원 입실 가격/입지/시설 분석 아이디어와 연결 가능
- business-idea-lab: 지역 데이터 기반 소상공인/부동산 분석 SaaS 아이디어로 기록 가능
- 기타: 데이터 분석/머신러닝 취업 포트폴리오 후보
- Next.js 지도 서비스: 3억 투자자를 위한 서울 아파트 3년 후 가격 예측 지도 프로토타입으로 확장 가능

## Next Action

- Jupyter에서 `notebooks/04_three_year_investment_prediction.ipynb`를 실행해 3억 투자자 기준 후보를 확인한다.
- 3년 후 예측 모델의 오차가 큰 샘플을 검토한다.
- 예측 상승률 상위 후보가 실제 상승률도 높았는지 비교한다.
- 지도 서비스에 필요한 좌표 데이터를 붙이는 방법을 결정한다.
