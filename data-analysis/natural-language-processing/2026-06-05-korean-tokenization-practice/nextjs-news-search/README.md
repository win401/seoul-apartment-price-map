# Next.js News Search

한글 TF-IDF 뉴스 검색 시스템을 Gradio 대신 Next.js로 구현한 실습 앱입니다.

## Goal

네이버 뉴스 검색 결과를 불러온 뒤 검색어와 각 뉴스 기사 사이의 TF-IDF 코사인 유사도를 계산해 브라우저에서 확인합니다.

## Data Source Priority

1. `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`이 있으면 Naver Search Open API 사용
2. 키가 없으면 RSS 시도: Naver News RSS → Google News RSS
3. 네트워크/도메인 호출 실패 시 샘플 기사로 fallback

화면에서 뉴스 소스를 직접 선택할 수도 있습니다.

| Mode | Meaning |
|---|---|
| 자동 | Open API 우선, 실패 시 RSS |
| Open API | Naver Search Open API만 사용 |
| RSS | Naver/Google News RSS XML을 파싱 |

## Run

```bash
npm install
npm run dev -- --port 3011
```

Open:

```text
http://localhost:3011
```

## Optional Naver API

`.env.local.example`을 복사해 `.env.local`을 만들고 값을 입력합니다.

```bash
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret
```

## Practice Points

- 한국어 간이 토큰화
- TF-IDF 벡터 생성
- 코사인 유사도 계산
- 뉴스 검색 결과 ranking
- Open API와 RSS 데이터 소스 비교
- Gradio UI를 Next.js UI로 전환
