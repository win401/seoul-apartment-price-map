# Seoul Apartment Price Map Prototype

3억 투자자를 위한 서울 아파트 3년 후 가격 예측 지도 프로토타입.

## Purpose

머신러닝 실습 결과를 사용자가 볼 수 있는 서비스 화면으로 확장한다.

현재는 실제 지도 API 연동 전 단계이며, 예측 후보를 임시 좌표 기반 지도형 UI에 표시한다.

## Data

앱 데이터:

```text
src/data/candidates.json
```

생성 원본:

```text
../data/processed/map_export_predicted_top_growth_2014_2017.csv
```

현재 데이터는 2014년 기준 3억 이하 후보의 2017년 예측/실제 가격 비교 결과를 포함한다.

## Current Features

- 후보 목록
- 예측 상승률 필터
- 임시 좌표 기반 지도형 마커
- Kakao Local API 기반 실제 좌표 변환 스크립트
- 후보 상세 패널
- 2014 기준가, 2017 예측가, 2017 실제가 비교
- 예측 상승률, 실제 상승률, 절대오차 표시

## Run

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Build

```bash
npm run build
```

## Geocoding

1. Kakao Developers에서 REST API 키를 준비한다.
2. `.env.local.example`을 참고해 `.env.local`을 만든다.
3. 아래 명령을 실행한다.

```bash
KAKAO_REST_API_KEY=your_key npm run geocode:kakao
```

성공하면 `src/data/candidates.json`의 각 후보에 `lat`, `lng`, `resolvedAddress`가 추가되고, 화면 마커 배치도 실제 좌표 범위 기준으로 다시 계산된다.

## Next Step

- 주소 기반 좌표 변환
- Kakao Maps, Naver Maps, or Leaflet 연동
- 지도 bounds 기준 후보 필터링
- 구/동 단위 상승률 레이어 추가

## Caveat

이 앱은 실제 투자 추천 서비스가 아니라 교육용/포트폴리오용 데이터 분석 프로토타입이다.
