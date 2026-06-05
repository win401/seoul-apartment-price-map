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
  foodInfo: {
    calories: number;
    servingSize: string;
    difficulty: string;
    cookingTime: string;
    recipeSteps: string[];
    nutritionNotes: string[];
  };
};

type RecommendationResponse = {
  query: string;
  generatedAt: string;
  totalMenus: number;
  tokenizedQuery: string[];
  expandedQuery: string[];
  results: Recommendation[];
};

// Image upload is paused for now.
// type ImageAnalysis = {
//   provider: string;
//   detectedName: string;
//   confidence: number;
//   visualKeywords: string[];
//   query: string;
//   note: string;
// };
//
// type ImageRecommendationResponse = {
//   analysis: ImageAnalysis;
//   recommendation: RecommendationResponse;
// };

const examples = [
  "해장 잘되는 음식",
  "칼칼한 국물 음식",
  "다이어트에 좋은 음식",
  "고소하고 부드러운 음식",
  "든든한 고기 메뉴",
  "상큼하고 가벼운 음식",
];

const API_BASE =
  process.env.NEXT_PUBLIC_MENU_API_BASE ?? "http://127.0.0.1:8000";

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
  // Image upload is paused for now.
  // const [imageLoading, setImageLoading] = useState(false);
  // const [imageError, setImageError] = useState("");
  // const [imagePreview, setImagePreview] = useState("");
  // const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysis | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_BASE}/recommend/text`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: submittedQuery }),
        });
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

  // Image upload is paused for now.
  // async function handleImageUpload(event: FormEvent<HTMLFormElement>) {
  //   event.preventDefault();
  //   const form = event.currentTarget;
  //   const input = form.elements.namedItem("foodImage") as HTMLInputElement;
  //   const file = input.files?.[0];
  //   if (!file) return;
  //   setImageLoading(true);
  //   setImageError("");
  //   setImageAnalysis(null);
  //   setImagePreview(URL.createObjectURL(file));
  //   try {
  //     const formData = new FormData();
  //     formData.append("file", file);
  //     const response = await fetch(`${API_BASE}/recommend/image`, {
  //       method: "POST",
  //       body: formData,
  //     });
  //     if (!response.ok) throw new Error(`API ${response.status}`);
  //     const payload = (await response.json()) as ImageRecommendationResponse;
  //     setImageAnalysis(payload.analysis);
  //     setData(payload.recommendation);
  //     setSubmittedQuery(payload.analysis.query);
  //     setQuery(payload.analysis.query);
  //     setSelectedId(payload.recommendation.results[0]?.id ?? null);
  //   } catch (err) {
  //     setImageError(err instanceof Error ? err.message : String(err));
  //   } finally {
  //     setImageLoading(false);
  //   }
  // }

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

      {/* Image upload is paused for now.
      <section className={styles.imageSection}>...</section>
      */}

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
                <article>
                  <span>예상 칼로리</span>
                  <strong>{selected.foodInfo.calories}kcal</strong>
                </article>
                <article>
                  <span>조리 난이도</span>
                  <strong>{selected.foodInfo.difficulty}</strong>
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

              <div className={styles.foodInfoGrid}>
                <article>
                  <h3>기본 정보</h3>
                  <dl>
                    <div>
                      <dt>1회 제공량</dt>
                      <dd>{selected.foodInfo.servingSize}</dd>
                    </div>
                    <div>
                      <dt>조리 시간</dt>
                      <dd>{selected.foodInfo.cookingTime}</dd>
                    </div>
                  </dl>
                </article>
                <article>
                  <h3>영양 포인트</h3>
                  <ul>
                    {selected.foodInfo.nutritionNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </article>
              </div>

              <div className={styles.recipeBlock}>
                <h3>간단 레시피</h3>
                <ol>
                  {selected.foodInfo.recipeSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <p>칼로리는 실습용 추정값이며 실제 재료와 양에 따라 달라집니다.</p>
              </div>

              <div className={styles.note}>
                <strong>추천 이유</strong>
                <p>
                  입력 문장 또는 이미지 분석 결과를 Python FastAPI로 보내고,
                  메뉴 설명의 TF-IDF 유사도와 의도 키워드 보정 점수를 함께
                  계산했습니다.
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
