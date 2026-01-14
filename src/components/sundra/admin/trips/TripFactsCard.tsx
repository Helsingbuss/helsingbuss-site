import { TripFormState } from "./useTripEditor";

export function TripFactsCard({
  form,
  setForm,
}: {
  form: TripFormState;
  setForm: (updater: (prev: TripFormState) => TripFormState) => void;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <label className="text-sm font-semibold text-gray-900">
        Mer fakta (Key: Value per rad)
      </label>
      <textarea
        value={form.factsText}
        onChange={(e) => setForm((p) => ({ ...p, factsText: e.target.value }))}
        rows={10}
        className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
        placeholder={"Reslängd: 8 dagar\nBoende: Hotell\nMåltider: Utvalda måltider ingår"}
      />
    </div>
  );
}
