"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import styles from "./page.module.css";

type SimilarReview = {
  id: string;
  text: string;
  label: string;
  score: number;
  matchedTokens: string[];
};

type FewShotExample = {
  label: string;
  review: string;
  analysis: string;
};

type Recommendation = {
  provider: string;
  title?: string;
  reason?: string;
  confidence?: number;
  tags?: string[];
  raw?: string;
  movieInfo?: {
    source: string;
    matched: boolean;
    posterUrl: string;
    overview: string;
    releaseDate: string;
    tmdbUrl: string;
    matchedTitle: string;
  };
};

type PreferenceProfile = {
  mood: string;
  genre: string;
  ending: string;
  avoid: string;
};

type RecommendResponse = {
  query: string;
  generatedAt: string;
  indexedReviews: number;
  status: "ok" | "out_of_domain";
  isMovieRequest: boolean;
  message: string;
  preferenceProfile: PreferenceProfile;
  searchQuery: string;
  intents: string[];
  similarReviews: SimilarReview[];
  fewShotExamples: FewShotExample[];
  prompt: string;
  recommendation: Recommendation;
  fallbackRecommendation: Recommendation;
};

const API_BASE =
  process.env.NEXT_PUBLIC_MOVIE_API_BASE ?? "http://127.0.0.1:8013";

const examples = [
  "로맨틱한 영화가 좋아요. 감정적으로 감동하는 느낌을 원해요.",
  "가볍게 웃으면서 볼 수 있는 코미디 영화 추천해줘.",
  "긴장감 있고 어두운 스릴러 영화가 보고 싶어요.",
  "가족이랑 같이 볼 수 있는 따뜻한 영화가 좋아요.",
  "화려하고 속도감 있는 액션 영화를 보고 싶어요.",
  "맛집 추천해줘.",
];

const preferenceQuestions: Array<{
  key: keyof PreferenceProfile;
  label: string;
  options: string[];
}> = [
  {
    key: "mood",
    label: "어떤 감정으로 보고 싶나요?",
    options: ["따뜻한 감동", "눈물 나는 여운", "가볍고 유쾌함", "긴장감"],
  },
  {
    key: "genre",
    label: "끌리는 장르나 소재는요?",
    options: ["로맨스/성장", "가족/힐링", "코미디", "스릴러/범죄"],
  },
  {
    key: "ending",
    label: "결말 취향은 어떤가요?",
    options: ["해피엔딩", "여운 남는 결말", "반전 있는 결말", "상관없음"],
  },
  {
    key: "avoid",
    label: "피하고 싶은 요소가 있나요?",
    options: ["잔인함", "너무 우울함", "느린 전개", "없음"],
  },
];

const defaultProfile: PreferenceProfile = {
  mood: "따뜻한 감동",
  genre: "로맨스/성장",
  ending: "여운 남는 결말",
  avoid: "잔인함",
};

function formatPercent(value?: number) {
  if (typeof value !== "number") return "확인 필요";
  return `${Math.round(value * 100)}%`;
}

function formatAccuracy(value?: number) {
  if (typeof value !== "number") return "추천 정확도: 확인 필요";
  const level = value >= 0.85 ? "높음" : value >= 0.65 ? "보통" : "낮음";
  return `추천 정확도: ${value.toFixed(2)}(${level})`;
}

