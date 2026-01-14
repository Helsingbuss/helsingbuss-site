// src/components/sundra/admin/trips/TripEditor.tsx
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import type { TripRecord, TripType, TripStatus } from "@/lib/sundra/trips/types";
import { TripMediaCard } from "./TripMediaCard";

type Props = {
  trip: TripRecord;
  onSave: (trip: TripRecord) => Promise<void>;
};

type Notice = { kind: "info" | "success" | "error"; text: string } | null;
type SaveIntent = "save" | "publish" | "archive";

function intentText(intent: SaveIntent) {
  if (intent === "publish") return { doing: "Publicerar…", done: "Publicerad ✅" };
  if (intent === "archive") return { doing: "Arkiverar…", done: "Arkiverad ✅" };
  return { doing: "Sparar…", done: "Sparat ✅" };
}

type SaveOptions = {
  silent?: boolean;
  origin?: "manual" | "autosave";
};

// --------- Flerdags-mall (itinerary) ----------
type ItineraryDay = {
  title: string;
  description: string;
};

function defaultMultiItinerary(): ItineraryDay[] {
  return [
    { title: "Dag 1", description: "" },
    { title: "Dag 2", description: "" },
  ];
}

function getItinerary(draft: any): ItineraryDay[] {
  const it = draft?.itinerary;
  if (!Array.isArray(it)) return [];
  return it as ItineraryDay[];
}

// ✅ Program i korthet: PRIORITERA media först (samma som live)
function getProgramSummary(d: any): string {
  const v =
    d?.media?.programSummary ??
    d?.media?.program_summary ??
    d?.programSummary ??
    d?.program_summary ??
    "";
  return typeof v === "string" ? v : "";
}

function setProgramSummaryOnDraft(d: any, value: string) {
  const media = d?.media && typeof d.media === "object" ? d.media : {};
  return {
    ...d,
    media: {
      ...media,
      programSummary: value,
    },
  };
}

