import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "음식 메뉴 추천 실습",
  description: "CSV 메뉴 데이터를 이용한 한국어 TF-IDF 메뉴 추천 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