export default function Home() {
  const [query, setQuery] = useState(examples[0]);
  const [profile, setProfile] = useState<PreferenceProfile>(defaultProfile);
  const [data, setData] = useState<RecommendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event?: FormEvent, useDeepProfile = true) {
    event?.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          top_k: 5,
          preference_profile: useDeepProfile ? profile : null,
        }),
      });
      if (!response.ok) throw new Error(`API ${response.status}`);
      const payload = (await response.json()) as RecommendResponse;
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const result = data?.recommendation;
  const fallback = data?.fallbackRecommendation;
  const displayTitle = result?.title ?? fallback?.title ?? "추천 준비 중";
  const displayReason =
    result?.reason ?? result?.raw ?? fallback?.reason ?? "결과가 없습니다.";
  const promptPreview = useMemo(() => data?.prompt ?? "", [data]);

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Few-shot + Review Retrieval</p>
          <h1>영화 추천 챗봇 실습</h1>
          <p className={styles.subtitle}>
            사용자 취향 문장을 유사 리뷰와 few-shot 예제로 확장해 추천
            프롬프트를 구성합니다.
          </p>
        </div>
        <div className={styles.metric}>
          <span>Indexed reviews</span>
          <strong>{data?.indexedReviews.toLocaleString() ?? "-"}</strong>
        </div>
      </section>

      <section className={styles.workspace}>
        <form
          className={styles.queryPanel}
          onSubmit={(event) => submit(event, true)}
        >
          <label htmlFor="query">사용자 요청</label>
          <textarea
            id="query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="예: 로맨틱하고 감동적인 영화가 보고 싶어요"
          />
          <div className={styles.exampleGrid}>
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setQuery(example)}
                className={styles.exampleButton}
              >
                {example}
              </button>
            ))}
          </div>
          <section className={styles.deepPanel}>
            <div className={styles.deepHeader}>
              <span>심층 질문</span>
              <small>답변을 추천 프롬프트와 리뷰 검색에 함께 반영합니다.</small>
            </div>
            <div className={styles.questionGrid}>
              {preferenceQuestions.map((question) => (
                <div key={question.key} className={styles.questionCard}>
                  <p>{question.label}</p>
                  <div>
                    {question.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={
                          profile[question.key] === option
                            ? styles.optionActive
                            : styles.optionButton
                        }
                        onClick={() =>
                          setProfile((current) => ({
                            ...current,
                            [question.key]: option,
                          }))
                        }
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
          <div className={styles.actionRow}>
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={loading}
              onClick={() => submit(undefined, false)}
            >
              간단 추천
            </button>
            <button className={styles.submitButton} disabled={loading}>
              {loading ? "추천 생성 중..." : "심층 추천 실행"}
            </button>
          </div>
          {error ? <p className={styles.error}>Backend error: {error}</p> : null}
        </form>

        <section className={styles.resultPanel}>
          <p className={styles.panelLabel}>추천 결과</p>
          <div className={styles.resultHero}>
            <div className={styles.posterFrame}>
              {result?.movieInfo?.posterUrl ? (
                <Image
                  src={result.movieInfo.posterUrl}
                  alt={`${displayTitle} 포스터`}
                  width={224}
                  height={336}
                />
              ) : (
                <span>Poster</span>
              )}
            </div>
            <div>
              <h2>{displayTitle}</h2>
              {result?.movieInfo?.matched ? (
                <div className={styles.movieMeta}>
                  <span>{result.movieInfo.matchedTitle}</span>
                  {result.movieInfo.releaseDate ? (
                    <span>{result.movieInfo.releaseDate}</span>
                  ) : null}
                </div>
              ) : (
                <div className={styles.movieMeta}>
                  <span>포스터 정보 없음</span>
                </div>
              )}
            </div>
          </div>
          {data?.status === "out_of_domain" ? (
            <div className={styles.guardNotice}>{data.message}</div>
          ) : null}
          <p>{displayReason}</p>
          {result?.movieInfo?.overview ? (
            <p className={styles.overview}>{result.movieInfo.overview}</p>
          ) : null}
          {result?.movieInfo?.tmdbUrl ? (
            <a
              className={styles.tmdbLink}
              href={result.movieInfo.tmdbUrl}
              target="_blank"
              rel="noreferrer"
            >
              TMDb에서 보기
            </a>
          ) : null}
          <div className={styles.chips}>
            {(data?.intents ?? ["대기"]).map((intent) => (
              <span key={intent}>{intent}</span>
            ))}
          </div>
          <div className={styles.accuracyBox}>
            {formatAccuracy(result?.confidence)}
          </div>
          <div className={styles.resultMeta}>
            <span>Provider: {result?.provider ?? "none"}</span>
            <span>Confidence: {formatPercent(result?.confidence)}</span>
          </div>
          {data?.status === "ok" ? (
            <div className={styles.profileSummary}>
              <strong>반영된 취향 프로필</strong>
              <dl>
                <div>
                  <dt>감정</dt>
                  <dd>{data.preferenceProfile.mood || "없음"}</dd>
                </div>
                <div>
                  <dt>장르/소재</dt>
                  <dd>{data.preferenceProfile.genre || "없음"}</dd>
                </div>
                <div>
                  <dt>결말</dt>
                  <dd>{data.preferenceProfile.ending || "없음"}</dd>
                </div>
                <div>
                  <dt>회피 요소</dt>
                  <dd>{data.preferenceProfile.avoid || "없음"}</dd>
                </div>
              </dl>
              <small>검색 쿼리: {data.searchQuery}</small>
            </div>
          ) : null}
        </section>
      </section>

      <section className={styles.columns}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <p className={styles.panelLabel}>STEP 2</p>
            <h3>유사 리뷰 검색</h3>
          </div>
          <div className={styles.reviewList}>
            {(data?.similarReviews ?? []).map((review, index) => (
              <article key={review.id} className={styles.reviewCard}>
                <div>
                  <strong>{index + 1}. {review.label}</strong>
                  <span>{Math.round(review.score * 100)}점</span>
                </div>
                <p>{review.text}</p>
                <small>
                  Matched: {review.matchedTokens.join(", ") || "없음"}
                </small>
              </article>
            ))}
            {!data ? <p className={styles.empty}>추천을 실행하면 유사 리뷰가 표시됩니다.</p> : null}
            {data?.status === "out_of_domain" ? (
              <p className={styles.empty}>영화 요청이 아니므로 리뷰 검색을 실행하지 않았습니다.</p>
            ) : null}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <p className={styles.panelLabel}>STEP 3</p>
            <h3>Few-shot 예제</h3>
          </div>
          <div className={styles.shotList}>
            {(data?.fewShotExamples ?? []).map((example) => (
              <article key={example.label} className={styles.shotCard}>
                <strong>{example.label}</strong>
                <p>{`"${example.review}"`}</p>
                <small>{example.analysis}</small>
              </article>
            ))}
            {!data ? <p className={styles.empty}>추천 실행 후 예제가 표시됩니다.</p> : null}
            {data?.status === "out_of_domain" ? (
              <p className={styles.empty}>영화 요청이 들어오면 few-shot 예제가 표시됩니다.</p>
            ) : null}
          </div>
        </section>
      </section>

      <section className={styles.promptPanel}>
        <div className={styles.panelHeader}>
          <p className={styles.panelLabel}>STEP 4</p>
          <h3>최종 프롬프트</h3>
        </div>
        <pre>
          {promptPreview ||
            (data?.status === "out_of_domain"
              ? "영화 요청이 아니므로 GPT 추천 프롬프트를 생성하지 않았습니다."
              : "추천을 실행하면 GPT에 전달할 프롬프트가 표시됩니다.")}
        </pre>
      </section>
    </main>
  );
}
