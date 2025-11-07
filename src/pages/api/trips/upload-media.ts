// src/pages/api/trips/upload-media.ts
import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "node:fs/promises";
import path from "node:path";
import * as admin from "@/lib/supabaseAdmin";

const supabase =
  (admin as any).supabaseAdmin || (admin as any).supabase || (admin as any).default;

export const config = {
  api: { bodyParser: false }, // required for formidable
};

type ApiOk = { ok: true; file: { url: string; path: string } };
type ApiErr = { ok: false; error: string };
type ApiResp = ApiOk | ApiErr;

function setCORS(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

/** Parse multipart/form-data with formidable (typed to avoid implicit-any on Vercel) */
function parseForm(
  req: NextApiRequest
): Promise<{ fields: Record<string, any>; files: Record<string, any> }> {
  const form = formidable({
    multiples: false,
    maxFileSize: 10 * 1024 * 1024,
    keepExtensions: true,
  });
  return new Promise((resolve, reject) => {
    form.parse(req, (err: unknown, fields: any, files: any) =>
      err ? reject(err) : resolve({ fields, files })
    );
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResp>
) {
  setCORS(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { fields, files } = await parseForm(req);

    // file can come as File or File[]
    let f: any =
      files.file && Array.isArray(files.file) ? files.file[0] : files.file;
    if (!f) return res.status(400).json({ ok: false, error: "No file received" });

    // derive extension
    const original = String(f.originalFilename || "");
    const ext = (path.extname(original) || "").replace(/^\./, "") || "bin";

    // cover/gallery switch (defaults to cover)
    const kind = String(fields.kind || "cover").toLowerCase();
    const folder = kind === "gallery" ? "gallery" : "cover";

    const bucket = "trip-media"; // ensure this bucket exists in Supabase
    const key = `${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    // read tmp file to buffer and upload
    const buf = await fs.readFile(f.filepath);
    const contentType = String(f.mimetype || "application/octet-stream");

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(key, buf, { contentType, upsert: false });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(key);
    const url = pub?.publicUrl || "";

    if (!url) throw new Error("No public URL returned from storage");

    return res.status(200).json({ ok: true, file: { url, path: key } });
  } catch (e: any) {
    console.error("upload-media:", e?.message || e);
    return res
      .status(500)
      .json({ ok: false, error: e?.message || "Upload failed" });
  }
}
