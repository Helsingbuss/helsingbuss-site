// src/pages/api/drivers/[id]/avatar.ts
import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "node:fs/promises";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const config = { api: { bodyParser: false } };

// Skapa bucket om den saknas (public)
async function ensureBucket(name: string) {
  try {
    await supabaseAdmin.storage.createBucket(name, { public: true });
  } catch {
    // ignorerar "already exists"
  }
}

function extFromMime(m?: string | null) {
  if (!m) return "bin";
  if (m.includes("png")) return "png";
  if (m.includes("jpg") || m.includes("jpeg")) return "jpg";
  if (m.includes("webp")) return "webp";
  return "bin";
}

// Promisify: parse multipart/form-data
function parseForm(req: NextApiRequest): Promise<{ fields: any; files: any }> {
  const form = formidable({ multiples: false, keepExtensions: true });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, flds, fls) => (err ? reject(err) : resolve({ fields: flds as any, files: fls as any })));
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { id } = req.query as { id?: string };
  if (!id) return res.status(400).json({ error: "Saknar driver-id" });

  try {
    await ensureBucket("drivers");

    const { files } = await parseForm(req);
    const avatar: any = files?.photo;
    if (!avatar) return res.status(400).json({ error: "Saknar bild (fält: photo)" });

    const filepath = avatar.filepath as string;
    const buf = await fs.readFile(filepath);

    const mime = (avatar.mimetype as string) || "application/octet-stream";
    const ext = extFromMime(mime);
    const storagePath = `avatars/${id}.${ext}`;

    // Uppladdning till storage (service_role -> ingen RLS-block)
    const up = await supabaseAdmin.storage.from("drivers").upload(storagePath, buf, {
      contentType: mime,
      upsert: true,
    });
    if (up.error) return res.status(500).json({ error: up.error.message });

    // Publik URL
    const { data: pub } = supabaseAdmin.storage.from("drivers").getPublicUrl(storagePath);
    const url = pub?.publicUrl ?? null;

    // Försök spara url i drivers.photo_url (tolerant)
    try {
      const upd = await supabaseAdmin
        .from("drivers")
        .update({ photo_url: url, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (upd.error) {
        // logga men stoppa inte svaret – bilden är redan uppladdad
        console.warn("drivers.photo_url update warning:", upd.error.message);
      }
    } catch (e: any) {
      console.warn("drivers.photo_url update skipped:", e?.message || e);
    }

    return res.status(200).json({ ok: true, path: storagePath, url });
  } catch (e: any) {
    console.error("/api/drivers/[id]/avatar error:", e?.message || e);
    return res.status(500).json({ error: e?.message || "Serverfel" });
  }
}
