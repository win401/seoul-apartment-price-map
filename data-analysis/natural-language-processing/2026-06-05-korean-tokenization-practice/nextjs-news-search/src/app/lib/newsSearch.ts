export type NewsArticle = {
  id: string;
  title: string;
  category: string;
  description: string;
  link: string;
  pubDate?: string;
  source: "naver-openapi" | "naver-rss" | "google-news-rss" | "sample";
};

export type KeywordScore = {
  keyword: string;
  score: number;
};

export type SearchResult = NewsArticle & {
  similarity: number;
  keywords: KeywordScore[];
  tokens: string[];
};

export type NewsSearchResponse = {
  query: string;
  generatedAt: string;
  source: NewsArticle["source"];
  sourceLabel: string;
  requestedSource: NewsSourceMode;
  articles: NewsArticle[];
  results: SearchResult[];
  tokenizedQuery: string[];
  warning?: string;
};

export type NewsSourceMode = "auto" | "openapi" | "rss";

const STOPWORDS = new Set([
  "이",
  "그",
  "저",
  "것",
  "수",
  "등",
  "및",
  "를",
  "을",
  "은",
  "는",
  "가",
  "의",
  "에",
  "도",
  "로",
  "으로",
  "하다",
  "있다",
  "되다",
  "이다",
  "없다",
  "않다",
  "하는",
  "있는",
  "되는",
  "위해",
  "통해",
  "대한",
  "관련",
  "따른",
  "이후",
  "현재",
  "대해",
  "지난",
  "오는",
  "기자",
  "뉴스",
  "연합뉴스",
]);

const SAMPLE_ARTICLES: NewsArticle[] = [
  {
    id: "sample-1",
    title: "삼성전자, 차세대 인공지능 반도체 개발 속도",
    category: "IT",
    description:
      "삼성전자가 AI 연산 성능을 높인 차세대 인공지능 반도체 개발에 속도를 내고 있다.",
    link: "#sample-1",
    source: "sample",
  },
  {
    id: "sample-2",
    title: "네이버, 한국어 검색 품질 개선 위한 AI 모델 고도화",
    category: "IT",
    description:
      "네이버가 한국어 자연어 처리 기술을 활용해 뉴스와 문서 검색 품질을 개선하고 있다.",
    link: "#sample-2",
    source: "sample",
  },
  {
    id: "sample-3",
    title: "정부, 소상공인 디지털 전환 지원 사업 확대",
    category: "경제",
    description:
      "정부가 소상공인의 온라인 판매와 예약 관리 자동화를 돕는 디지털 전환 지원 사업을 확대한다.",
    link: "#sample-3",
    source: "sample",
  },
  {
    id: "sample-4",
    title: "생성형 AI 도입한 상담 자동화 서비스 증가",
    category: "스타트업",
    description:
      "스타트업 업계에서 고객 문의를 분류하고 FAQ 답변을 추천하는 생성형 AI 상담 자동화 서비스가 늘고 있다.",
    link: "#sample-4",
    source: "sample",
  },
  {
    id: "sample-5",
    title: "전기차 배터리 시장, 충전 속도 경쟁 심화",
    category: "산업",
    description:
      "전기차 배터리 업체들이 충전 속도와 주행 거리 개선을 중심으로 기술 경쟁을 이어가고 있다.",
    link: "#sample-5",
    source: "sample",
  },
  {
    id: "sample-6",
    title: "한국 야구 대표팀, 국제 대회 결승 진출",
    category: "스포츠",
    description:
      "한국 야구 대표팀이 국제 대회에서 안정적인 경기력을 보이며 결승에 진출했다.",
    link: "#sample-6",
    source: "sample",
  },
];

function decodeHtml(text: string) {
  const decoded = text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

  return decoded.replace(/<[^>]+>/g, "").trim();
}

function stripHtml(text: string) {
  return decodeHtml(text).replace(/\s+/g, " ");
}

