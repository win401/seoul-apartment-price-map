'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from './page.module.css';

type ArticleModelEvaluation = {
  provider: string;
  model_name: string;
  available: boolean;
  translated_text: string;
  bleu_score: number;
  bleu_interpretation: string;
  source_length: number;
  translated_length: number;
  error: string;
};

type ArticleEvaluationResponse = {
  source_language: string;
  target_language: string;
  source_text: string;
  reference_text: string;
  reference_provider: string;
  winner: string;
  results: Record<string, ArticleModelEvaluation>;
};

const DEFAULT_SOURCE_TEXT =
  'Artificial intelligence is changing how people communicate across languages. Researchers say translation tools are becoming faster and more accessible.';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

export default function EvaluationPage() {
  const [sourceText, setSourceText] = useState(DEFAULT_SOURCE_TEXT);
  const [referenceText, setReferenceText] = useState('');
  const [result, setResult] = useState<ArticleEvaluationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleRunEvaluation() {
    setIsLoading(true);
    setErrorMessage('');
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/evaluation/article`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_text: sourceText,
          reference_text: referenceText,
          source_language: 'en',
          target_language: 'ko',
        }),
      });

      if (!response.ok) {
        throw new Error('Article evaluation request failed');
      }

      const data = (await response.json()) as ArticleEvaluationResponse;
      setResult(data);
    } catch (error) {
      console.error(error);
      setErrorMessage('백엔드 평가 API에 연결할 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <p className={styles.eyebrow}>Papago Reference Evaluation</p>
        <h1>뉴스 기사 번역 품질 비교</h1>
        <Link href="/">번역기로 돌아가기</Link>
      </section>

      <section className={styles.inputGrid}>
        <label>
          영어 기사 원문
          <textarea
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
            placeholder="영어 뉴스 기사 원문을 붙여넣으세요."
          />
        </label>

        <label>
          파파고 기준 번역문
          <textarea
            value={referenceText}
            onChange={(event) => setReferenceText(event.target.value)}
            placeholder="같은 원문을 파파고로 번역한 한국어 결과를 붙여넣으세요."
          />
        </label>
      </section>

      <section className={styles.summary}>
        <div>
          <span>평가 기준</span>
          <strong>파파고</strong>
        </div>
        <div>
          <span>원문 길이</span>
          <strong>{sourceText.length}</strong>
        </div>
        <div>
          <span>비교 모델</span>
          <strong>NLLB / OpenAI</strong>
        </div>
        <div>
          <span>우수 모델</span>
          <strong className={result?.winner ? styles.pass : styles.pending}>
            {result?.winner ? result.winner.toUpperCase() : '테스트 전'}
          </strong>
        </div>
      </section>

      <div className={styles.actions}>
        <button
          type="button"
          onClick={handleRunEvaluation}
          disabled={isLoading || !sourceText.trim() || !referenceText.trim()}
        >
          {isLoading ? '비교 평가 중...' : '비교 평가 실행'}
        </button>
        {errorMessage ? <p>{errorMessage}</p> : null}
      </div>

      {result ? (
        <section className={styles.resultGrid}>
          {Object.values(result.results).map((item) => (
            <article key={item.provider} className={styles.resultCard}>
              <div className={styles.cardHeader}>
                <div>
                  <span>{item.provider.toUpperCase()}</span>
                  <h2>{item.model_name}</h2>
                </div>
                <strong>{item.available ? item.bleu_score.toFixed(2) : '-'}</strong>
              </div>

              {item.error ? (
                <p className={styles.error}>{item.error}</p>
              ) : (
                <>
                  <div className={styles.metricLine}>
                    <span>BLEU 해석</span>
                    <strong>{item.bleu_interpretation}</strong>
                  </div>
                  <div className={styles.metricLine}>
                    <span>번역 길이</span>
                    <strong>{item.translated_length}</strong>
                  </div>
                  <p className={styles.translation}>{item.translated_text}</p>
                </>
              )}
            </article>
          ))}
        </section>
      ) : (
        <section className={styles.empty}>
          영어 기사와 파파고 기준 번역문을 넣고 비교 평가를 실행하세요.
        </section>
      )}
    </main>
  );
}
