// src/pages/admin/drivers/[id].tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import AdminMenu from "@/components/AdminMenu";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabaseClient";

type Driver = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;           // arbete
  private_email: string | null;   // NYTT
  phone: string | null;
  license_classes: string[] | null;
  employment_type: "timanställd" | "heltid" | "deltid" | "konsult" | null;
  hired_at: string | null;
  national_id: string | null;
  note: string | null;
  active: boolean;
  avatar_url?: string | null;
  updated_at?: string | null;
};

function cls(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

export default function DriverProfilePage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [driver, setDriver] = useState<Driver | null>(null);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");               // arbete
  const [privateEmail, setPrivateEmail] = useState(""); // NYTT
  const [licenseClasses, setLicenseClasses] = useState<string>("");
  const [employmentType, setEmploymentType] =
    useState<Driver["employment_type"]>("timanställd");
  const [hiredAt, setHiredAt] = useState<string>("");
  const [nationalId, setNationalId] = useState("");
  const [note, setNote] = useState("");
  const [active, setActive] = useState<boolean>(true);

  // Storage
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  async function refreshAvatarUrl(path?: string | null) {
    const p = path ?? avatarPath;
    if (!p) { setAvatarUrl(null); return; }
    const { data } = await supabase.storage.from("drivers").createSignedUrl(p, 3600);
    setAvatarUrl(data?.signedUrl ?? null);
  }

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/drivers/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        const d: Driver = j?.driver;
        setDriver(d || null);

        setFirstName(d?.first_name || "");
        setLastName(d?.last_name || "");
        setPhone(d?.phone || "");
        setEmail(d?.email || "");
        setPrivateEmail(d?.private_email || ""); // NYTT
        setLicenseClasses((d?.license_classes || []).join(", "));
        setEmploymentType(d?.employment_type || "timanställd");
        setHiredAt(d?.hired_at || "");
        setNationalId(d?.national_id || "");
        setNote(d?.note || "");
        setActive(Boolean(d?.active));

        setAvatarPath(d?.avatar_url || null);
        await refreshAvatarUrl(d?.avatar_url || null);
      } catch (e: any) {
        setError(e?.message || "Kunde inte hämta chauffören");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function onSave() {
    if (!id) return;
    try {
      setSaving(true);
      setError(null);

      const payload = {
        first_name: firstName || null,
        last_name: lastName || null,
        phone: phone || null,
        email: email || null,                     // arbete
        private_email: privateEmail || null,      // NYTT
        license_classes: licenseClasses
          ? licenseClasses.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        employment_type: employmentType || null,
        hired_at: hiredAt || null,
        national_id: nationalId || null,
        note: note || null,
        active,
        avatar_url: avatarPath || null,
      };

      const res = await fetch(`/api/drivers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      alert("Sparat ✅");
    } catch (e: any) {
      alert(e?.message || "Kunde inte spara");
    } finally {
      setSaving(false);
    }
  }

  function clickPickImage() {
    fileInputRef.current?.click();
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file || !id) return;
    if (!file.type.startsWith("image/")) { alert("Välj en bildfil"); return; }

    try {
      setUploading(true);
      setError(null);

      const fd = new FormData();
      fd.append("photo", file);
      const r = await fetch(`/api/drivers/${id}/avatar`, { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "Kunde inte ladda upp bild");

      if (j.path) setAvatarPath(j.path);
      if (j.url) setAvatarUrl(j.url);
      else await refreshAvatarUrl(j.path);

      await fetch(`/api/drivers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: j.path || null }),
      });

      alert("Profilbilden är uppdaterad ✅");
    } catch (e: any) {
      alert(e?.message || "Kunde inte ladda upp bilden.");
    } finally { setUploading(false); }
  }

  const updatedText = useMemo(() => {
    const t = driver?.updated_at?.slice(0, 10);
    return t ? `Senast uppdaterad: ${t}` : "";
  }, [driver?.updated_at]);

  return (
    <>
      <AdminMenu />
      <div className="min-h-screen bg-[#f5f4f0] lg:pl-64">
        <Header />
        <main className="p-6 space-y-6">
          <div className="mt-4" />

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-4">
                <div className="w-[110px] h-[110px] rounded-full bg-[#e9eef2] overflow-hidden flex items-center justify-center text-sm text-[#194C66]/70">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="Profilbild" className="w-full h-full object-cover" />
                  ) : ("Ingen bild")}
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={clickPickImage}
                    disabled={uploading || !driver?.id}
                    className={cls("px-3 py-1.5 rounded border text-sm", uploading ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "text-[#194C66]")}
                  >
                    {uploading ? "Laddar upp…" : "Byt profilbild"}
                  </button>
                  <div className="text-xs text-[#194C66]/60">{updatedText}</div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-[#194C66]/70">Laddar…</div>
            ) : !driver ? (
              <div className="text-[#194C66]/70">Ingen chaufför hittades.</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="text-sm text-[#194C66]/80">
                    Förnamn
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1 w-full border rounded px-2 py-1" />
                  </label>
                  <label className="text-sm text-[#194C66]/80">
                    Efternamn
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1 w-full border rounded px-2 py-1" />
                  </label>

                  <label className="text-sm text-[#194C66]/80">
                    Telefon
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full border rounded px-2 py-1" />
                  </label>
                  <label className="text-sm text-[#194C66]/80">
                    E-post (arbete)
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full border rounded px-2 py-1" />
                  </label>

                  {/* Privat e-post */}
                  <label className="text-sm text-[#194C66]/80">
                    Privat e-post
                    <input type="email" value={privateEmail} onChange={(e) => setPrivateEmail(e.target.value)} className="mt-1 w-full border rounded px-2 py-1" />
                </label>

                  <label className="text-sm text-[#194C66]/80">
                    Körkortsklasser (komma-separerade)
                    <input value={licenseClasses} onChange={(e) => setLicenseClasses(e.target.value)} placeholder="D, DE" className="mt-1 w-full border rounded px-2 py-1" />
                  </label>

                  <label className="text-sm text-[#194C66]/80">
                    Anställningsform
                    <select value={employmentType || "timanställd"} onChange={(e) => setEmploymentType(e.target.value as any)} className="mt-1 w-full border rounded px-2 py-1">
                      <option value="timanställd">Timanställd</option>
                      <option value="heltid">Heltid</option>
                      <option value="deltid">Deltid</option>
                      <option value="konsult">Konsult</option>
                    </select>
                  </label>

                  <label className="text-sm text-[#194C66]/80">
                    Anställd sedan
                    <input type="date" value={hiredAt || ""} onChange={(e) => setHiredAt(e.target.value)} className="mt-1 w-full border rounded px-2 py-1" />
                  </label>

                  <label className="text-sm text-[#194C66]/80">
                    Personnummer
                    <input value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="ÅÅÅÅMMDD-XXXX" className="mt-1 w-full border rounded px-2 py-1" />
                  </label>
                </div>

                <div className="mt-4">
                  <label className="text-sm text-[#194C66]/80 block mb-1">Anteckning</label>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full border rounded px-2 py-2 min-h-[120px]" />
                </div>

                <div className="mt-3">
                  <label className="inline-flex items-center gap-2 text-sm text-[#194C66]/80">
                    <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                    Aktiv
                  </label>
                </div>

                <div className="mt-6 flex justify-end">
                  <button onClick={onSave} disabled={saving} className={cls("px-5 py-2 rounded-[25px] text-sm font-medium", saving ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-[#194C66] text-white")}>
                    {saving ? "Sparar…" : "Spara ändringar"}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="pb-4" />
        </main>
      </div>
    </>
  );
}
