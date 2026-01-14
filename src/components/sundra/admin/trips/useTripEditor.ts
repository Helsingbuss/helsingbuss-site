import { useEffect, useMemo, useState } from "react";
import { TripRecord, TripType } from "@/lib/sundra/trips/types";
import {
  factsToText,
  itineraryToText,
  parseFacts,
  parseLinesToArray,
  safeNumber,
  textToItinerary,
} from "./editorUtils";

export type TripFormState = {
  title: string;
  type: TripType;
  slug: string;
  subtitle: string;
  durationLabel: string;
  intro: string;
  description: string;
  fromPrice: string;

  badgesText: string;
  heroVideoUrl: string;
  heroImageUrl: string;
  galleryText: string;
  factsText: string;
  itineraryText: string;
};

export function useTripEditor(id: string | undefined) {
  const [trip, setTrip] = useState<TripRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [form, setForm] = useState<TripFormState>({
    title: "",
    type: "DAY",
    slug: "",
    subtitle: "",
    durationLabel: "",
    intro: "",
    description: "",
    fromPrice: "",
    badgesText: "",
    heroVideoUrl: "",
    heroImageUrl: "",
    galleryText: "",
    factsText: "",
    itineraryText: "",
  });

  async function load() {
    if (!id) return;
    setLoading(true);
    const res = await fetch(`/api/trips/${id}`);
    const data = await res.json();
    setLoading(false);

    if (!res.ok) return;

    const t: TripRecord = data.trip;
    setTrip(t);

    setForm({
      title: t.title || "",
      type: t.type,
      slug: t.slug || "",
      subtitle: t.subtitle || "",
      durationLabel: t.durationLabel || "",
      intro: t.intro || "",
      description: t.description || "",
      fromPrice: typeof t.fromPriceSEK === "number" ? String(t.fromPriceSEK) : "",

      badgesText: (t.badges || []).join(", "),
      heroVideoUrl: t.media?.heroVideoUrl || "",
      heroImageUrl: t.media?.heroImageUrl || "",
      galleryText: (t.media?.gallery || []).join("\n"),
      factsText: factsToText(t.facts),
      itineraryText: itineraryToText(t.itinerary),
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const previewHref = useMemo(() => (trip ? `/resor/preview?id=${trip.id}` : "#"), [trip]);
  const liveHref = useMemo(() => (trip ? `/resor/${trip.slug}` : "#"), [trip]);

  async function saveDraft() {
    if (!trip) return;
    setMsg(null);
    setSaving(true);

    const badges = (form.badgesText || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    const patch = {
      title: form.title.trim(),
      type: form.type,
      slug: form.slug.trim(),
      subtitle: form.subtitle.trim(),
      durationLabel: form.durationLabel.trim(),
      intro: form.intro.trim(),
      description: form.description.trim(),
      fromPriceSEK: safeNumber(form.fromPrice),

      badges,
      media: {
        heroVideoUrl: form.heroVideoUrl.trim() || undefined,
        heroImageUrl: form.heroImageUrl.trim() || undefined,
        gallery: parseLinesToArray(form.galleryText),
      },
      facts: parseFacts(form.factsText),
      itinerary: textToItinerary(form.type, form.itineraryText),
    };

    const res = await fetch(`/api/trips/${trip.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMsg(data?.error || "Kunde inte spara.");
      return;
    }

    setTrip(data.trip);
    // om slug blev “unikifierad” på servern → uppdatera form
    setForm((prev) => ({ ...prev, slug: data.trip.slug }));
    setMsg("Sparat ✅");
  }

  async function publish() {
    if (!trip) return;
    setMsg(null);
    const res = await fetch(`/api/trips/${trip.id}/publish`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) return setMsg(data?.error || "Kunde inte publicera.");
    setTrip(data.trip);
    setMsg("Publicerad ✅");
  }

  async function archive() {
    if (!trip) return;
    setMsg(null);
    const res = await fetch(`/api/trips/${trip.id}/archive`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) return setMsg(data?.error || "Kunde inte arkivera.");
    setTrip(data.trip);
    setMsg("Arkiverad ✅");
  }

  return {
    trip,
    loading,
    saving,
    msg,
    setMsg,
    form,
    setForm,
    previewHref,
    liveHref,
    reload: load,
    saveDraft,
    publish,
    archive,
  };
}
