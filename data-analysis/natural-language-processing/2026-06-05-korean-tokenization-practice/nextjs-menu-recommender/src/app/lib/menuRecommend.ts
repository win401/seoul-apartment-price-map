import { readFile } from "fs/promises";
import path from "path";

export type MenuItem = {
  id: string;
  name: string;
  category: string;
  description: string;
};

export type MenuRecommendation = MenuItem & {
  score: number;
  tfidfScore: number;
  intentScore: number;
  matchedIntents: string[];
  keywords: string[];
};

export type RecommendationResponse = {
  query: string;
  generatedAt: string;
  totalMenus: number;
  tokenizedQuery: string[];
  expandedQuery: string[];
  results: MenuRecommendation[];
};

const STOPWORDS = new Set([
  "음식",
  "메뉴",
  "추천",
  "좋은",
  "먹고",
  "싶어",
  "먹을",
  "만한",
  "오늘",
  "약간",
  "좀",
  "있는",
  "없는",
  "으로",
  "하고",
  "되는",
]);

const INTENT_RULES = [
  {
    intent: "해장",
    triggers: ["해장", "숙취", "술", "국물", "시원", "뜨끈", "따뜻"],
    expansions: ["국물", "얼큰", "칼칼", "시원", "육수", "찌개", "탕", "라면", "국수"],
  },
  {
    intent: "칼칼함",
    triggers: ["칼칼", "얼큰", "매운", "맵", "매콤", "사천", "자극"],
    expansions: ["칼칼", "얼큰", "매콤", "고추장", "두반장", "짬뽕", "김치", "떡볶이"],
  },
  {
    intent: "다이어트",
    triggers: ["다이어트", "가벼운", "가볍", "건강", "채소", "담백", "깔끔"],
    expansions: ["신선", "나물", "채소", "가볍", "담백", "쌀국수", "비빔밥", "상큼"],
  },
  {
    intent: "든든함",
    triggers: ["든든", "배부른", "고기", "보양", "힘", "단백질"],
    expansions: ["고기", "소갈비", "돼지고기", "진한", "탕", "삼겹살", "돈카츠"],
  },
  {
    intent: "고소함",
    triggers: ["고소", "크림", "치즈", "부드러운", "느끼", "꾸덕"],
    expansions: ["고소", "치즈", "크림", "버터", "모짜렐라", "까르보나라", "리조또"],
  },
  {
    intent: "상큼함",
    triggers: ["상큼", "새콤", "개운", "깔끔", "산뜻"],
    expansions: ["상큼", "새콤", "고수", "숙주", "쌀국수", "팟타이", "토마토"],
  },
];

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function parseMenuCsv(csv: string): MenuItem[] {
  const lines = csv.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);
  const nameIndex = headers.indexOf("메뉴명");
  const categoryIndex = headers.indexOf("카테고리");
  const descriptionIndex = headers.indexOf("설명");

  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    return {
      id: `menu-${index + 1}`,
      name: values[nameIndex] ?? "",
      category: values[categoryIndex] ?? "",
      description: values[descriptionIndex] ?? "",
    };
  });
}

async function loadMenus() {
  const filePath = path.join(process.cwd(), "data", "menu-data.csv");
  const csv = await readFile(filePath, "utf-8");
  return parseMenuCsv(csv);
}

function normalizeKoreanToken(token: string) {
  return token
    .replace(/(으로|에서|에게|에는|으로는|하고)$/g, "")
    .replace(/(에|은|는|이|가|을|를)$/g, "")
    .replace(/(스러운|스럽|하고|하게|한)$/g, "");
}

export function tokenizeKorean(text: string) {
  const normalized = text
    .normalize("NFKC")
    .replace(/[ㅋㅎ]{3,}/g, "ㅋㅋ")
    .replace(/[ㅠㅜ]{3,}/g, "ㅠㅠ");

  const matches = normalized.match(/[가-힣]+|[A-Za-z]+|\d+(?:\.\d+)?/g) ?? [];
  return matches
    .map((token) => token.toLowerCase())
    .map((token) => (/[가-힣]/.test(token) ? normalizeKoreanToken(token) : token))
    .filter((token) => token.length > 1)
    .filter((token) => !STOPWORDS.has(token));
}

function expandQueryTokens(query: string, tokens: string[]) {
  const expanded = new Set(tokens);
  const matchedIntents: string[] = [];

  for (const rule of INTENT_RULES) {
    const matched = rule.triggers.some((trigger) => query.includes(trigger));
    if (!matched) continue;
    matchedIntents.push(rule.intent);
    for (const token of rule.expansions) expanded.add(token);
  }

  return {
    tokens: Array.from(expanded),
    matchedIntents,
  };
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

function getIntentScore(query: string, menu: MenuItem) {
  const text = `${menu.name} ${menu.category} ${menu.description}`;
  const matched: string[] = [];
  let score = 0;

  for (const rule of INTENT_RULES) {
    if (!rule.triggers.some((trigger) => query.includes(trigger))) continue;
    const hits = rule.expansions.filter((keyword) => text.includes(keyword));
    if (!hits.length) continue;
    matched.push(rule.intent);
    score += Math.min(0.35, hits.length * 0.08);
  }

  return {
    score: Math.min(score, 0.6),
    matched,
  };
}

function topKeywords(tokens: string[], limit = 7) {
  const counts = termFrequency(tokens);
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([keyword]) => keyword);
}

export async function recommendMenus(
  query: string,
): Promise<RecommendationResponse> {
  const safeQuery = query.trim() || "해장 잘되는 음식";
  const menus = await loadMenus();
  const queryTokens = tokenizeKorean(safeQuery);
  const expanded = expandQueryTokens(safeQuery, queryTokens);
  const menuTexts = menus.map(
    (menu) => `${menu.name} ${menu.category} ${menu.description}`,
  );
  const tokenDocs = [expanded.tokens, ...menuTexts.map(tokenizeKorean)];
  const vectors = buildTfidfVectors(tokenDocs);
  const queryVector = vectors[0];
  const menuVectors = vectors.slice(1);

  const results = menus
    .map((menu, index) => {
      const tfidfScore = cosineSimilarity(queryVector, menuVectors[index]);
      const intent = getIntentScore(safeQuery, menu);
      const score = Math.min(1, tfidfScore * 0.78 + intent.score);
      return {
        ...menu,
        score,
        tfidfScore,
        intentScore: intent.score,
        matchedIntents: intent.matched,
        keywords: topKeywords(tokenDocs[index + 1]),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return {
    query: safeQuery,
    generatedAt: new Date().toISOString(),
    totalMenus: menus.length,
    tokenizedQuery: queryTokens,
    expandedQuery: expanded.tokens,
    results,
  };
}
