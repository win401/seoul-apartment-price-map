"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type Recommendation = {
  id: string;
  name: string;
  category: string;
  description: string;
  score: number;
  tfidfScore: number;
  intentScore: number;
  matchedIntents: string[];
  keywords: string[];
};

type RecommendationResponse = {
  query: string;
  generatedAt: string;
  totalMenus: number;
  tokenizedQuery: string[];
  expandedQuery: string[];
  results: Recommendation[];
};

const examples = [
  "해장 잘되는 음식",
  "칼칼한 국물 음식",
  "다이어트에 좋은 음식",
  "고소하고 부드러운 음식",
  "든든한 고기 메뉴",
  "상큼하고 가벼운 음식",
];

function formatScore(value: number) {
  return `${Math.round(value * 100)}점`;
}

export default function Home() {
  const [query, setQuery] = useState(examples[0]);
  const [submittedQuery, setSubmittedQuery] = useState(examples[0]);
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/api/recommend?q=${encodeURIComponent(submittedQuery)}`,
        );
        if (!response.ok) throw new Error(`API ${response.status}`);
        const payload = (await response.json()) as RecommendationResponse;
        if (!ignore) {
          setData(payload);
          setSelectedId(payload.results[0]?.id ?? null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [submittedQuery]);

  const selected = useMemo(() => {
    if (!data) return null;
    return (
      data.results.find((result) => result.id === selectedId) ??
      data.results[0] ??
      null
    );
  }, [data, selectedId]);

  const visibleExpandedTokens = useMemo(() => {
    if (!data) return [];
    return data.expandedQuery.filter(
      (token) => !data.tokenizedQuery.includes(token),
    );
  }, [data]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(query);
  }

  function runExample(example: string) {
    setQuery(example);
    setSubmittedQuery(example);
  }

  return (
    <main className={styles.shell}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Korean TF-IDF Menu Recommender</p>
          <h1>상황 문장으로 찾는 음식 메뉴 추천</h1>
          <p>
            CSV 메뉴 데이터를 읽고, 사용자의 자연어 입력을 토큰화한 뒤 TF-IDF와
            간단한 의도 보정 점수로 메뉴를 추천하는 실습 앱입니다.
          </p>
        </div>

        <form className={styles.searchBox} onSubmit={handleSubmit}>
          <label htmlFor="query">먹고 싶은 느낌</label>
          <div>
            <input
              id="query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="예: 해장 잘되는 음식, 칼칼한 음식, 다이어트에 좋은 음식"
            />
            <button type="submit">추천</button>
          </div>
        </form>
      </section>

      <section className={styles.exampleBar} aria-label="예시 검색어">
        {examples.map((example) => (
          <button key={example} onClick={() => runExample(example)}>
            {example}
          </button>
        ))}
      </section>

      <section className={styles.statusGrid}>
        <article>
          <span>메뉴 데이터</span>
          <strong>{data?.totalMenus ?? 0}개</strong>
        </article>
        <article>
          <span>입력 토큰</span>
          <strong>{data?.tokenizedQuery.join(" / ") || "-"}</strong>
        </article>
        <article>
          <span>의도 확장</span>
          <strong>{visibleExpandedTokens.join(" / ") || "-"}</strong>
        </article>
      </section>

      {error ? <p className={styles.error}>{error}</p> : null}

      <section className={styles.workspace}>
        <aside className={styles.resultPanel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>추천 결과</h2>
              <p>{loading ? "메뉴를 고르는 중" : `입력: ${submittedQuery}`}</p>
            </div>
          </div>

          <div className={styles.resultList}>
            {data?.results.map((result, index) => (
              <button
                key={result.id}
                className={`${styles.resultItem} ${
                  selected?.id === result.id ? styles.selected : ""
                }`}
                onClick={() => setSelectedId(result.id)}
              >
                <span className={styles.rank}>{index + 1}</span>
                <span>
                  <strong>{result.name}</strong>
                  <small>
                    {result.category} · {result.matchedIntents.join(", ") || "TF-IDF"}
                  </small>
                </span>
                <em>{formatScore(result.score)}</em>
              </button>
            ))}
          </div>
        </aside>

        <section className={styles.detailPanel}>
          {selected ? (
            <>
              <div className={styles.categoryRow}>
                <span>{selected.category}</span>
                <span>종합 {formatScore(selected.score)}</span>
              </div>
              <h2>{selected.name}</h2>
              <p className={styles.description}>{selected.description}</p>

              <div className={styles.scoreGrid}>
                <article>
                  <span>TF-IDF</span>
                  <strong>{formatScore(selected.tfidfScore)}</strong>
                </article>
                <article>
                  <span>의도 보정</span>
                  <strong>{formatScore(selected.intentScore)}</strong>
                </article>
              </div>

              <div className={styles.keywordBlock}>
                <h3>메뉴 키워드</h3>
                <div className={styles.keywordList}>
                  {selected.keywords.map((keyword) => (
                    <span key={keyword}>{keyword}</span>
                  ))}
                </div>
              </div>

              <div className={styles.note}>
                <strong>추천 이유</strong>
                <p>
                  입력 문장의 토큰과 메뉴 설명의 TF-IDF 유사도를 먼저 계산하고,
                  해장/칼칼함/다이어트 같은 표현은 관련 키워드로 확장해 약간의
                  보정 점수를 더했습니다.
                </p>
              </div>
            </>
          ) : (
            <p className={styles.empty}>추천 결과가 없습니다.</p>
          )}
        </section>
      </section>
    </main>
  );
}
