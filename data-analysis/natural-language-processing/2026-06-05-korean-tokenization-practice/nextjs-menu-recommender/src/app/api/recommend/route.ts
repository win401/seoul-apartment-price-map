import { NextRequest, NextResponse } from "next/server";
import { recommendMenus } from "../../lib/menuRecommend";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "해장 잘되는 음식";

  try {
    const result = await recommendMenus(query);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: "메뉴 추천 처리 중 오류가 발생했습니다.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