export function tokenizeKorean(text: string) {
  const normalized = text
    .normalize("NFKC")
    .replace(/[ㅋㅎ]{3,}/g, "ㅋㅋ")
    .replace(/[ㅠㅜ]{3,}/g, "ㅠㅠ");

  const matches = normalized.match(/[가-힣]+|[A-Za-z]+|\d+(?:\.\d+)?/g) ?? [];
  return matches
    .map((token) => token.toLowerCase())
    .filter((token) => token.length > 1)
    .filter((token) => !STOPWORDS.has(token));
}

function termFrequency(tokens: string[]) {
  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return counts;
}

function buildTfidfVectors(tokenDocs: string[][]) {
  const docCount = tokenDocs.length;
  const vocabulary = Array.from(new Set(tokenDocs.flat())).sort();
  const documentFrequency = new Map<string, number>();

  for (const term of vocabulary) {
    documentFrequency.set(
      term,
      tokenDocs.filter((tokens) => tokens.includes(term)).length,
    );
  }

  return tokenDocs.map((tokens) => {
    const tf = termFrequency(tokens);
    const vector = new Map<string, number>();
    for (const term of vocabulary) {
      const count = tf.get(term) ?? 0;
      if (!count) continue;
      const termTf = count / Math.max(tokens.length, 1);
      const df = documentFrequency.get(term) ?? 0;
      const idf = Math.log((docCount + 1) / (df + 1)) + 1;
      vector.set(term, termTf * idf);
    }
    return vector;
  });
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const value of a.values()) normA += value * value;
  for (const value of b.values()) normB += value * value;
  for (const [term, value] of a) dot += value * (b.get(term) ?? 0);

  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function topKeywords(vector: Map<string, number>, limit = 5): KeywordScore[] {
  return Array.from(vector.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([keyword, score]) => ({ keyword, score }));
}

function parseRss(
  xml: string,
  source: Extract<NewsArticle["source"], "naver-rss" | "google-news-rss">,
): NewsArticle[] {
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  return itemMatches.slice(0, 20).map((item, index) => {
    const readTag = (tag: string) => {
      const match = item.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
      return match ? stripHtml(match[1]) : "";
    };
    const title = readTag("title");
    const description = readTag("description");
    const link = readTag("link");
    const pubDate = readTag("pubDate");
    return {
      id: `${source}-${index}-${link || title}`,
      title,
      category: source === "naver-rss" ? "네이버뉴스 RSS" : "Google News RSS",
      description,
      link,
      pubDate,
      source,
    };
  });
}

async function fetchWithTimeout(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        ...(options.headers ?? {}),
      },
      next: { revalidate: 60 },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchNaverOpenApi(query: string) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(
    query,
  )}&display=20&sort=date`;
  const response = await fetchWithTimeout(url, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
  });
  if (!response.ok) throw new Error(`Naver Open API ${response.status}`);
  const data = (await response.json()) as {
    items?: Array<{
      title: string;
      description: string;
      link: string;
      pubDate: string;
    }>;
  };

  return (data.items ?? []).map((item, index) => ({
    id: `openapi-${index}-${item.link}`,
    title: stripHtml(item.title),
    category: "네이버뉴스",
    description: stripHtml(item.description),
    link: item.link,
    pubDate: item.pubDate,
    source: "naver-openapi" as const,
  }));
}

async function fetchNaverRss(query: string) {
  const rssUrl = `https://search.naver.com/search.naver?where=rss&query=${encodeURIComponent(
    query,
  )}`;
  const response = await fetchWithTimeout(rssUrl);
  if (!response.ok) throw new Error(`Naver RSS ${response.status}`);
  const xml = await response.text();
  return parseRss(xml, "naver-rss");
}

async function fetchGoogleNewsRss(query: string) {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
    query,
  )}&hl=ko&gl=KR&ceid=KR:ko`;
  const response = await fetchWithTimeout(rssUrl);
  if (!response.ok) throw new Error(`Google News RSS ${response.status}`);
  const xml = await response.text();
  return parseRss(xml, "google-news-rss");
}

