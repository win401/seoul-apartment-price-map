# Machine Learning Practice Persona

## Service Direction

이번 실습의 최종 방향은 단순한 아파트 실거래가 예측이 아니다.

최종 목표는 Next.js 기반 지도 서비스다.

사용자가 지도를 움직이면 현재 화면 안의 아파트 후보를 보여주고, 각 후보에 대해 현재 가격 수준과 3년 후 예상 가격을 함께 표시한다.

## Persona

초보 부동산 투자자.

## Investment Context

- 투자금: 약 3억 원
- 관심 지역: 서울
- 투자 기간: 3년
- 목표: 지금 3억 원 안팎으로 접근 가능한 아파트 후보 중, 3년 후 가격 상승 가능성이 높은 곳을 찾는다.

## User Question

3억 원 정도의 투자금으로 지금 접근 가능한 서울 아파트 중, 3년 후 가격이 얼마나 오를 가능성이 있을까?

## Product Question

지도에서 현재 보고 있는 지역 안의 아파트 후보를 기준으로 다음 정보를 보여줄 수 있을까?

- 현재 추정 가격
- 3년 후 예상 가격
- 예상 상승액
- 예상 상승률
- 평당 단가
- 투자금 3억 기준 접근 가능 여부

## ML Objective

아파트 거래 데이터를 바탕으로 특정 시점의 가격을 예측하고, 3년 뒤 가격 변화를 추정한다.

첫 번째 검증 방식은 과거 데이터로 한다.

예:

- 기준 시점: 2014년
- 예측 대상: 2017년 가격
- 검증 방법: 실제 2017년 거래가와 예측값 비교

## Target Redefinition

기존 target:

- `transaction_real_price`

새로운 서비스 관점 target:

- `future_transaction_real_price_3y`
- `expected_growth_amount`
- `expected_growth_rate`

단, 바로 미래값이 있는 데이터셋이 아니므로 거래 데이터를 `apartment_id`, `dong`, `apt`, `exclusive_use_area` 단위로 묶어 3년 뒤 기준 가격을 만드는 실험이 필요하다.

## First Product Benchmark

3억 투자자 기준:

- `transaction_real_price <= 30000`이면 3억 이하 거래로 본다.
- 서울 cleaned 데이터 기준 3억 이하 거래는 약 27.66%다.

## Feature Ideas

기본 가격 예측 변수:

- `exclusive_use_area`
- `floor`
- `building_age`
- `transaction_year_month`
- `dong`
- `apt`

3년 후 상승 가능성 변수:

- 최근 1년 평당 단가 변화
- 최근 3년 평당 단가 변화
- 동별 거래량 변화
- 단지별 과거 상승률
- 전용면적대별 가격 흐름

지도 서비스 변수:

- 위도/경도
- 지도 화면 bounds
- 동/구 단위 집계
- 현재 화면 내 후보 필터링

## Next.js Product Vision

첫 화면:

- 서울 지도
- 지도 위 아파트 후보 마커
- 3억 이하 / 3억 근처 / 3억 초과 필터

마커 클릭 시:

- 아파트명
- 동
- 최근 기준 가격
- 3년 후 예상 가격
- 예상 상승률
- 평당 단가
- 투자 판단 보조 문구

주의:

이 서비스는 투자 추천이 아니라 데이터 기반 학습/분석 도구로 포지셔닝한다.

## Portfolio Angle

포트폴리오 제목 후보:

3억 투자자를 위한 서울 아파트 3년 후 가격 예측 지도 서비스

강조할 역량:

- 대용량 실거래가 데이터 전처리
- 시간 기준 학습/검증 설계
- 회귀 모델링
- 미래 가격 target 설계
- 지도 기반 데이터 시각화
- Next.js 프로토타입 기획
