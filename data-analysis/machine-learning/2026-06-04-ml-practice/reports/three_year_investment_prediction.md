# Three Year Investment Prediction Draft

## Persona

초보 부동산 투자자.

- 투자금: 약 3억 원
- 관심 지역: 서울
- 투자 기간: 3년

## Question

3억 원 정도의 투자금으로 접근 가능한 서울 아파트 후보가 3년 후 얼마나 오를 수 있을까?

## Current Data Range

- 서울 cleaned 데이터 기간: 200801 ~ 201711
- 3억 이하 거래 비율: 27.66%

## First Backtest Design

- 기준 시점: 2014년
- 미래 시점: 2017년
- 비교 단위: `dong + apt + area_bucket`
- 기준 가격: 2014년 중앙 거래가
- 미래 가격: 2017년 중앙 거래가
- 신뢰도 필터: 기준/미래 각각 거래 3건 이상

## Result Summary

- 전체 비교 후보: 7,813개
- 3억 이하 비교 후보: 2,183개
- 거래 수 필터 통과 후보: 1,292개
- 기준 가격 중앙값: 2.40억 원
- 3년 후 가격 중앙값: 3.07억 원
- 상승액 중앙값: 0.62억 원
- 상승률 중앙값: 26.35%

## Output Files

- `data/processed/three_year_investment_candidates_2014_2017.csv`
- `data/processed/map_export_sample_top_growth_2014_2017.csv`
- `outputs/07_three_year_growth_distribution.png`

## Next Step

1. 상위 후보가 실제로 말이 되는지 샘플을 확인한다.
2. 3년 후 가격을 예측하는 모델을 만든다.
3. 지도 서비스에 필요한 좌표 데이터를 붙인다.
