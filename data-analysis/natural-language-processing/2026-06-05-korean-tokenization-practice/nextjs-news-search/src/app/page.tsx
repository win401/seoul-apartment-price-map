"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type KeywordScore = {
  keyword: string;
  score: number;
};

type SearchResult = {
  id: string;
  title: string;
  category: string;
  description: string;
  link: string;
  pubDate?: string;
  source: "naver-openapi" | "naver-rss" | "sample";
  similarity: number;
  keywords: KeywordScore[];
  tokens: string[];
};

type NewsResponse = {
  query: string;
  generatedAt: string;
  sourceLabel: string;
  results: SearchResult[];
  tokenizedQuery: string[];
  warning?: string;
};

const initialQuery = "인공지능";

function formatScore(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatDate(value?: string) {
  if (!value) return "날짜 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function Home() {
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [data, setData] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/api/news?q=${encodeURIComponent(submittedQuery)}`,
        );
        if (!response.ok) throw new Error(`API ${response.status}`);
        const payload = (await response.json()) as NewsResponse;
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

  const topKeywords = useMemo(() => {
    if (!data) return [];
    const merged = new Map<string, number>();
    for (const result of data.results.slice(0, 8)) {
      for (const keyword of result.keywords) {
        merged.set(
          keyword.keyword,
          (merged.get(keyword.keyword) ?? 0) + keyword.score,
        );
      }
    }
    return Array.from(merged.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [data]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(query);
  }

  return (
    <main className={styles.shell}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Korean TF-IDF News Search</p>
          <h1>네이버 뉴스 TF-IDF 검색 시스템</h1>
          <p>
            Gradio 대신 Next.js로 만든 실습 화면이다. 검색어를 토큰화하고,
            최신 뉴스 기사와의 TF-IDF 코사인 유사도를 계산한다.
          </p>
        </div>
        <form className={styles.searchBox} onSubmit={handleSubmit}>
          <label htmlFor="query">검색어</label>
          <div>
            <input
              id="query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="예: 인공지능, 반도체, 고시원"
            />
            <button type="submit">검색</button>
          </div>
        </form>
      </section>

      <section className={styles.statusGrid}>
        <article>
          <span>데이터 소스</span>
          <strong>{data?.sourceLabel ?? "로딩 중"}</strong>
        </article>
        <article>
          <span>검색어 토큰</span>
          <strong>{data?.tokenizedQuery.join(" / ") || "-"}</strong>
        </article>
        <article>
          <span>뉴스 수</span>
          <strong>{data?.results.length ?? 0}개</strong>
        </article>
      </section>

      {data?.warning ? <p className={styles.warning}>{data.warning}</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}

      <section className={styles.workspace}>
        <aside className={styles.resultsPanel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>검색 결과</h2>
              <p>{loading ? "뉴스를 불러오는 중" : `검색어: ${submittedQuery}`}</p>
            </div>
          </div>

          <div className={styles.resultList}>
            {data?.results.map((result) => (
              <button
                key={result.id}
                className={`${styles.resultItem} ${
                  selected?.id === result.id ? styles.selected : ""
                }`}
                onClick={() => setSelectedId(result.id)}
              >
                <span>
                  <strong>{result.title}</strong>
                  <small>
                    {result.category} · {formatDate(result.pubDate)}
                  </small>
                </span>
                <em>{formatScore(result.similarity)}</em>
              </button>
            ))}
          </div>
        </aside>

        <section className={styles.detailPanel}>
          {selected ? (
            <>
              <div className={styles.articleMeta}>
                <span>{selected.category}</span>
                <span>유사도 {formatScore(selected.similarity)}</span>
              </div>
              <h2>{selected.title}</h2>
              <p className={styles.description}>{selected.description}</p>
              {selected.link.startsWith("#") ? null : (
                <a
                  className={styles.linkButton}
                  href={selected.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  원문 열기
                </a>
              )}

              <div className={styles.keywordBlock}>
                <h3>이 기사 핵심 키워드</h3>
                <div className={styles.keywordList}>
                  {selected.keywords.map((keyword) => (
                    <span key={keyword.keyword}>
                      {keyword.keyword}
                      <small>{keyword.score.toFixed(3)}</small>
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.tokenBlock}>
                <h3>토큰화 결과</h3>
                <p>{selected.tokens.join(" / ")}</p>
              </div>
            </>
          ) : (
            <p className={styles.empty}>검색 결과가 없다.</p>
          )}
        </section>

        <aside className={styles.keywordPanel}>
          <h2>전체 핵심 키워드</h2>
          <div className={styles.keywordCloud}>
            {topKeywords.map(([keyword, score]) => (
              <span key={keyword} style={{ opacity: 0.58 + Math.min(score, 0.5) }}>
                {keyword}
              </span>
            ))}
          </div>

          <div className={styles.note}>
            <strong>실습 포인트</strong>
            <p>
              현재 형태소 분석기는 JS 정규식 기반 간이 토큰화다. Python의 Okt,
              Kkma, MeCab과 비교하면 한국어 조사/어미 분리 품질 차이를 확인할
              수 있다.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
