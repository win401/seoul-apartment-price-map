# 2026-06-05 Korean Tokenization Practice

## Class Context

- 수업 주제: 한글 토큰화, 형태소 분석, 서브워드 토큰화
- 강의 자료: `/Users/sungwoo/Downloads/6.5/한글_형태소_토큰.pdf`
- 사용 도구: Python, Jupyter Notebook
- 실습 방향: 한국어 문장을 여러 방식으로 토큰화하고 결과를 비교한다.

## Goal

오늘 실습의 목표는 한국어 자연어 처리에서 토큰화 방식이 결과에 어떤 차이를 만드는지 확인하는 것이다.

핵심 질문:

- 공백 기반 토큰화는 한국어에서 어떤 한계가 있는가?
- 형태소 분석기는 문장을 어떻게 다르게 나누는가?
- 조사/어미/복합명사/신조어가 토큰화 결과에 어떤 영향을 주는가?
- TF-IDF나 문장 유사도 실습에 형태소 분석 결과를 어떻게 연결할 수 있는가?

## Practice Flow

1. 예제 문장 준비
2. 공백 기반 토큰화
3. 정규식 기반 한글/숫자/영문 추출
4. Okt 형태소 분석 실습
5. Kkma 형태소 분석 실습
6. 결과 비교표 만들기
7. 형태소 기반 명사 추출
8. TF-IDF 입력에 형태소 분석 결과 적용
9. 코사인 유사도로 간단한 FAQ 유사도 비교
10. 고시원 SaaS / 크몽 프로젝트 적용 아이디어 정리
11. Gradio 실습 노트북을 Next.js 뉴스 검색 화면으로 전환

## Files

```text
notebooks/
  01_korean_tokenization_practice.ipynb
  02_korean_tfidf_news_search_original.ipynb

notes/
  2026-06-05-korean-tokenization-summary.md

nextjs-news-search/
  src/app/api/news/route.ts
  src/app/lib/newsSearch.ts
  src/app/page.tsx

reports/
  .gitkeep

outputs/
  .gitkeep

data/
  raw/.gitkeep
  processed/.gitkeep
```

## Suggested Test Sentences

```text
학교에서 자연어처리를 공부하였습니다.
고시원 단기 입실 가능한 방 있나요?
미용실 예약 페이지가 필요해요.
ㅋㅋㅋㅋ 이 서비스 진짜 편하네요!
3개월 계약 가능한가요? 보증금은 30만원입니다.
```

## Portfolio Connection

이 실습은 단순 NLP 이론이 아니라 실제 서비스 기능과 연결할 수 있다.

- Roomy Project: 고시원 문의 자동 분류, FAQ 추천
- Kmong Project: 고객 요청 키워드 추출, 포트폴리오 샘플 추천
- Business Idea Lab: AI Wiki 문서 검색 품질 개선

## Next Action

Jupyter에서 `notebooks/01_korean_tokenization_practice.ipynb`를 열고 셀을 순서대로 실행한다.

Next.js 뉴스 검색 앱을 실행하려면:

```bash
cd nextjs-news-search
npm install
npm run dev -- --port 3011
```

로컬 URL:

```text
http://localhost:3011
```

네이버 실시간 뉴스 연동은 `.env.local`에 아래 값을 넣으면 Naver Search Open API를 우선 사용한다.

```bash
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret
```

키가 없거나 네트워크 호출이 실패하면 샘플 기사로 fallback하여 TF-IDF 검색 UI는 계속 동작한다.
