// pages/api/trips/upload-media.ts
import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: false } };

const BUCKET = "trip-media";

type ApiResp = { ok: true; url: string } | { ok: false; error: string };

function parseForm(req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  // keepExtensions så filen får behålla .jpg/.png osv.
  const form = formidable({ multiples: false, maxFileSize: 10 * 1024 * 1024, keepExtensions: true });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })));
  });
}

function getSupabase() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "";

  const service =
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_KEY ||
    "";

  if (!url || !service) throw new Error("Supabase env saknas (URL eller KEY).");
  return createClient(url, service, { auth: { persistSession: false } });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResp>) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const { fields, files } = await parseForm(req);

    // Hämta filen oavsett nyckel: 'file' eller första filen i objektet
    let file = (files.file as File) || (Object.values(files)[0] as File);
    // Vissa versioner ger array; ta i så fall första elementet
    if (Array.isArray(file)) file = file[0];

    const filepath = (file as any)?.filepath || (file as any)?.file?.filepath;

    if (!filepath) {
      // Hjälp-debug: lista nycklar som faktiskt kom in
      const keys = Object.keys(files || {});
      return res
        .status(400)
        .json({ ok: false, error: `Ingen fil mottagen. Keys: ${keys.length ? keys.join(", ") : "—"}` });
    }

    const kind = (fields.kind as string) || "cover";
    const supabase = getSupabase();

    // 1) Bucket finns? Annars skapa (public)
    const { data: buckets, error: lbErr } = await supabase.storage.listBuckets();
    if (lbErr) throw lbErr;
    const exists = buckets?.some((b) => b.name === BUCKET);
    if (!exists) {
      const { error: cbErr } = await supabase.storage.createBucket(BUCKET, { public: true });
      if (cbErr) return res.status(500).json({ ok: false, error: `Kunde inte skapa bucket: ${cbErr.message}` });
    }

    // 2) Ladda upp
    const buffer = await fs.promises.readFile(filepath);
    const ext = path.extname((file as any).originalFilename || "") || ".jpg";
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    const objectPath = `${kind}/${filename}`;

    const { error: upErr } = await supabase.storage.from(BUCKET).upload(objectPath, buffer, {
      contentType: (file as any).mimetype || "application/octet-stream",
      upsert: false,
    });
    if (upErr) return res.status(500).json({ ok: false, error: `Upload misslyckades: ${upErr.message}` });

    // 3) Public URL
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
    if (!pub?.publicUrl) return res.status(500).json({ ok: false, error: "Kunde inte skapa public URL" });

    return res.status(200).json({ ok: true, url: pub.publicUrl });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "Tekniskt fel vid uppladdning" });
  }
}
