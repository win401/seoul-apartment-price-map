import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DATA_PATH = path.join(ROOT, "src/data/candidates.json");
const API_KEY = process.env.KAKAO_REST_API_KEY;

if (!API_KEY) {
  console.error("Missing KAKAO_REST_API_KEY.");
  console.error("Create .env.local or run:");
  console.error("KAKAO_REST_API_KEY=... npm run geocode:kakao");
  process.exit(1);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function projectToCanvas(items) {
  const withCoords = items.filter(
    (item) => typeof item.lat === "number" && typeof item.lng === "number",
  );

  if (!withCoords.length) {
    return items;
  }

  const minLat = Math.min(...withCoords.map((item) => item.lat));
  const maxLat = Math.max(...withCoords.map((item) => item.lat));
  const minLng = Math.min(...withCoords.map((item) => item.lng));
  const maxLng = Math.max(...withCoords.map((item) => item.lng));
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  return items.map((item) => {
    if (typeof item.lat !== "number" || typeof item.lng !== "number") {
      return item;
    }

    return {
      ...item,
      x: Math.round((8 + ((item.lng - minLng) / lngRange) * 84) * 100) / 100,
      y: Math.round((8 + ((maxLat - item.lat) / latRange) * 84) * 100) / 100,
    };
  });
}

async function geocode(query) {
  const url = new URL("https://dapi.kakao.com/v2/local/search/address.json");
  url.searchParams.set("query", query);

  const response = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Kakao geocode failed: ${response.status}`);
  }

  const json = await response.json();
  return json.documents?.[0] ?? null;
}

const raw = await fs.readFile(DATA_PATH, "utf8");
const payload = JSON.parse(raw);
let success = 0;
let failed = 0;

const items = [];
for (const item of payload.items) {
  if (typeof item.lat === "number" && typeof item.lng === "number") {
    items.push(item);
    success += 1;
    continue;
  }

  const query = item.geocodeQuery ?? `서울특별시 ${item.addrKr ?? `${item.dong} ${item.apt}`}`;
  const doc = await geocode(query);

  if (!doc) {
    failed += 1;
    items.push({
      ...item,
      geocodeStatus: "failed",
      geocodeQuery: query,
    });
    console.warn(`No result: ${query}`);
    await wait(120);
    continue;
  }

  success += 1;
  items.push({
    ...item,
    lat: Number(doc.y),
    lng: Number(doc.x),
    geocodeStatus: "ok",
    geocodeQuery: query,
    resolvedAddress: doc.address_name,
  });

  await wait(120);
}

payload.items = projectToCanvas(items);
payload.meta = {
  ...payload.meta,
  coordinateStatus:
    failed === 0
      ? "Kakao Local API로 실제 주소 좌표 변환 완료"
      : `Kakao Local API 좌표 변환 완료: 성공 ${success}건, 실패 ${failed}건`,
  geocodedAt: new Date().toISOString(),
};

await fs.writeFile(DATA_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

console.log(`Geocoding complete. success=${success}, failed=${failed}`);
