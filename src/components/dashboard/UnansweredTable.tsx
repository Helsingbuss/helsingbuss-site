// src/components/dashboard/UnansweredTable.tsx
import React from "react";

export type UnansweredRow = {
  id: string;
  offer_number: string | null;
  from: string | null;
  to: string | null;
  pax: number | null;
  type: string;
  departure_date: string | null;
  departure_time: string | null;
};

type Props = { rows?: UnansweredRow[] };

export default function UnansweredTable({ rows = [] }: Props) {
  return (
    <div className="p-4">
      <div className="text-[#194C66] font-semibold mb-2">Obesvarade offerter</div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-[#194C66]/70">
            <tr>
              <th className="px-4 py-2">Offert ID</th>
              <th className="px-4 py-2">Avresa</th>
              <th className="px-4 py-2">Klockan</th>
              <th className="px-4 py-2">Från</th>
              <th className="px-4 py-2">Till</th>
              <th className="px-4 py-2">Antal passagerare</th>
              <th className="px-4 py-2">Typ av resa</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-[#194C66]/60">
                  Inga obesvarade offerter 🎉
                </td>
              </tr>
            )}

            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-[#f5f4f0]">
                <td className="px-4 py-2">{r.offer_number ?? "—"}</td>
                <td className="px-4 py-2">{r.departure_date ?? "—"}</td>
                <td className="px-4 py-2">{r.departure_time ?? "—"}</td>
                <td className="px-4 py-2">{r.from ?? "—"}</td>
                <td className="px-4 py-2">{r.to ?? "—"}</td>
                <td className="px-4 py-2">{r.pax ?? "—"}</td>
                <td className="px-4 py-2">{r.type || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
