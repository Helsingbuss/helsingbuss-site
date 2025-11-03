import { useState } from "react";
import AdminMenu from "@/components/AdminMenu";
import Header from "@/components/Header";

type PriceMode = "pill" | "button";
type PromoColor = "red" | "blue";
type Category = "Flerdagarsresa" | "Dagsresa" | "Shoppingresa";

export default function AdminNewTrip() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState<Category | "">("");

  const [promoEnabled, setPromoEnabled] = useState(false);
  const [promoText, setPromoText] = useState("");
  const [promoColor, setPromoColor] = useState<PromoColor>("red");

  const [heading, setHeading] = useState("");
  const [body, setBody] = useState("");
  const [introTitle, setIntroTitle] = useState("");
  const [introSub, setIntroSub] = useState("");

  const [priceMode, setPriceMode] = useState<PriceMode>("pill");
  const [priceFrom, setPriceFrom] = useState<string>("");
  const [pricePrefix, setPricePrefix] = useState("fr.");
  const [priceSuffix, setPriceSuffix] = useState(":-");
  const [buttonLabel, setButtonLabel] = useState("Se datum & boka");

  const [published, setPublished] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function autoSlug(v: string) {
    setTitle(v);
    if (!slug) {
      const s = v
        .toLowerCase()
        .replace(/[^a-z0-9åäö\- ]/gi, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      setSlug(s);
    }
  }

  async function submit() {
    setMsg(null); setErr(null); setSaving(true);
    try {
      const payload = {
        title, slug,
        image_url: imageUrl,
        category: category || null,
        promo_enabled: promoEnabled,
        promo_text: promoText || null,
        promo_color: promoColor,
        heading: heading || null,
        body: body || null,
        intro_title: introTitle || null,
        intro_sub: introSub || null,
        price_mode: priceMode,
        price_from: priceMode === "pill" ? (priceFrom ? Number(priceFrom) : null) : null,
        price_prefix: priceMode === "pill" ? pricePrefix : null,
        price_suffix: priceMode === "pill" ? priceSuffix : null,
        button_label: priceMode === "button" ? buttonLabel : null,
        published,
      };
      const r = await fetch("/api/trips/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Kunde inte spara");
      setMsg("Resan sparad ✅");
    } catch (e: any) {
      setErr(e?.message || "Tekniskt fel");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminMenu />
      <div className="min-h-screen bg-[#f5f4f0] lg:pl-64">
        <Header />
        <main className="p-6 space-y-6">
          <h1 className="text-xl font-semibold text-[#194C66]">Lägg upp resa</h1>

          <div className="bg-white rounded-xl shadow p-4 space-y-4">
            {msg && <div className="rounded bg-green-50 border border-green-200 text-green-800 p-3">{msg}</div>}
            {err && <div className="rounded bg-red-50 border border-red-200 text-red-700 p-3">{err}</div>}

            {/* Grunddata */}
            <section className="grid md:grid-cols-2 gap-4">
              <label className="text-sm">
                Titel
                <input className="mt-1 w-full border rounded px-2 py-1"
                  value={title} onChange={(e)=>autoSlug(e.target.value)} />
              </label>
              <label className="text-sm">
                Slug (URL)
                <input className="mt-1 w-full border rounded px-2 py-1"
                  value={slug} onChange={(e)=>setSlug(e.target.value)} />
              </label>
              <label className="text-sm">
                Bild-URL
                <input className="mt-1 w-full border rounded px-2 py-1"
                  value={imageUrl} onChange={(e)=>setImageUrl(e.target.value)} />
              </label>
              <label className="text-sm">
                Kategori
                <select className="mt-1 w-full border rounded px-2 py-1"
                  value={category} onChange={(e)=>setCategory(e.target.value as Category)}>
                  <option value="">—</option>
                  <option>Flerdagarsresa</option>
                  <option>Dagsresa</option>
                  <option>Shoppingresa</option>
                </select>
              </label>
            </section>

            {/* Kampanj */}
            <section className="grid md:grid-cols-2 gap-4">
              <label className="text-sm flex items-center gap-2">
                <input type="checkbox" checked={promoEnabled} onChange={e=>setPromoEnabled(e.target.checked)} />
                Visa kampanjbanderoll på bilden
              </label>
              <label className="text-sm">
                Färg
                <select className="mt-1 w-full border rounded px-2 py-1"
                  value={promoColor} onChange={(e)=>setPromoColor(e.target.value as any)}>
                  <option value="red">Röd</option>
                  <option value="blue">Blå</option>
                </select>
              </label>
              <label className="text-sm md:col-span-2">
                Kampanj-text (t.ex. ”Spara upp till 13 702:-”)
                <input className="mt-1 w-full border rounded px-2 py-1"
                  value={promoText} onChange={(e)=>setPromoText(e.target.value)} />
              </label>
            </section>

            {/* Texter */}
            <section className="grid md:grid-cols-2 gap-4">
              <label className="text-sm">
                Rubrik i body (valfritt)
                <input className="mt-1 w-full border rounded px-2 py-1"
                  value={heading} onChange={(e)=>setHeading(e.target.value)} />
              </label>
              <label className="text-sm">
                Intro vänster titel (t.ex. ”All Inclusive”)
                <input className="mt-1 w-full border rounded px-2 py-1"
                  value={introTitle} onChange={(e)=>setIntroTitle(e.target.value)} />
              </label>
              <label className="text-sm md:col-span-2">
                Brödtext (kort)
                <textarea className="mt-1 w-full border rounded px-2 py-2 min-h-[90px]"
                  value={body} onChange={(e)=>setBody(e.target.value)} />
              </label>
              <label className="text-sm md:col-span-2">
                Intro vänster underrad (t.ex. ”1 vecka …”)
                <input className="mt-1 w-full border rounded px-2 py-1"
                  value={introSub} onChange={(e)=>setIntroSub(e.target.value)} />
              </label>
            </section>

            {/* Pris / knapp */}
            <section className="grid md:grid-cols-2 gap-4">
              <label className="text-sm">
                Högersektion
                <select className="mt-1 w-full border rounded px-2 py-1"
                  value={priceMode} onChange={(e)=>setPriceMode(e.target.value as PriceMode)}>
                  <option value="pill">Pris-piller (som bilden)</option>
                  <option value="button">Knapp</option>
                </select>
              </label>

              {priceMode === "pill" ? (
                <>
                  <label className="text-sm">
                    Pris från
                    <input className="mt-1 w-full border rounded px-2 py-1"
                      type="number" inputMode="numeric"
                      value={priceFrom} onChange={(e)=>setPriceFrom(e.target.value)} />
                  </label>
                  <label className="text-sm">
                    Prefix
                    <input className="mt-1 w-full border rounded px-2 py-1"
                      value={pricePrefix} onChange={(e)=>setPricePrefix(e.target.value)} />
                  </label>
                  <label className="text-sm">
                    Suffix
                    <input className="mt-1 w-full border rounded px-2 py-1"
                      value={priceSuffix} onChange={(e)=>setPriceSuffix(e.target.value)} />
                  </label>
                </>
              ) : (
                <label className="text-sm md:col-span-2">
                  Knapptext
                  <input className="mt-1 w-full border rounded px-2 py-1"
                    value={buttonLabel} onChange={(e)=>setButtonLabel(e.target.value)} />
                </label>
              )}
            </section>

            {/* Publicering */}
            <section className="grid md:grid-cols-2 gap-4">
              <label className="text-sm flex items-center gap-2">
                <input type="checkbox" checked={published} onChange={(e)=>setPublished(e.target.checked)} />
                Publicerad
              </label>
            </section>

            <div className="pt-2">
              <button
                onClick={submit}
                disabled={saving}
                className="px-5 py-2 rounded-[25px] bg-[#194C66] text-white text-sm disabled:opacity-60"
              >
                {saving ? "Sparar…" : "Spara resan"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
