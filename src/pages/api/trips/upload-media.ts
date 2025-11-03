// src/pages/api/trips/upload-media.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";
import formidable, { File as FormFile } from "formidable";
import { promises as fs } from "fs";
import path from "path";

// Inaktivera bodyParser så formidable kan läsa multipart
export const config = { api: { bodyParser: false } };

// samma fallback som övriga
const supabase =
  // @ts-ignore
  (admin as any).supabaseAdmin ||
  // @ts-ignore
  (admin as any).supabase ||
  // @ts-ignore
  (admin as any).default;

const BUCKET = "trips";

function safeExt(mime: string, filename?: string) {
  const lower = (filename || "").toLowerCase();
  const m = lower.match(/\.(png|jpg|jpeg|webp|gif)$/i);
  if (m) return m[1].toLowerCase();
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "jpg";
}
function ymd() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const form = formidable({ multiples: false });
    const [fields, files] = await form.parse(req);

    const file = files.file as FormFile | undefined;
    const kind = (fields.kind?.[0] || "gallery") as "cover" | "gallery";
    const hint = (fields.hint?.[0] || "misc") as string;

    if (!file) return res.status(400).json({ ok: false, error: "Ingen fil i formuläret." });

    const filepath = file.filepath;
    const mime = (file.mimetype as string) || "application/octet-stream";
    const ext = safeExt(mime, file.originalFilename || undefined);

    const key = `${kind === "cover" ? "covers" : "gallery"}/${hint}/${ymd()}/${Date.now()}.${ext}`;

    const buf = await fs.readFile(filepath);

    const up = await supabase.storage.from(BUCKET).upload(key, buf, {
      contentType: mime,
      upsert: true,
      cacheControl: "3600",
    });

    if (up.error) {
      console.error("upload error:", up.error);
      return res.status(500).json({ ok: false, error: up.error.message });
    }

    // Förhandsvisa via signed URL (1h), funkar även i privat bucket
    const signed = await supabase.storage.from(BUCKET).createSignedUrl(key, 3600);
    const url = signed.data?.signedUrl || null;

    return res.status(200).json({ ok: true, path: key, url });
  } catch (e: any) {
    console.error("/api/trips/upload-media error:", e?.message || e);
    return res.status(500).json({ ok: false, error: e?.message || "Serverfel" });
  }
}
