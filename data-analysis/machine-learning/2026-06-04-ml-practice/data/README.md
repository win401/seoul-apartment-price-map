# Data

이 폴더의 대용량 원본/가공 데이터는 git에 직접 올리지 않는다.

## Source

원본 데이터 위치:

```text
/Users/sungwoo/Downloads/6:2/21265_transaction_price_data
```

작업용 복사 위치:

```text
data/raw/21265_transaction_price_data/
```

## Why Not Tracked

`train.csv`와 processed CSV가 크기 때문에 일반 git 저장소에 포함하지 않는다.

git에는 아래만 기록한다.

- 노트북
- 분석 리포트
- 그래프 이미지
- 데이터 생성/처리 기준 문서

## Rebuild

필요할 때 원본 데이터를 다시 복사한 뒤 노트북을 순서대로 실행한다.

1. `notebooks/02_seoul_eda_pyeong_price.ipynb`
2. `notebooks/03_baseline_regression_model.ipynb`
3. `notebooks/04_three_year_investment_prediction.ipynb`
