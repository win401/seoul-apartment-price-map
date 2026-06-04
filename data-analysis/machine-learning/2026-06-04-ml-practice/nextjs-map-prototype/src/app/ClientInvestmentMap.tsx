"use client";

import dynamic from "next/dynamic";
import styles from "./page.module.css";
import type { MapCandidate } from "./InvestmentMap";

const InvestmentMap = dynamic(() => import("./InvestmentMap"), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>지도를 불러오는 중</div>,
});

type ClientInvestmentMapProps = {
  candidates: MapCandidate[];
  selectedId: number;
  onSelect: (id: number) => void;
};

export default function ClientInvestmentMap(props: ClientInvestmentMapProps) {
  return <InvestmentMap {...props} />;
}
