"use client";

import { DivIcon, LatLngExpression } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import styles from "./page.module.css";

export type MapCandidate = {
  id: number;
  dong: string;
  apt: string;
  areaBucket: number;
  addrKr: string;
  lat?: number;
  lng?: number;
  grade: "high" | "medium" | "low";
  predGrowthRate: number;
  predFuturePriceEok: number;
  actualFuturePriceEok: number;
};

type InvestmentMapProps = {
  candidates: MapCandidate[];
  selectedId: number;
  onSelect: (id: number) => void;
};

function formatRate(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatEok(value: number) {
  return `${value.toFixed(2)}억`;
}

function createMarkerIcon(candidate: MapCandidate, active: boolean) {
  const colorByGrade = {
    high: "#16835f",
    medium: "#d58b19",
    low: "#697a72",
  };
  const size = active ? 48 : 38;

  return new DivIcon({
    className: `${styles.leafletMarkerShell} ${
      active ? styles.leafletMarkerActive : ""
    }`,
    html: `<span style="width:${size}px;height:${size}px;background:${
      colorByGrade[candidate.grade]
    }">${Math.round(candidate.predGrowthRate)}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -20],
  });
}

export default function InvestmentMap({
  candidates,
  selectedId,
  onSelect,
}: InvestmentMapProps) {
  const geocoded = candidates.filter(
    (candidate) => typeof candidate.lat === "number" && typeof candidate.lng === "number",
  );

  const center: LatLngExpression = geocoded.length
    ? [
        geocoded.reduce((sum, item) => sum + Number(item.lat), 0) /
          geocoded.length,
        geocoded.reduce((sum, item) => sum + Number(item.lng), 0) /
          geocoded.length,
      ]
    : [37.5665, 126.978];

  return (
    <MapContainer
      center={center}
      zoom={11}
      scrollWheelZoom
      className={styles.leafletMap}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {geocoded.map((candidate) => (
        <Marker
          key={candidate.id}
          position={[Number(candidate.lat), Number(candidate.lng)]}
          icon={createMarkerIcon(candidate, candidate.id === selectedId)}
          eventHandlers={{
            click: () => onSelect(candidate.id),
          }}
        >
          <Popup>
            <div className={styles.popup}>
              <strong>{candidate.apt}</strong>
              <span>
                {candidate.dong} · {candidate.areaBucket}㎡대
              </span>
              <span>{candidate.addrKr}</span>
              <dl>
                <div>
                  <dt>예측 상승률</dt>
                  <dd>{formatRate(candidate.predGrowthRate)}</dd>
                </div>
                <div>
                  <dt>2017 예측가</dt>
                  <dd>{formatEok(candidate.predFuturePriceEok)}</dd>
                </div>
                <div>
                  <dt>2017 실제가</dt>
                  <dd>{formatEok(candidate.actualFuturePriceEok)}</dd>
                </div>
              </dl>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
