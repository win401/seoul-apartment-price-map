# Agent Instructions

이 저장소는 광주 인공지능 사관학교 수업 실습을 AI 서비스 프로토타입과 포트폴리오로 발전시키는 공간이다.

## Default Workflow

새 수업 실습은 `Python-first, Next.js-frontend` 원칙으로 진행한다.

자세한 기준은 `docs/practice-workflow.md`를 따른다.

## Implementation Rules

- 수업 예제 코드가 Python이면 Jupyter Notebook을 먼저 만든다.
- 핵심 데이터 처리, ML/NLP, 추천/예측 로직은 Python에 둔다.
- 웹 화면은 Next.js로 만든다.
- Python API 서버는 FastAPI를 기본으로 한다.
- Next.js는 Python API를 호출해 결과를 보여준다.
- README를 반드시 함께 업데이트한다.
- Git 커밋에는 관련 실습 파일만 포함한다.

## Avoid

- 수업 핵심 로직을 Python 없이 TypeScript만으로 대체하지 않는다.
- `node_modules`, `.next`, `.venv`, 개인 `.env` 파일을 커밋하지 않는다.
- 사용자가 만든 기존 노트북 변경을 임의로 되돌리지 않는다.

## Existing Exception

아래 앱은 이미 TypeScript 기반으로 구현된 기존 실습이다.

- `data-analysis/natural-language-processing/2026-06-05-korean-tokenization-practice/nextjs-news-search`
- `data-analysis/natural-language-processing/2026-06-05-korean-tokenization-practice/nextjs-menu-recommender`

이후 새 실습부터는 FastAPI backend와 Next.js frontend를 분리한다.
