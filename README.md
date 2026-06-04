# Class Portfolio Lab

광주 인공지능 사관학교 수업 자료, 실습, 과제를 관리하면서 포트폴리오와 사업 아이디어로 확장하는 저장소입니다.

이 저장소는 단순 수업 백업용이 아니라, 수업에서 만든 결과물을 실제 서비스 프로토타입과 취업 포트폴리오로 발전시키는 것을 목표로 합니다.

## Featured Project

### Seoul Apartment Price Map

3억 투자금을 가진 초보 부동산 투자자를 페르소나로 설정하고, 서울 아파트 실거래 데이터를 분석해 3년 후 가격을 예측한 뒤 지도 서비스로 시각화한 프로젝트입니다.

- Live Demo: https://nextjs-map-prototype.vercel.app
- Project Path: `data-analysis/machine-learning/2026-06-04-ml-practice/`
- Web App: `data-analysis/machine-learning/2026-06-04-ml-practice/nextjs-map-prototype/`

핵심 작업:

- 서울 아파트 실거래 데이터 EDA
- 거래가/평당 단가 단위 정리
- 이상치 탐지 및 기준 정리
- 2014년 기준 3억 이하 후보 추출
- 2017년 실제 가격과 비교하는 3년 후 예측 백테스트
- 예측 결과를 Next.js + Leaflet 지도 서비스로 구현
- GitHub + Vercel 배포

## Repository Structure

```text
data-analysis/
  machine-learning/
    2026-06-04-ml-practice/
      notebooks/              # Jupyter 실습 노트북
      reports/                # 분석 결과 리포트
      outputs/                # 시각화 이미지
      notes/                  # 수업 요약 노트
      nextjs-map-prototype/   # 배포된 지도 서비스
ai-service-planning/          # AI 서비스 기획 수업 자료
assignments/                  # 과제 제출물
notes/                        # 공통 수업 노트
portfolio-candidates/         # 포트폴리오 후보
```

## Operating Rule

수업 프로젝트는 처음에는 `class` 저장소에서 관리합니다.

결과물이 쓸만해지면 아래 중 하나로 승격합니다.

- 취업 포트폴리오 후보
- 사업 아이디어 후보
- 기존 프로젝트와 연결되는 실험 자산

현재 연결 가능한 프로젝트:

- `business-idea-lab`: 사업 아이디어/전략 정리
- `Kmong_project`: 첫 수익화를 위한 랜딩페이지 제작 포트폴리오
- `roomy_project`: 고시원 SaaS 검증
- `job_simulator_pj`: 취업/교육용 AI 서비스 자산

## Portfolio Direction

이 저장소는 다음 직무 포지션을 보여주기 위한 근거 자료로 발전시킵니다.

- AI 서비스 기획자
- 주니어 PM
- 데이터 기반 서비스 기획
- 프로토타입 빌더
- 프론트엔드/풀스택 지향 주니어 개발자
