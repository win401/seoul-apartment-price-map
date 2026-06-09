'use client';
import Link from 'next/link';
import styles from './page.module.css';
import { useState } from 'react';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'ko', name: 'Korean' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'es', name: 'Spanish' },
];

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

export default function Home() {
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('ko');
  const [text, setText] = useState(
    'Artificial intelligence helps people translate ideas across languages.',
  );
  const [translatedText, setTranslatedText] = useState('');
  const [referenceText, setReferenceText] = useState('');
  const [bleuScore, setBleuScore] = useState<number | null>(null);
  const [bleuInterpretation, setBleuInterpretation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleTranslate() {
    setIsLoading(true);
    setBleuScore(null);
    setBleuInterpretation('');

    try {
      const response = await fetch(`${API_BASE_URL}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          source_language: sourceLanguage,
          target_language: targetLanguage,
          reference_text: referenceText,
        }),
      });

      const data = await response.json();
      setTranslatedText(data.translated_text);
      setBleuScore(data.bleu?.score ?? null);
      setBleuInterpretation(data.bleu?.interpretation ?? '');
    } catch (error) {
      console.error(error);
      setTranslatedText('백엔드 서버에 연결할 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>NLP Practice · 2026-06-09</p>
          <h1>다국어 번역 실험실</h1>
          <Link className={styles.headerLink} href="/evaluation">
            품질 테스트 평가
          </Link>
          <Link className={styles.headerLink} href="/domain">
            도메인 실험실
          </Link>
        </div>

        <div className={styles.controls}>
          <label>
            원본 언어
            <select
              value={sourceLanguage}
              onChange={(event) => setSourceLanguage(event.target.value)}
            >
              {languages.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            번역 언어
            <select
              value={targetLanguage}
              onChange={(event) => setTargetLanguage(event.target.value)}
            >
              {languages.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.workspace}>
          <label>
            원문
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </label>

          <label>
            번역 결과
            <textarea
              readOnly
              value={translatedText}
              placeholder="번역 결과가 표시됩니다."
            />
          </label>
        </div>

        <label className={styles.reference}>
          기준 번역문
          <textarea
            value={referenceText}
            onChange={(event) => setReferenceText(event.target.value)}
            placeholder="BLEU 점수를 계산하려면 사람이 만든 기준 번역문을 입력하세요."
          />
        </label>

        <div className={styles.metrics}>
          <div>
            <span>BLEU</span>
            <strong>{bleuScore === null ? '-' : bleuScore.toFixed(2)}</strong>
          </div>
          <div>
            <span>품질 해석</span>
            <strong>{bleuInterpretation || '기준 번역문 필요'}</strong>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={handleTranslate}>
            {isLoading ? '번역 중...' : '번역하기'}
          </button>
          <button type="button" className={styles.secondary}>
            예제 문장
          </button>
        </div>
      </section>
    </main>
  );
}
