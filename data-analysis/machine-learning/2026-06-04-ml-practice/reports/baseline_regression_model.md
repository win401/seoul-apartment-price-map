# Baseline Regression Model

## Purpose

이상치 정리된 서울 아파트 데이터로 첫 머신러닝 회귀 모델을 만든다.

이번 단계의 목적은 최고 성능이 아니라 전체 흐름 이해다.

## Data

- Dataset: `data/processed/seoul_train_cleaned_baseline.csv`
- Rows: 741,987
- Train rows: 593,589
- Valid rows: 148,398
- Target: `transaction_real_price` (만원 단위)

## Features

- `exclusive_use_area`
- `transaction_year_month`
- `floor`
- `building_age`

## Metrics

| 모델 | MAE(만원) | MAE(억 원) | RMSE(만원) | RMSE(억 원) | R2 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 수치형 부스팅 모델 | 12,186 | 1.2186 | 18,842 | 1.8842 | 0.6877 |
| 릿지 회귀 모델 | 16,443 | 1.6443 | 24,466 | 2.4466 | 0.4734 |
| 평균값 기준 모델 | 22,237 | 2.2237 | 33,715 | 3.3715 | -0.0000 |


## First Interpretation

- 가장 좋은 첫 모델: 수치형 부스팅 모델
- MAE는 평균적으로 예측이 실제 거래가에서 얼마나 벗어나는지를 뜻한다.
- 예를 들어 MAE 5,000만원은 평균적으로 약 0.5억 원 정도 오차가 난다는 뜻이다.
- 현재 모델은 `dong`, `apt` 같은 위치/아파트명 정보를 아직 쓰지 않았다.
- 서울 부동산 가격은 위치 영향이 크므로, 다음 단계에서 범주형 변수를 추가하면 성능 개선 가능성이 높다.

## Ridge Coefficients

릿지 회귀는 스케일링 후 학습했으므로, 계수는 변수 영향 방향과 상대적 크기를 보는 참고용이다.

| 변수 | 계수 |
| --- | ---: |
| `exclusive_use_area` | 22,433.00 |
| `building_age` | 3,867.69 |
| `floor` | 3,103.20 |
| `transaction_year_month` | 2,025.13 |


## Output Files

- `reports/baseline_model_metrics.csv`
- `reports/baseline_ridge_coefficients.csv`
- `outputs/05_baseline_actual_vs_predicted.png`
- `outputs/06_baseline_residual_distribution.png`

## Next Action

1. Jupyter에서 결과 그래프를 확인한다.
2. 오차가 큰 샘플을 확인한다.
3. `dong`, `apt`를 추가한 범주형 모델을 만든다.
