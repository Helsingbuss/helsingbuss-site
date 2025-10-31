// src/pages/api/drivers/[id]/avatar.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// OBS! I v3 av formidable importeras funktion + typer så här:
import formidable, { File } from "formidable";
import type { Fields, Files } from "formidable";
import fs from "fs";

export const config = { api: { bodyParser: false } };

// Promisify: parse multipart/form-data
function parseForm(req: NextApiRequest): Promise<{ fields: Fields; files: Files }> {
  const form = formidable({ multiples: false });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })));
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { id } = req.query as { id?: string };
    if (!id) return res.status(400).json({ error: "Missing driver id" });

    const { files } = await parseForm(req);

    // Tillåt flera fältnamn som kan förekomma i formulär
    const anyFile = (files as any).file || (files as any).avatar || (files as any).photo;
    const f: File | undefined = Array.isArray(anyFile) ? anyFile[0] : anyFile;
    if (!f) return res.status(400).json({ error: "No file uploaded" });

    const filepath = (f as any).filepath ?? (f as any).path; // kompatibelt med olika formidable-versioner
    const buffer = await fs.promises.readFile(filepath);

    const ext = f.originalFilename?.split(".").pop()?.toLowerCase() || "jpg";
    const key = `drivers/${id}/avatar.${ext}`;

    // Ladda upp till Supabase Storage (bucket: "media" – ändra om du använder annan)
    const { error: upErr } = await supabaseAdmin.storage.from("media").upload(key, buffer, {
      upsert: true,
      contentType: f.mimetype || "application/octet-stream",
    });
    if (upErr) return res.status(500).json({ error: upErr.message });

    // Skapa signerad URL (1 vecka)
    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("media")
      .createSignedUrl(key, 60 * 60 * 24 * 7);
    if (signErr) return res.status(500).json({ error: signErr.message });

    return res.status(200).json({ ok: true, url: signed.signedUrl });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
