import { NextRequest, NextResponse } from "next/server";
import { searchNews } from "../../lib/newsSearch";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "인공지능";

  try {
    const result = await searchNews(query);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: "뉴스 검색 처리 중 오류가 발생했습니다.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
