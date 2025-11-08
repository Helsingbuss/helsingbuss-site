type Row = { label: string; value: string; wrap?: boolean };
type CardProps = { rows: Row[]; lineHeight?: number };

export default function OfferMetaCards({
  left,
  right,
}: {
  left: CardProps;
  right: CardProps;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <MetaCard {...left} />
      <MetaCard {...right} />
    </div>
  );
}

function MetaCard({ rows, lineHeight = 1.25 }: CardProps) {
  return (
    <div className="border rounded-lg p-4" style={{ lineHeight }}>
      {rows.map((r, i) => (
        <div key={i} className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-[#0f172a]/70">{r.label}</span>
          <span className={`text-sm text-[#0f172a] ${r.wrap ? "break-all" : "whitespace-nowrap"}`}>
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}
