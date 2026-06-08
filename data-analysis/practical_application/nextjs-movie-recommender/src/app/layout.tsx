import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Few-Shot Movie Recommender",
  description: "Few-shot prompting and review retrieval practice app",
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