export function TripEditor({ trip, onSave }: Props) {
  const router = useRouter();

  const [draft, setDraft] = useState<TripRecord>(() => ({ ...trip }));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ✅ toast notice (ska INTE påverka layout)
  const [notice, setNotice] = useState<Notice>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const [savedSnapshot, setSavedSnapshot] = useState<string>(() => JSON.stringify(trip ?? {}));

  const [autosaveEnabled, setAutosaveEnabled] = useState(true);
  const AUTOSAVE_DELAY_MS = 1500;

  const [autosaveBlockedSignature, setAutosaveBlockedSignature] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setDraft({ ...trip });
    setSavedSnapshot(JSON.stringify(trip ?? {}));
    setErr(null);
    setNotice(null);
    setLastSavedAt(null);
    setAutosaveBlockedSignature(null);
  }, [trip?.id]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2200);
    return () => clearTimeout(t);
  }, [notice]);

  const draftSignature = useMemo(() => {
    try {
      return JSON.stringify(draft ?? {});
    } catch {
      return String(Date.now());
    }
  }, [draft]);

  const isDirty = useMemo(() => {
    try {
      return JSON.stringify(draft ?? {}) !== savedSnapshot;
    } catch {
      return true;
    }
  }, [draft, savedSnapshot]);

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const previewHref = useMemo(() => {
    const id = (draft as any)?.id;
    return id ? `/admin/sundra/resor/_preview/${id}` : "/admin/sundra/resor";
  }, [(draft as any)?.id]);

  const lastSavedText = useMemo(() => {
    if (!lastSavedAt) return null;
    try {
      return lastSavedAt.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return null;
    }
  }, [lastSavedAt]);

  // ✅ Om typ = MULTI och itinerary saknas => lägg in mall
  useEffect(() => {
    if ((draft as any)?.type !== "MULTI") return;

    const it = getItinerary(draft as any);
    if (it.length > 0) return;

    setDraft((d: any) => ({
      ...d,
      itinerary: defaultMultiItinerary(),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(draft as any)?.type, (draft as any)?.id]);

  async function save(patch?: Partial<TripRecord>, intent: SaveIntent = "save", opts?: SaveOptions) {
    setErr(null);
    const t = intentText(intent);

    // ✅ Toast som overlay (ingen layoutshift)
    if (!opts?.silent) setNotice({ kind: "info", text: t.doing });

    try {
      setSaving(true);

      // ✅ VIKTIGT: skapa INTE ny draft-objekt på autosave (det kan skapa "hoppskänsla")
      const next = patch ? ({ ...(draft as any), ...(patch as any) } as TripRecord) : draft;

      if (patch) setDraft(next);

      await onSave(next);

      setLastSavedAt(new Date());
      setSavedSnapshot(JSON.stringify(next));
      setAutosaveBlockedSignature(null);

      if (!opts?.silent) {
        setNotice({ kind: "success", text: t.done });
      } else {
        setNotice({ kind: "success", text: "Autosparat ✅" });
      }
    } catch (e: any) {
      const msg = e?.message ?? "Kunde inte spara.";
      setErr(msg);

      if (opts?.origin === "autosave") {
        setAutosaveBlockedSignature(draftSignature);
        setNotice({ kind: "error", text: `Autospar misslyckades: ${msg}` });
      } else {
        setNotice({ kind: "error", text: `Fel: ${msg}` });
      }
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!autosaveEnabled) return;
    if (!isDirty) return;
    if (saving) return;
    if (!(draft as any)?.id) return;

    if (autosaveBlockedSignature && autosaveBlockedSignature === draftSignature) return;
    if (!String((draft as any).title ?? "").trim()) return;

    const timer = setTimeout(() => {
      save(undefined, "save", { silent: true, origin: "autosave" });
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autosaveEnabled, isDirty, draftSignature, saving, autosaveBlockedSignature, (draft as any)?.id]);

  async function deleteTrip() {
    const ok = window.confirm(`Ta bort denna resa?\n\nDetta går inte att ångra.`);
    if (!ok) return;

    try {
      setDeleting(true);
      setErr(null);
      setNotice({ kind: "info", text: "Tar bort…" });

      let res = await fetch(`/api/trips/delete?id=${encodeURIComponent((draft as any).id)}`, {
        method: "DELETE",
      });

      if (res.status === 405) {
        res = await fetch(`/api/trips/delete?id=${encodeURIComponent((draft as any).id)}`, {
          method: "POST",
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) throw new Error(data?.error ?? "Kunde inte ta bort resan.");

      setNotice({ kind: "success", text: "Borttagen ✅" });
      router.push("/admin/sundra/resor");
    } catch (e: any) {
      const msg = e?.message ?? "Kunde inte ta bort.";
      setErr(msg);
      setNotice({ kind: "error", text: `Fel: ${msg}` });
    } finally {
      setDeleting(false);
    }
  }

  // ---------- Helpers för itinerary ----------
  const itinerary = useMemo(() => getItinerary(draft as any), [draftSignature]);

  function addDay() {
    setDraft((d: any) => {
      const curr = getItinerary(d);
      const nextNr = curr.length + 1;
      return {
        ...d,
        itinerary: [...curr, { title: `Dag ${nextNr}`, description: "" }],
      };
    });
  }

  function removeDay(idx: number) {
    setDraft((d: any) => {
      const curr = getItinerary(d);
      return { ...d, itinerary: curr.filter((_, i) => i !== idx) };
    });
  }

  function updateDay(idx: number, patch: Partial<ItineraryDay>) {
    setDraft((d: any) => {
      const curr = getItinerary(d);
      const next = curr.map((day, i) => (i === idx ? { ...day, ...patch } : day));
      return { ...d, itinerary: next };
    });
  }

  const programSummary = useMemo(() => getProgramSummary(draft as any), [draftSignature]);

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      {/* ✅ Toast overlay (ingen layoutshift = inget hopp) */}
      {notice ? (
        <div
          className={[
            "fixed right-4 top-20 z-[9999] max-w-[360px] rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg",
            notice.kind === "info" ? "border-blue-200 bg-blue-50 text-blue-800" : "",
            notice.kind === "success" ? "border-green-200 bg-green-50 text-green-800" : "",
            notice.kind === "error" ? "border-red-200 bg-red-50 text-red-800" : "",
          ].join(" ")}
        >
          {notice.text}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-gray-900">Redigera resa</div>
          <div className="text-xs text-gray-500">ID: {(draft as any).id}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={previewHref}
            className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            Förhandsgranska
          </Link>

          <button
            onClick={() => save({ status: "published" } as any, "publish", { origin: "manual" })}
            disabled={saving}
            className="rounded-xl bg-[var(--hb-primary,#0B2A44)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Jobbar…" : "Publicera"}
          </button>

          <button
            onClick={() => save({ status: "archived" } as any, "archive", { origin: "manual" })}
            disabled={saving}
            className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-50"
          >
            {saving ? "Jobbar…" : "Arkivera"}
          </button>

          <button
            onClick={deleteTrip}
            disabled={saving || deleting}
            className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-50"
            title="Tar bort resan permanent"
          >
            {deleting ? "Tar bort…" : "Ta bort"}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          {lastSavedText ? (
            <>
              Senast sparad: <span className="font-semibold">{lastSavedText}</span>
            </>
          ) : (
            <span>—</span>
          )}

          {isDirty ? (
            <span className="rounded-full border border-yellow-200 bg-yellow-50 px-2 py-1 font-semibold text-yellow-800">
              Osparade ändringar
            </span>
          ) : (
            <span className="rounded-full border border-green-200 bg-green-50 px-2 py-1 font-semibold text-green-800">
              Allt sparat
            </span>
          )}

          <button
            type="button"
            onClick={() => setAutosaveEnabled((v) => !v)}
            className="rounded-full border bg-white px-2 py-1 font-semibold text-gray-900 hover:bg-gray-50"
            title="Slå av/på autospar"
          >
            Autospar: {autosaveEnabled ? "På" : "Av"}
          </button>
        </div>
      </div>

      {err ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-gray-900">Titel</label>
          <input
            className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2"
            value={(draft as any).title ?? ""}
            onChange={(e) => setDraft((d: any) => ({ ...d, title: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900">Typ</label>
          <select
            className="mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2"
            value={(draft as any).type}
            onChange={(e) => setDraft((d: any) => ({ ...d, type: e.target.value as TripType }))}
          >
            <option value="DAY">Dagsresa</option>
            <option value="MULTI">Flerdagsresa</option>
            <option value="FUN">Nöjesresa</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900">Status</label>
          <select
            className="mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2"
            value={(draft as any).status}
            onChange={(e) => setDraft((d: any) => ({ ...d, status: e.target.value as TripStatus }))}
          >
            <option value="draft">Utkast</option>
            <option value="published">Publicerad</option>
            <option value="archived">Arkiverad</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900">Slug</label>
          <input
            className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2"
            value={(draft as any).slug ?? ""}
            onChange={(e) => setDraft((d: any) => ({ ...d, slug: e.target.value }))}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-900">Meta-rad</label>
          <input
            className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2"
            value={(draft as any).metaLine ?? (draft as any).meta_line ?? ""}
            onChange={(e) => setDraft((d: any) => ({ ...d, metaLine: e.target.value }))}
            placeholder="T.ex. Flerdagsresa • Tyskland • Shopping"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-900">Intro</label>
          <textarea
            className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2"
            rows={3}
            value={(draft as any).intro ?? ""}
            onChange={(e) => setDraft((d: any) => ({ ...d, intro: e.target.value }))}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-900">Beskrivning (Om resan)</label>
          <textarea
            className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2"
            rows={6}
            value={(draft as any).description ?? ""}
            onChange={(e) => setDraft((d: any) => ({ ...d, description: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900">Från-pris (SEK)</label>
          <input
            className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2"
            type="number"
            value={(draft as any).fromPriceSEK ?? ""}
            onChange={(e) =>
              setDraft((d: any) => ({
                ...d,
                fromPriceSEK: e.target.value ? Number(e.target.value) : null,
              }))
            }
          />
        </div>

        {/* ✅ KOMMA-TAGGAR kvar */}
        <div>
          <label className="block text-sm font-semibold text-gray-900">Taggar (komma-separerat)</label>
          <input
            className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2"
            value={((draft as any).tags ?? []).join(", ")}
            onChange={(e) =>
              setDraft((d: any) => ({
                ...d,
                tags: e.target.value
                  .split(/[,;\n]+/g)
                  .map((s) => s.trim())
                  .filter(Boolean),
              }))
            }
            placeholder="Komfortbuss, Hotell, Shopping"
          />
        </div>
      </div>

      {/* ✅ Media */}
      <TripMediaCard
        value={(draft as any).media ?? null}
        onChange={(next) => setDraft((d: any) => ({ ...d, media: next }))}
        bucket="trip-media"
      />

      {/* ✅ Dagsprogram endast för flerdagsresor */}
      {(draft as any).type === "MULTI" ? (
        <div className="mt-6 rounded-2xl border bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">Dagsprogram</div>
              <div className="mt-1 text-sm text-gray-600">
                Dagarna visas på resans sida under <span className="font-semibold">Program</span>.
              </div>
            </div>

            <button
              type="button"
              onClick={addDay}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              + Lägg till dag
            </button>
          </div>

          {/* ✅ layout: dagar vänster, Program i korthet höger */}
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_360px]">
            {/* Vänster: dagarna */}
            <div className="space-y-4">
              {itinerary.map((day, idx) => (
                <div key={idx} className="rounded-2xl border bg-gray-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-gray-900">Dag {idx + 1}</div>

                    <button
                      type="button"
                      onClick={() => removeDay(idx)}
                      className="rounded-xl border bg-white px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      Ta bort dag
                    </button>
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-semibold text-gray-900">Rubrik</label>
                    <input
                      className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2"
                      value={day.title ?? `Dag ${idx + 1}`}
                      onChange={(e) => updateDay(idx, { title: e.target.value })}
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-900">Dagsprogram (detaljer)</label>
                    <textarea
                      className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2"
                      rows={6}
                      value={day.description ?? ""}
                      onChange={(e) => updateDay(idx, { description: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Höger: Program i korthet (EN ruta) */}
            <div className="rounded-2xl border bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-900">Program i korthet</div>
              <div className="mt-1 text-xs text-gray-600">
                Visas på resans sida ovanför dagarna. (Sparas i{" "}
                <span className="font-semibold">media.programSummary</span>)
              </div>

              <textarea
                className="mt-3 w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2"
                rows={10}
                value={programSummary}
                onChange={(e) => setDraft((d: any) => setProgramSummaryOnDraft(d, e.target.value))}
                placeholder="Skriv en kort sammanfattning av hela resans upplägg..."
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={() => save(undefined, "save", { origin: "manual" })}
          disabled={saving || !isDirty}
          className="rounded-xl bg-[var(--hb-primary,#0B2A44)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          title={!isDirty ? "Inga osparade ändringar" : undefined}
        >
          {saving ? "Sparar…" : "Spara"}
        </button>
      </div>
    </div>
  );
}
