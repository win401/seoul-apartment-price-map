'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from './page.module.css';

const domains = [
  { code: 'general', name: '일반' },
  { code: 'legal', name: '법률' },
  { code: 'finance', name: '금융' },
  { code: 'fashion', name: '의류/쇼핑' },
];

const tasks = [
  { code: 'translate', name: '번역' },
  { code: 'explain', name: '쉬운 설명' },
  { code: 'summarize', name: '요약' },
  { code: 'terms', name: '용어 풀이' },
];

type DomainResult = {
  domain: string;
  task: string;
  source_language: string;
  target_language: string;
  source_text: string;
  result_text: string;
  model_name: string;
  provider: string;
  disclaimer: string;
  error: string;
  legal_analysis?: {
    model_name: string;
    token_count: number;
    legal_similarity_score: number;
    matched_terms: string[];
    note: string;
  } | null;
};

export default function DomainPage() {
  const [domain, setDomain] = useState('legal');
  const [task, setTask] = useState('explain');
  const [sourceText, setSourceText] = useState(
    'This agreement shall be governed by and construed in accordance with the laws of the Republic of Korea.',
  );
  const [result, setResult] = useState<DomainResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleProcess() {
    setIsLoading(true);
    setErrorMessage('');
    setResult(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/domain/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain,
          task,
          source_text: sourceText,
          source_language: 'en',
          target_language: 'ko',
        }),
      });

      if (!response.ok) {
        throw new Error('Domain request failed');
      }

      const data = (await response.json()) as DomainResult;
      setResult(data);
    } catch (error) {
      console.error(error);
      setErrorMessage('백엔드 도메인 API에 연결할 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <p className={styles.eyebrow}>Domain-Aware NLP Lab</p>
        <h1>도메인 특화 번역/설명</h1>
        <Link href="/">번역기로 돌아가기</Link>
      </section>

      <section className={styles.controls}>
        <label>
          도메인
          <select value={domain} onChange={(event) => setDomain(event.target.value)}>
            {domains.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          작업
          <select value={task} onChange={(event) => setTask(event.target.value)}>
            {tasks.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className={styles.workspace}>
        <label>
          원문
          <textarea
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
            placeholder="도메인 문장을 입력하세요."
          />
        </label>

        <label>
          결과
          <textarea
            readOnly
            value={result?.result_text ?? ''}
            placeholder="처리 결과가 표시됩니다."
          />
        </label>
      </section>

      <div className={styles.actions}>
        <button type="button" onClick={handleProcess} disabled={isLoading || !sourceText.trim()}>
          {isLoading ? '처리 중...' : '실행'}
        </button>
        {errorMessage ? <p>{errorMessage}</p> : null}
      </div>

      {result ? (
        <section className={styles.meta}>
          <div>
            <span>Provider</span>
            <strong>{result.provider || '-'}</strong>
          </div>
          <div>
            <span>Model</span>
            <strong>{result.model_name || '-'}</strong>
          </div>
          <div className={styles.notice}>
            <span>주의</span>
            <strong>{result.error || result.disclaimer}</strong>
          </div>
        </section>
      ) : null}

      {result?.legal_analysis ? (
        <section className={styles.legalPanel}>
          <div>
            <span>Legal Model</span>
            <strong>{result.legal_analysis.model_name}</strong>
          </div>
          <div>
            <span>법률 문맥 유사도</span>
            <strong>{result.legal_analysis.legal_similarity_score.toFixed(4)}</strong>
          </div>
          <div>
            <span>토큰 수</span>
            <strong>{result.legal_analysis.token_count}</strong>
          </div>
          <div className={styles.terms}>
            <span>매칭 법률 용어</span>
            <strong>
              {result.legal_analysis.matched_terms.length > 0
                ? result.legal_analysis.matched_terms.join(', ')
                : '없음'}
            </strong>
          </div>
          <p>{result.legal_analysis.note}</p>
        </section>
      ) : null}
    </main>
  );
}
