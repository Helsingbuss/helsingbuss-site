// src/components/dashboard/OffersBarChart.tsx
import React, { useMemo, useState } from "react";

export type Series = {
  weeks: string[];                // t.ex. ["v. 35", "v. 36", ...]
  offer_answered: number[];       // Besvarade offerter
  offer_unanswered: number[];     // Obesvarade offerter
  booking_in: number[];           // Inkomna bokningar
  booking_done: number[];         // Slutförda bokningar
};

type Props = { series: Series };

/** Färger (matchar din skiss) */
const COLORS = {
  offer_answered: "#2E7D32",   // mörkgrön
  offer_unanswered: "#A5D6A7", // ljusgrön
  booking_in: "#C62828",       // röd
  booking_done: "#F48FB1",     // rosa
};

const LABELS: Record<keyof Series, string> = {
  weeks: "Vecka",
  offer_answered: "Besvarade offerter",
  offer_unanswered: "Obesvarade offerter",
  booking_in: "Inkomna bokningar",
  booking_done: "Slutförda bokningar",
};

/** Bygg snygga ticks: 0..max om max ≤ 6, annars i jämnt steg. */
function buildTicks(max: number): number[] {
  const ceilMax = Math.max(1, Math.ceil(max));
  if (ceilMax <= 6) {
    return Array.from({ length: ceilMax + 1 }, (_, i) => i); // 0,1,2,...,max
  }
  const step = Math.ceil(ceilMax / 6); // ca 6 streck
  const arr: number[] = [];
  for (let v = 0; v <= ceilMax; v += step) arr.push(v);
  if (arr[arr.length - 1] !== ceilMax) arr.push(ceilMax);
  return arr;
}

export default function OffersBarChart({ series }: Props) {
  const { weeks, offer_answered, offer_unanswered, booking_in, booking_done } = series;

  const maxY = useMemo(
    () =>
      Math.max(
        1,
        ...(offer_answered.length ? offer_answered : [0]),
        ...(offer_unanswered.length ? offer_unanswered : [0]),
        ...(booking_in.length ? booking_in : [0]),
        ...(booking_done.length ? booking_done : [0])
      ),
    [offer_answered, offer_unanswered, booking_in, booking_done]
  );

  const ticks = useMemo(() => buildTicks(maxY), [maxY]);

  // layout-parametrar
  const height = 260;
  const topPad = 20;
  const bottomPad = 36;
  const leftPad = 28;  // lite mer plats för y-etiketter
  const rightPad = 12;

  const innerH = height - topPad - bottomPad;
  const innerW = Math.max(weeks.length * 56, 400); // min bredd, en grupp ≈ 56px

  // varje grupp innehåller 4 bars
  const barWidth = 14;                  // tjockare bars
  const barGap = 6;                     // gap mellan bars i samma grupp
  const groupWidth = barWidth * 4 + barGap * 3;

  const y = (val: number) => topPad + innerH * (1 - val / ticks[ticks.length - 1]);

  // Tooltip-state (SVG-baserad)
  const [tip, setTip] = useState<null | { x: number; y: number; label: string; value: number }>(
    null
  );

  const groups = weeks.map((w, i) => {
    const gx = leftPad + i * groupWidth + i * 12; // 12px grupp-gap
    return { week: w, gx };
  });

  return (
    <div className="relative w-full overflow-x-auto">
      <svg width={innerW + leftPad + rightPad} height={height} className="block">
        {/* Gridlines + y-ticks */}
        {ticks.map((value, i) => {
          const yPos = y(value);
          return (
            <g key={`grid-${i}`}>
              <line x1={leftPad} x2={leftPad + innerW} y1={yPos} y2={yPos} stroke="#E5E7EB" />
              <text
                x={leftPad - 7}
                y={yPos + 4}
                textAnchor="end"
                fill="#6B7280"
                fontSize="10"
              >
                {value}
              </text>
            </g>
          );
        })}

        {/* Staplar */}
        {groups.map(({ week, gx }, i) => {
          const bars = [
            { v: booking_done[i] || 0, c: COLORS.booking_done, key: "booking_done" as const },
            { v: booking_in[i] || 0, c: COLORS.booking_in, key: "booking_in" as const },
            { v: offer_answered[i] || 0, c: COLORS.offer_answered, key: "offer_answered" as const },
            { v: offer_unanswered[i] || 0, c: COLORS.offer_unanswered, key: "offer_unanswered" as const },
          ];

          return (
            <g key={`grp-${i}`}>
              {bars.map((b, j) => {
                const h = innerH * (b.v / ticks[ticks.length - 1]);
                const x = gx + j * (barWidth + barGap);
                const yTop = topPad + (innerH - h);
                const cx = x + barWidth / 2; // tooltip-ankare mitt i stapeln
                const cy = yTop - 6;

                return (
                  <rect
                    key={b.key}
                    x={x}
                    y={yTop}
                    width={barWidth}
                    height={Math.max(h, 0)}
                    fill={b.c}
                    rx={3}
                    onMouseEnter={() =>
                      setTip({
                        x: cx,
                        y: cy,
                        label: LABELS[b.key],
                        value: b.v,
                      })
                    }
                    onMouseMove={() =>
                      setTip((t) => (t ? { ...t, x: cx, y: cy } : t))
                    }
                    onMouseLeave={() => setTip(null)}
                  />
                );
              })}

              {/* x-etikett under gruppen */}
              <text
                x={gx + groupWidth / 2}
                y={height - 10}
                textAnchor="middle"
                fill="#6B7280"
                fontSize="11"
              >
                {week}
              </text>
            </g>
          );
        })}

        {/* SVG-tooltip */}
        {tip && (
          <g transform={`translate(${tip.x}, ${tip.y})`} pointerEvents="none">
            <rect
              x={-70}
              y={-28}
              width={140}
              height={24}
              fill="white"
              stroke="#E5E7EB"
              rx={6}
            />
            <text
              x={0}
              y={-12}
              textAnchor="middle"
              fontSize="11"
              fill="#111827"
            >
              {tip.label}: {tip.value}
            </text>
          </g>
        )}
      </svg>

      {/* Legend (etiketter i rätt ordning) */}
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <LegendDot color={COLORS.booking_done} label="Slutförda bokningar" />
        <LegendDot color={COLORS.booking_in} label="Inkomna bokningar" />
        <LegendDot color={COLORS.offer_answered} label="Besvarade offerter" />
        <LegendDot color={COLORS.offer_unanswered} label="Obesvarade offerter" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-block"
        style={{ width: 10, height: 10, backgroundColor: color, borderRadius: 2 }}
      />
      <span className="text-[#194C66]/80 text-sm">{label}</span>
    </span>
  );
}
