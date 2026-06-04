# Seoul Cleaned Baseline Dataset

## Purpose

머신러닝 첫 베이스라인 모델을 만들기 전에 설명하기 어려운 오류 후보와 극단값 일부를 정리했다.

## Cleaning Policy

20억 초과 거래는 고가 시장일 수 있으므로 이번 cleaned baseline에서는 제거하지 않았다.

제거한 기준:

| 기준 | 단계별 제거 건수 | 남은 건수 | 전체 대비 제거 비율 |
| --- | ---: | ---: | ---: |
| 평당 1억 초과 제거 | 22 | 742,263 | 0.0030% |
| 전용면적 10㎡ 이상 | 0 | 742,263 | 0.0000% |
| 전용면적 250㎡ 이하 | 129 | 742,134 | 0.0174% |
| 건물 나이 0 이상 | 3 | 742,131 | 0.0004% |
| 층수 1층 이상 | 144 | 741,987 | 0.0194% |
| 층수 80층 이하 | 0 | 741,987 | 0.0000% |

## Result

- 원본 서울 train: 742,285건
- cleaned baseline: 741,987건
- 제거된 행: 298건
- 총 제거 비율: 0.0401%

## Output Files

- `data/processed/seoul_train_cleaned_baseline.csv`
- `data/processed/seoul_train_removed_outliers.csv`
- `reports/seoul_cleaning_rule_summary.csv`
- `reports/seoul_cleaned_before_after_summary.csv`

## Next Modeling Policy

첫 번째 모델은 `seoul_train_cleaned_baseline.csv`를 사용한다.

이후 비교 실험:

1. cleaned baseline 모델
2. 20억 초과 거래까지 제외한 일반 시장 모델
3. 고가 거래를 별도로 분리한 모델
