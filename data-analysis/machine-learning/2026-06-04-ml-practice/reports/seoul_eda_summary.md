# Seoul Apartment EDA Summary

## Dataset

- Seoul train rows: 742,285
- Seoul test rows: 3,911
- Target: `transaction_real_price`
- Derived feature: `price_per_pyeong = transaction_real_price / (exclusive_use_area / 3.3058)`
- Unit assumption: `transaction_real_price` is interpreted as 만원. Example: `50,000` = `5억 원`.
- Unit assumption: `price_per_pyeong` is interpreted as 만원/평.

## Key Baseline Numbers

- Median transaction price: 40,000만원, 약 4.0억 원
- Mean transaction price: 49,170만원, 약 4.9억 원
- Median exclusive area: 83.16 m2
- Median pyeong: 25.16
- Median price per pyeong: 1,770만원/평
- Mean price per pyeong: 2,063만원/평

## Output Files

- `outputs/01_seoul_price_distribution.svg`
- `outputs/02_seoul_price_per_pyeong_distribution.svg`
- `outputs/03_median_price_per_pyeong_by_year.svg`
- `outputs/04_top_dong_price_per_pyeong.svg`
- `reports/seoul_basic_summary.csv`
- `reports/seoul_top_dong_by_price_per_pyeong.csv`

## Next ML Persona Draft

Persona: 서울 아파트 매수/투자 후보를 빠르게 비교하고 싶은 초보 부동산 분석가.

ML Objective: 아파트 기본 정보와 거래 시점 정보를 바탕으로 예상 실거래가를 예측하고, 실제 가격 대비 비싼지/저렴한지 판단하는 기준점을 만든다.

First Baseline Features:

- `exclusive_use_area`
- `year_of_completion`
- `transaction_year_month`
- `floor`
- `dong`
- `apt`
- `building_age`
