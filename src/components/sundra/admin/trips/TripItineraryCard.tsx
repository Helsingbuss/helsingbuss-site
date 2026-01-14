import { TripFormState } from "./useTripEditor";

export function TripItineraryCard({
  form,
  setForm,
}: {
  form: TripFormState;
  setForm: (updater: (prev: TripFormState) => TripFormState) => void;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <label className="text-sm font-semibold text-gray-900">
        Resplan (endast flerdags – separera dagar med en rad som är "---")
      </label>
      <textarea
        value={form.itineraryText}
        onChange={(e) => setForm((p) => ({ ...p, itineraryText: e.target.value }))}
        rows={12}
        className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
      />
    </div>
  );
}