async function fetchRssArticles(query: string) {
  const errors: unknown[] = [];

  try {
    const naverArticles = await fetchNaverRss(query);
    if (naverArticles.length) {
      return {
        articles: naverArticles,
        provider: "Naver News RSS",
      };
    }
  } catch (error) {
    errors.push(error);
    console.warn(error);
  }

  try {
    const googleArticles = await fetchGoogleNewsRss(query);
    if (googleArticles.length) {
      return {
        articles: googleArticles,
        provider: "Google News RSS",
      };
    }
  } catch (error) {
    errors.push(error);
    console.warn(error);
  }

  if (errors.length) {
    throw new Error("RSS providers failed");
  }

  return null;
}

async function fetchNews(query: string, sourceMode: NewsSourceMode) {
  if (sourceMode === "rss") {
    try {
      const rssResult = await fetchRssArticles(query);
      if (rssResult?.articles.length) {
        return {
          articles: rssResult.articles,
          warning:
            `${rssResult.provider} 모드로 실행했습니다. 공식 검색 API가 아니라 RSS XML을 파싱한 결과입니다.`,
        };
      }
    } catch (error) {
      console.warn(error);
    }

    return {
      articles: SAMPLE_ARTICLES,
      warning:
        "네이버 RSS 호출에 실패해 샘플 기사로 실행했습니다. 네트워크 또는 RSS 응답 형식을 확인해야 합니다.",
    };
  }

  try {
    const openApiArticles = await fetchNaverOpenApi(query);
    if (openApiArticles?.length) {
      return {
        articles: openApiArticles,
        warning: undefined,
      };
    }
  } catch (error) {
    console.warn(error);
  }

  if (sourceMode === "auto") {
    try {
      const rssResult = await fetchRssArticles(query);
      if (rssResult?.articles.length) {
        return {
          articles: rssResult.articles,
          warning:
            `NAVER_CLIENT_ID/SECRET이 없거나 Open API 호출이 실패해 ${rssResult.provider} 경로를 사용했습니다.`,
        };
      }
    } catch (error) {
      console.warn(error);
    }
  }

  return {
    articles: SAMPLE_ARTICLES,
    warning:
      sourceMode === "openapi"
        ? "Naver Open API 호출에 실패해 샘플 기사로 실행했습니다. NAVER_CLIENT_ID/SECRET 값과 API 권한을 확인해야 합니다."
        : "네이버 뉴스 호출에 실패해 샘플 기사로 실행했습니다. 실시간 뉴스는 네트워크 또는 NAVER_CLIENT_ID/SECRET 설정이 필요합니다.",
  };
}

export async function searchNews(
  query: string,
  sourceMode: NewsSourceMode = "auto",
): Promise<NewsSearchResponse> {
  const safeQuery = query.trim() || "인공지능";
  const safeSourceMode: NewsSourceMode = ["auto", "openapi", "rss"].includes(
    sourceMode,
  )
    ? sourceMode
    : "auto";
  const { articles, warning } = await fetchNews(safeQuery, safeSourceMode);
  const documents = [
    safeQuery,
    ...articles.map((a) => `${a.title} ${a.description}`),
  ];
  const tokenDocs = documents.map(tokenizeKorean);
  const vectors = buildTfidfVectors(tokenDocs);
  const queryVector = vectors[0];
  const articleVectors = vectors.slice(1);

  const results = articles
    .map((article, index) => ({
      ...article,
      similarity: cosineSimilarity(queryVector, articleVectors[index]),
      keywords: topKeywords(articleVectors[index]),
      tokens: tokenDocs[index + 1],
    }))
    .sort((a, b) => b.similarity - a.similarity);

  const source = articles[0]?.source ?? "sample";
  const sourceLabel =
    source === "naver-openapi"
      ? "Naver Open API"
      : source === "naver-rss"
        ? "Naver News RSS"
        : source === "google-news-rss"
          ? "Google News RSS"
        : "Sample Data";

  return {
    query: safeQuery,
    generatedAt: new Date().toISOString(),
    source,
    sourceLabel,
    requestedSource: safeSourceMode,
    articles,
    results,
    tokenizedQuery: tokenDocs[0],
    warning,
  };
}
