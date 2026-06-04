# Three Year Prediction Model

## Purpose

2014년 시점에서 3억 이하로 접근 가능한 서울 아파트 후보의 2017년 가격을 예측해본다.

과거 데이터이므로 예측값과 실제 2017년 값을 비교할 수 있다.

## Persona

초보 부동산 투자자.

- 투자금: 약 3억 원
- 투자 기간: 3년
- 질문: 2014년에 3억 이하 후보를 봤다면, 2017년 가격 상승을 얼마나 잘 예측할 수 있었을까?

## Data

- 기준 시점: 2014년
- 검증 시점: 2017년
- 비교 단위: `dong + apt + area_bucket`
- 대상: 3억 이하 후보 중 2014년/2017년 거래가 각각 3건 이상인 후보
- 전체 모델 데이터: 1,292개
- 학습 데이터: 969개
- 검증 데이터: 323개

## Features

- `base_price_manwon`
- `base_area`
- `area_bucket`
- `base_floor`
- `base_building_age`
- `base_count`
- `base_price_per_area`

## Metrics

| 지표 | 값 |
| --- | ---: |
| MAE | 1,854만원, 약 0.1854억 원 |
| RMSE | 2,407만원, 약 0.2407억 원 |
| R2 | 0.8718 |
| 상승/하락 방향 정확도 | 98.76% |

## Interpretation

- 이 모델은 실제 미래를 예측한 것이 아니라, 과거 데이터로 3년 후 예측 구조를 검증한 것이다.
- 예측 가격 오차는 `MAE`로 해석한다.
- 상승/하락 방향 정확도는 후보가 3년 후 올랐는지 여부를 맞힌 비율이다.
- 현재 모델은 좌표/주변시설/구 단위 정책/역세권 정보를 사용하지 않았기 때문에 지도 서비스용으로는 추가 feature가 필요하다.

## Output Files

- `reports/three_year_prediction_model_metrics.csv`
- `reports/three_year_prediction_high_error_samples.csv`
- `data/processed/three_year_prediction_validation_results.csv`
- `data/processed/map_export_predicted_top_growth_2014_2017.csv`
- `outputs/08_three_year_actual_vs_predicted.png`
- `outputs/09_three_year_growth_actual_vs_predicted.png`
- `outputs/10_three_year_abs_error_distribution.png`

## Next Action

1. 오차가 큰 후보를 확인한다.
2. 예측 상승률 상위 후보가 실제 상승률도 높았는지 비교한다.
3. `dong` 또는 `gu` 집계 feature를 추가한다.
4. 지도 서비스용 좌표 데이터를 붙인다.
