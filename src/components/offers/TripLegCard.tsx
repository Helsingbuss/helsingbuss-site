// src/components/offers/TripLegCard.tsx
import Image from "next/image";
import * as React from "react";

export type Props = {
  title: string;
  subtitle?: string;
  date?: string | null;
  time?: string | null;
  from?: string | null;
  to?: string | null;
  pax?: number | string | null;
  extra?: string | null;
  iconSrc?: string;              // t.ex. "/busie.png"
  compact?: boolean;             // ev. framtida
  footer?: React.ReactNode;      // <-- NY: stöd för extra innehåll (pristabell m.m.)
};

function v(x: any, fallback = "—") {
  if (x === null || x === undefined || x === "") return fallback;
  return String(x);
}

export default function TripLegCard({
  title,
  subtitle,
  date,
  time,
  from,
  to,
  pax,
  extra,
  iconSrc = "/maps_pin.png",
  footer,
}: Props) {
  return (
    <div className="border rounded-lg p-3 text-[14px] text-[#0f172a] leading-[1.5] bg-white">
      {/* Rubrikrad */}
      <div className="flex items-center gap-2 text-[#0f172a] mb-2">
        <Image src={iconSrc} alt="icon" width={22} height={22} />
        <span className="font-semibold">{title}</span>
        {subtitle ? (
          <span className="text-xs text-[#0f172a]/50 ml-2">{subtitle}</span>
        ) : null}
      </div>

      {/* Innehåll */}
      <div>
        <div>
          <span className="font-semibold">Avgång:</span> {v(date)}{time ? ` kl ${v(time)}` : ""}
        </div>
        <div>
          <span className="font-semibold">Från:</span> {v(from)}
        </div>
        <div>
          <span className="font-semibold">Till:</span> {v(to)}
        </div>
        <div>
          <span className="font-semibold">Antal passagerare:</span> {v(pax)}
        </div>

        {extra ? (
          <div className="mt-1">
            <span className="font-semibold">Övrig information:</span>{" "}
            <span className="whitespace-pre-wrap">{extra}</span>
          </div>
        ) : null}

        {/* Extra slot för prisrader m.m. */}
        {footer ? <div className="mt-3">{footer}</div> : null}
      </div>
    </div>
  );
}
