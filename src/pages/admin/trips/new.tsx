import { useState } from "react";
import AdminMenu from "@/components/AdminMenu";
import Header from "@/components/Header";

type Dep = {
  dep_date: string;  // YYYY-MM-DD
  dep_time: string;  // HH:mm
  line: string;
  stops: string;     // komma-separerat i UI
  price: string;
  seats: string;
  published: boolean;
};

export default function NewTrip() {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [teaser, setTeaser] = useState("");
  const [hero, setHero] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [badge, setBadge] = useState("");
  const [ribbon, setRibbon] = useState("");
  const [published, setPublished] = useState(true);

  const [deps, setDeps] = useState<Dep[]>([
    { dep_date: "", dep_time: "", line: "", stops: "", price: "", seats: "", published: true }
  ]);

  function addRow() {
    setDeps(d => [...d, { dep_date: "", dep_time: "", line: "", stops: "", price: "", seats: "", published: true }]);
  }
  function delRow(i: number) {
    setDeps(d => d.filter((_,ix)=>ix!==i));
  }
  function updRow(i:number, k:keyof Dep, v:any) {
    setDeps(d => d.map((r,ix)=>ix===i? {...r, [k]: v} : r));
  }

  async function submit() {
    setSaving(true); setMsg(null); setErr(null);
    try {
      const payload = {
        title,
        subtitle: subtitle || null,
        teaser: teaser || null,
        hero_image: hero || null,
        price_from: priceFrom ? Number(priceFrom) : null,
        badge: badge || null,
        ribbon: ribbon || null,
        published,
        departures: deps
          .filter(d => d.dep_date)
          .map(d => ({
            dep_date: d.dep_date,
            dep_time: d.dep_time || null,
            line: d.line || null,
            stops: d.stops ? d.stops.split(",").map(s=>s.trim()).filter(Boolean) : [],
            price: d.price ? Number(d.price) : null,
            seats: d.seats ? Number(d.seats) : null,
            published: d.published
          }))
      };

      const r = await fetch("/api/trips/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Kunde inte skapa resan");
      setMsg("Resan är skapad!");
    } catch (e:any) {
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

          {err && <div className="bg-red-50 text-red-700 px-4 py-2 rounded">{err}</div>}
          {msg && <div className="bg-green-50 text-green-700 px-4 py-2 rounded">{msg}</div>}

          <div className="bg-white rounded-xl shadow p-4 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[#194C66]/70">Titel</label>
                <input className="border rounded px-3 py-2 w-full" value={title} onChange={e=>setTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-[#194C66]/70">Underrubrik</label>
                <input className="border rounded px-3 py-2 w-full" value={subtitle} onChange={e=>setSubtitle(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-[#194C66]/70">Teaser / ingress (visas i kortet)</label>
                <textarea className="border rounded px-3 py-2 w-full min-h-[90px]" value={teaser} onChange={e=>setTeaser(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-[#194C66]/70">Bild-URL</label>
                <input className="border rounded px-3 py-2 w-full" value={hero} onChange={e=>setHero(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-[#194C66]/70">Pris från (SEK)</label>
                <input className="border rounded px-3 py-2 w-full" value={priceFrom} onChange={e=>setPriceFrom(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-[#194C66]/70">Badge (liten text under)</label>
                <input className="border rounded px-3 py-2 w-full" value={badge} onChange={e=>setBadge(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-[#194C66]/70">Ribbon (röd banderoll över bild)</label>
                <input className="border rounded px-3 py-2 w-full" value={ribbon} onChange={e=>setRibbon(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <input id="pub" type="checkbox" checked={published} onChange={e=>setPublished(e.target.checked)} />
                <label htmlFor="pub" className="text-sm text-[#194C66]">Publicerad</label>
              </div>
            </div>

            {/* Avgångar */}
            <div className="pt-4 border-t">
              <div className="text-[#194C66] font-semibold mb-2">Avgångar</div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[#194C66]/70">
                      <th className="py-2 pr-2">Datum</th>
                      <th className="py-2 pr-2">Tid</th>
                      <th className="py-2 pr-2">Linje</th>
                      <th className="py-2 pr-2">Hållplatser (komma-separerat)</th>
                      <th className="py-2 pr-2">Pris</th>
                      <th className="py-2 pr-2">Platser</th>
                      <th className="py-2 pr-2">Publ.</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {deps.map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="py-2 pr-2">
                          <input type="date" className="border rounded px-2 py-1" value={r.dep_date} onChange={e=>updRow(i,"dep_date",e.target.value)} />
                        </td>
                        <td className="py-2 pr-2">
                          <input type="time" className="border rounded px-2 py-1" value={r.dep_time} onChange={e=>updRow(i,"dep_time",e.target.value)} />
                        </td>
                        <td className="py-2 pr-2">
                          <input className="border rounded px-2 py-1" value={r.line} onChange={e=>updRow(i,"line",e.target.value)} />
                        </td>
                        <td className="py-2 pr-2">
                          <input className="border rounded px-2 py-1 w-[320px]" value={r.stops} onChange={e=>updRow(i,"stops",e.target.value)} />
                        </td>
                        <td className="py-2 pr-2">
                          <input className="border rounded px-2 py-1 w-[90px]" value={r.price} onChange={e=>updRow(i,"price",e.target.value)} />
                        </td>
                        <td className="py-2 pr-2">
                          <input className="border rounded px-2 py-1 w-[70px]" value={r.seats} onChange={e=>updRow(i,"seats",e.target.value)} />
                        </td>
                        <td className="py-2 pr-2">
                          <input type="checkbox" checked={r.published} onChange={e=>updRow(i,"published",e.target.checked)} />
                        </td>
                        <td className="py-2 pr-2">
                          <button className="text-[#B91C1C]" onClick={()=>delRow(i)}>Ta bort</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="mt-3 px-3 py-2 rounded border" onClick={addRow}>+ Lägg till rad</button>
            </div>

            <div className="pt-4 flex gap-3">
              <button disabled={saving} onClick={submit} className="px-5 py-2 rounded-[25px] bg-[#194C66] text-white disabled:opacity-60">
                {saving ? "Sparar…" : "Spara resa"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
