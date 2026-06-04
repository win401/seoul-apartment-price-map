"use client";

import { useMemo, useState } from "react";
import data from "../data/candidates.json";
import styles from "./page.module.css";

type Candidate = {
  id: number;
  dong: string;
  apt: string;
  areaBucket: number;
  basePriceEok: number;
  predFuturePriceEok: number;
  actualFuturePriceEok: number;
  predGrowthAmountEok: number;
  actualGrowthAmountEok: number;
  predGrowthRate: number;
  actualGrowthRate: number;
  absErrorEok: number;
  baseCount: number;
  futureCount: number;
  grade: "high" | "medium" | "low";
  gradeLabel: string;
  x: number;
  y: number;
};

const candidates = data.items as Candidate[];

function formatEok(value: number) {
  return `${value.toFixed(2)}억`;
}

function formatRate(value: number) {
  return `${value.toFixed(1)}%`;
}

export default function Home() {
  const [selectedId, setSelectedId] = useState(candidates[0]?.id ?? 1);
  const [grade, setGrade] = useState<"all" | "high" | "medium">("all");

  const visibleCandidates = useMemo(() => {
    const filtered =
      grade === "all"
        ? candidates
        : candidates.filter((candidate) => candidate.grade === grade);

    return filtered.sort((a, b) => b.predGrowthRate - a.predGrowthRate);
  }, [grade]);

  const selected =
    visibleCandidates.find((candidate) => candidate.id === selectedId) ??
    visibleCandidates[0] ??
    candidates[0];

  const stats = useMemo(() => {
    const list = visibleCandidates.length ? visibleCandidates : candidates;
    const avgGrowth =
      list.reduce((sum, item) => sum + item.predGrowthRate, 0) / list.length;
    const avgError =
      list.reduce((sum, item) => sum + item.absErrorEok, 0) / list.length;
    const best = list[0];

    return {
      count: list.length,
      avgGrowth,
      avgError,
      best,
    };
  }, [visibleCandidates]);

  return (
    <main className={styles.shell}>
      <section className={styles.topbar}>
        <div>
          <p className={styles.eyebrow}>2014 - 2017 백테스트</p>
          <h1>3억 투자자를 위한 서울 아파트 3년 후 가격 예측</h1>
        </div>
        <div className={styles.modelBadge}>
          <strong>MAE 0.1854억</strong>
          <span>상승/하락 방향 정확도 98.76%</span>
        </div>
      </section>

      <section className={styles.summaryGrid}>
        <article>
          <span>후보 수</span>
          <strong>{stats.count}개</strong>
          <small>3억 이하, 거래 수 필터 통과</small>
        </article>
        <article>
          <span>예측 상승률 평균</span>
          <strong>{formatRate(stats.avgGrowth)}</strong>
          <small>상위 후보 샘플 기준</small>
        </article>
        <article>
          <span>평균 검증 오차</span>
          <strong>{formatEok(stats.avgError)}</strong>
          <small>2017년 실제 가격 비교</small>
        </article>
        <article>
          <span>최상위 후보</span>
          <strong>{stats.best?.dong}</strong>
          <small>{stats.best?.apt}</small>
        </article>
      </section>

      <section className={styles.workspace}>
        <aside className={styles.sidebar}>
          <div className={styles.panelHeader}>
            <div>
              <h2>후보 목록</h2>
              <p>예측 상승률 높은 순</p>
            </div>
            <div className={styles.segmented}>
              <button
                className={grade === "all" ? styles.active : ""}
                onClick={() => setGrade("all")}
              >
                전체
              </button>
              <button
                className={grade === "high" ? styles.active : ""}
                onClick={() => setGrade("high")}
              >
                높음
              </button>
              <button
                className={grade === "medium" ? styles.active : ""}
                onClick={() => setGrade("medium")}
              >
                보통
              </button>
            </div>
          </div>

          <div className={styles.list}>
            {visibleCandidates.slice(0, 28).map((candidate) => (
              <button
                key={candidate.id}
                className={`${styles.listItem} ${
                  selected.id === candidate.id ? styles.selected : ""
                }`}
                onClick={() => setSelectedId(candidate.id)}
              >
                <span>
                  <strong>{candidate.apt}</strong>
                  <small>
                    {candidate.dong} · {candidate.areaBucket}㎡대
                  </small>
                </span>
                <em>{formatRate(candidate.predGrowthRate)}</em>
              </button>
            ))}
          </div>
        </aside>

        <section className={styles.mapPanel}>
          <div className={styles.mapHeader}>
            <div>
              <h2>서울 후보 맵</h2>
              <p>{data.meta.coordinateStatus}</p>
            </div>
            <span>투자금 기준 {data.meta.investmentLimitEok}억</span>
          </div>

          <div className={styles.mapCanvas}>
            <div className={styles.river} />
            <div className={styles.gridLineOne} />
            <div className={styles.gridLineTwo} />
            {visibleCandidates.slice(0, 48).map((candidate) => (
              <button
                key={candidate.id}
                className={`${styles.marker} ${styles[candidate.grade]} ${
                  selected.id === candidate.id ? styles.markerActive : ""
                }`}
                style={{
                  left: `${candidate.x}%`,
                  top: `${candidate.y}%`,
                }}
                title={`${candidate.dong} ${candidate.apt}`}
                onClick={() => setSelectedId(candidate.id)}
              >
                {Math.round(candidate.predGrowthRate)}
              </button>
            ))}
          </div>
        </section>

        <aside className={styles.detail}>
          <div className={styles.detailTitle}>
            <span className={`${styles.gradePill} ${styles[selected.grade]}`}>
              {selected.gradeLabel}
            </span>
            <h2>{selected.apt}</h2>
            <p>
              {selected.dong} · {selected.areaBucket}㎡대
            </p>
          </div>

          <div className={styles.priceFlow}>
            <div>
              <span>2014 기준가</span>
              <strong>{formatEok(selected.basePriceEok)}</strong>
            </div>
            <div>
              <span>2017 예측가</span>
              <strong>{formatEok(selected.predFuturePriceEok)}</strong>
            </div>
            <div>
              <span>2017 실제가</span>
              <strong>{formatEok(selected.actualFuturePriceEok)}</strong>
            </div>
          </div>

          <dl className={styles.metrics}>
            <div>
              <dt>예측 상승률</dt>
              <dd>{formatRate(selected.predGrowthRate)}</dd>
            </div>
            <div>
              <dt>실제 상승률</dt>
              <dd>{formatRate(selected.actualGrowthRate)}</dd>
            </div>
            <div>
              <dt>예측 상승액</dt>
              <dd>{formatEok(selected.predGrowthAmountEok)}</dd>
            </div>
            <div>
              <dt>실제 상승액</dt>
              <dd>{formatEok(selected.actualGrowthAmountEok)}</dd>
            </div>
            <div>
              <dt>절대오차</dt>
              <dd>{formatEok(selected.absErrorEok)}</dd>
            </div>
            <div>
              <dt>거래 신뢰도</dt>
              <dd>
                {selected.baseCount}건 / {selected.futureCount}건
              </dd>
            </div>
          </dl>

          <div className={styles.note}>
            <strong>다음 작업</strong>
            <p>
              현재 마커는 임시 좌표다. 주소 기반 좌표 변환을 붙이면 실제
              Kakao/Naver/Leaflet 지도 위에 같은 데이터를 표시할 수 있다.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
