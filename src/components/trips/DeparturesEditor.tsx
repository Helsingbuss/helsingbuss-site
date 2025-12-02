// src/components/trips/DeparturesEditor.tsx
import { useEffect, useState } from "react";

export type DepartureRow = {
  dep_date: string;
  dep_time: string;
  line_name: string;
  stops: string[]; // sparas som array i DB
};

type RowWithText = DepartureRow & {
  stopsText: string; // används bara i UI
};

type Props = {
  value: DepartureRow[];
  onChange: (rows: DepartureRow[]) => void;
};

function normalizeInputRows(rows: DepartureRow[] | undefined | null): RowWithText[] {
  if (!rows || !Array.isArray(rows)) return [];
  return rows.map((r) => {
    const stopsArray = Array.isArray(r.stops) ? r.stops : [];
    return {
      dep_date: r.dep_date || "",
      dep_time: r.dep_time || "",
      line_name: r.line_name || "",
      stops: stopsArray,
      stopsText: stopsArray.length ? stopsArray.join(", ") : "",
    };
  });
}

export default function DeparturesEditor({ value, onChange }: Props) {
  const [rows, setRows] = useState<RowWithText[]>(() => normalizeInputRows(value));

  // Om föräldern laddar in nya värden (t.ex. när man öppnar en resa igen)
  useEffect(() => {
    setRows(normalizeInputRows(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value || [])]);

  function emit(next: RowWithText[]) {
    setRows(next);

    const clean: DepartureRow[] = next.map((r) => ({
      dep_date: r.dep_date || "",
      dep_time: r.dep_time || "",
      line_name: r.line_name || "",
      stops: r.stopsText
        ? r.stopsText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    }));

    onChange(clean);
  }

  function addRow() {
    const next: RowWithText[] = [
      ...rows,
      {
        dep_date: "",
        dep_time: "",
        line_name: "",
        stops: [],
        stopsText: "",
      },
    ];
    emit(next);
  }

  function removeRow(idx: number) {
    const next = [...rows];
    next.splice(idx, 1);
    emit(next);
  }

  function updateField(
    idx: number,
    patch: Partial<Pick<RowWithText, "dep_date" | "dep_time" | "line_name" | "stopsText">>
  ) {
    const next = [...rows];
    next[idx] = { ...next[idx], ...patch };
    emit(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm text-[#194C66]/70">
          Lägg till avgångar för den här resan.
        </div>
        <button
          type="button"
          onClick={addRow}
          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-sm hover:bg-slate-50"
        >
          + Lägg till avgång
        </button>
      </div>

      {rows.length === 0 && (
        <div className="text-sm text-slate-500 border rounded-xl px-3 py-2">
          Inga avgångar tillagda ännu.
        </div>
      )}

      <div className="space-y-2">
        {rows.map((r, idx) => (
          <div
            key={idx}
            className="grid gap-2 md:grid-cols-[140px_120px_minmax(0,1fr)_minmax(0,1.4fr)_auto] items-start"
          >
            {/* Datum */}
            <div>
              <div className="text-[12px] text-slate-600 mb-1">Datum</div>
              <input
                type="date"
                className="border rounded-xl px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                value={r.dep_date || ""}
                onChange={(e) => updateField(idx, { dep_date: e.target.value })}
              />
            </div>

            {/* Tid */}
            <div>
              <div className="text-[12px] text-slate-600 mb-1">Tid</div>
              <input
                type="time"
                className="border rounded-xl px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                value={r.dep_time || ""}
                onChange={(e) => updateField(idx, { dep_time: e.target.value })}
              />
            </div>

            {/* Linje */}
            <div>
              <div className="text-[12px] text-slate-600 mb-1">Linje</div>
              <input
                type="text"
                className="border rounded-xl px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                placeholder="t.ex. Linje 101"
                value={r.line_name || ""}
                onChange={(e) =>
                  updateField(idx, { line_name: e.target.value })
                }
              />
            </div>

            {/* Hållplatser */}
            <div>
              <div className="text-[12px] text-slate-600 mb-1">
                Hållplatser (komma­separerade)
              </div>
              <input
                type="text"
                className="border rounded-xl px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                placeholder="Helsingborg, Ängelholm, Halmstad"
                value={r.stopsText}
                onChange={(e) =>
                  updateField(idx, { stopsText: e.target.value })
                }
              />
            </div>

            {/* Ta bort */}
            <div className="pt-[22px]">
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm hover:bg-red-50 hover:border-red-200 hover:text-red-700"
              >
                Ta bort
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
