import React, { useMemo, useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/sundra/supabaseClient";
import type { TripMedia } from "@/lib/sundra/trips/types";

type Props = {
  value: TripMedia | null | undefined;
  onChange: (next: TripMedia) => void;
  bucket?: string; // default "trip-media"
};

export function TripMediaCard({ value, onChange, bucket = "trip-media" }: Props) {
  const media: any = value ?? {};
  const supabase = useMemo(() => getSupabaseClient(), []);
  const envOk = !!supabase;

  const [uploading, setUploading] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<
    { kind: "info" | "success" | "error"; text: string } | null
  >(null);

  useEffect(() => {
    if (!uploadNotice) return;
    const t = setTimeout(() => setUploadNotice(null), 4500);
    return () => clearTimeout(t);
  }, [uploadNotice]);

  async function uploadOne(file: File) {
    if (!supabase) throw new Error("Supabase client saknas (env ej laddad).");

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `trips/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: false,
      contentType: file.type || undefined,
    });

    if (error) {
      // Gör felet tydligt (bucket + originalmessage)
      throw new Error(`Bucket "${bucket}": ${error.message}`);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  return (
    <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
      <div className="text-sm font-semibold text-gray-900">Bilder & media</div>
      <div className="mt-1 text-sm text-gray-600">
        Lägg in hero-bild och galleri. (Video kan vara en URL)
      </div>

      <div className="mt-3 rounded-xl border bg-gray-50 p-3 text-xs text-gray-700">
        <div className="font-semibold mb-1">Rekommenderade bildstorlekar</div>
        <ul className="list-disc pl-4 space-y-1">
          <li><b>Hero-bild (banner):</b> 2400×1350 px (16:9). Minst 1600×900 px.</li>
          <li><b>Galleri:</b> 1920×1080 px eller 1600×1200 px. Försök hålla samma format på alla.</li>
          <li><b>Format:</b> JPG/WebP (bäst). PNG bara om du behöver transparens.</li>
          <li><b>Filstorlek:</b> helst under 1–2 MB per bild.</li>
          <li><b>Tips:</b> Placera viktiga detaljer i mitten (bilder kan beskäras på mobil).</li>
        </ul>
      </div>

      {!envOk ? (
        <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Saknar Supabase env i klienten. Behöver <b>NEXT_PUBLIC_SUPABASE_URL</b> och{" "}
          <b>NEXT_PUBLIC_SUPABASE_ANON_KEY</b> (eller <b>NEXT_PUBLIC_SUPABASE_KEY</b>).
        </div>
      ) : null}

      {uploadNotice ? (
        <div
          className={[
            "mt-4 rounded-xl border px-4 py-3 text-sm font-semibold",
            uploadNotice.kind === "info" ? "border-blue-200 bg-blue-50 text-blue-800" : "",
            uploadNotice.kind === "success" ? "border-green-200 bg-green-50 text-green-800" : "",
            uploadNotice.kind === "error" ? "border-red-200 bg-red-50 text-red-800" : "",
          ].join(" ")}
        >
          {uploadNotice.text}
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-gray-700">Hero-bild (URL)</label>
          <input
            className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2"
            value={media.heroImageUrl ?? ""}
            onChange={(e) => onChange({ ...media, heroImageUrl: e.target.value })}
            placeholder="https://..."
          />

          <div className="mt-3 flex items-center gap-3">
            <label className="inline-flex cursor-pointer rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50">
              {uploading ? "Laddar upp…" : "Ladda upp hero-bild"}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                disabled={uploading}
                onChange={async (e) => {
                  const input = e.currentTarget; // ✅ spara direkt (så vi kan resetta senare)
                  const file = input.files?.[0];
                  if (!file) return;

                  try {
                    setUploading(true);
                    setUploadNotice({ kind: "info", text: `Laddar upp hero-bild… (bucket: ${bucket})` });

                    const url = await uploadOne(file);
                    onChange({ ...media, heroImageUrl: url });

                    setUploadNotice({ kind: "success", text: "Hero-bild uppladdad ✅" });
                  } catch (err: any) {
                    setUploadNotice({
                      kind: "error",
                      text: `Uppladdning misslyckades: ${err?.message ?? "Okänt fel"}`,
                    });
                  } finally {
                    setUploading(false);
                    input.value = ""; // ✅ safe reset
                  }
                }}
              />
            </label>
            <div className="text-xs text-gray-500">Bucket: {bucket}</div>
          </div>
        </div>

        <div className="rounded-2xl border bg-gray-50 p-3">
          <div className="text-xs text-gray-600 mb-2">Förhandsvisning</div>
          <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-white">
            {media.heroImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media.heroImageUrl} alt="Hero" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
                Ingen hero-bild vald
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-700">Hero-video (URL)</label>
          <input
            className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2"
            value={media.heroVideoUrl ?? ""}
            onChange={(e) => onChange({ ...media, heroVideoUrl: e.target.value })}
            placeholder="https://... (youtube/vimeo/mp4)"
          />
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-700">Galleri</div>
              <div className="text-xs text-gray-500">Lägg flera bilder.</div>
            </div>

            <label className="inline-flex cursor-pointer rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50">
              {uploading ? "Laddar upp…" : "Ladda upp galleri"}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                disabled={uploading}
                onChange={async (e) => {
                  const input = e.currentTarget; // ✅ spara direkt
                  const files = Array.from(input.files ?? []);
                  if (!files.length) return;

                  try {
                    setUploading(true);
                    setUploadNotice({ kind: "info", text: `Laddar upp ${files.length} bild(er)… (bucket: ${bucket})` });

                    const current = media.gallery ?? [];
                    const next = [...current];

                    for (const f of files) {
                      const url = await uploadOne(f);
                      next.push({ url });
                    }

                    onChange({ ...media, gallery: next });
                    setUploadNotice({ kind: "success", text: "Galleri uppladdat ✅" });
                  } catch (err: any) {
                    setUploadNotice({
                      kind: "error",
                      text: `Uppladdning misslyckades: ${err?.message ?? "Okänt fel"}`,
                    });
                  } finally {
                    setUploading(false);
                    input.value = ""; // ✅ safe reset
                  }
                }}
              />
            </label>
          </div>

          <div className="mt-3 rounded-xl border bg-white p-3">
            {media.gallery?.length ? (
              <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4">
                {media.gallery.map((g: any, idx: number) => (
                  <div key={`${g.url}-${idx}`} className="relative overflow-hidden rounded-lg border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.url} alt={g.alt ?? ""} className="h-24 w-full object-cover" />
                    <button
                      type="button"
                      className="absolute right-1 top-1 rounded bg-white/90 px-2 py-1 text-[11px]"
                      onClick={() => {
                        const next = (media.gallery ?? []).filter((_: any, i: number) => i !== idx);
                        onChange({ ...media, gallery: next });
                      }}
                    >
                      Ta bort
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">Inga galleri-bilder än.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
