import Image from "next/image";

type Props = {
  title: string;
  subtitle?: string;
  date: string;
  time: string;
  from: string;
  to: string;
  pax: string | number;
  extra?: string;
  iconSrc?: string; // t.ex. "/maps_pin.png"
};

export default function TripLegCard({
  title,
  subtitle = "",
  date,
  time,
  from,
  to,
  pax,
  extra = "",
  iconSrc = "/maps_pin.png",
}: Props) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[#0f172a] mb-2">
        <Image src={iconSrc} alt="Icon" width={18} height={18} />
        <span className="font-semibold">{title}</span>
        {subtitle && <span className="text-xs text-[#0f172a]/50 ml-2">{subtitle}</span>}
      </div>

      <div className="border rounded-lg p-3 text-[14px] text-[#0f172a]" style={{ lineHeight: 1.5 }}>
        <div>
          <span className="font-semibold">Avgång:</span> {date} kl {time}
        </div>
        <div>
          <span className="font-semibold">Från:</span> {from}
        </div>
        <div>
          <span className="font-semibold">Till:</span> {to}
        </div>
        <div>
          <span className="font-semibold">Antal passagerare:</span> {pax}
        </div>
        <div className="mt-1">
          <span className="font-semibold">Övrig information:</span>{" "}
          <span className="whitespace-pre-wrap">{extra || "Ingen information."}</span>
        </div>
      </div>
    </div>
  );
}
