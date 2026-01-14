import { TripType } from "@/lib/sundra/trips/types";
import { TripFormState } from "./useTripEditor";

export function TripBasicsCard({
  form,
  setForm,
}: {
  form: TripFormState;
  setForm: (updater: (prev: TripFormState) => TripFormState) => void;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="text-sm font-semibold text-gray-900">Titel</label>
          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-gray-900">Typ</label>
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as TripType }))}
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
            >
              <option value="DAY">Dagsresa</option>
              <option value="MULTI">Flerdagsresa</option>
              <option value="FUN">Nöjesresa</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
            />
            <div className="mt-1 text-xs text-gray-500">
              Blir unik automatiskt om den krockar.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-gray-900">Undertext</label>
            <input
              value={form.subtitle}
              onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="t.ex. Flerdagsresa, Sverige"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900">Längd</label>
            <input
              value={form.durationLabel}
              onChange={(e) => setForm((p) => ({ ...p, durationLabel: e.target.value }))}
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="t.ex. 8 dagar"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-gray-900">Från-pris (SEK)</label>
            <input
              value={form.fromPrice}
              onChange={(e) => setForm((p) => ({ ...p, fromPrice: e.target.value }))}
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="t.ex. 699"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900">
              Badges (komma-separerat)
            </label>
            <input
              value={form.badgesText}
              onChange={(e) => setForm((p) => ({ ...p, badgesText: e.target.value }))}
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="Komfortbuss, Hotell, ..."
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-900">Intro</label>
          <textarea
            value={form.intro}
            onChange={(e) => setForm((p) => ({ ...p, intro: e.target.value }))}
            rows={3}
            className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-900">Text om resan</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={7}
            className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
