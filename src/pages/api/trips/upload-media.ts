// src/pages/api/trips/upload-media.ts
import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";

export const config = { api: { bodyParser: false } };

type Ok = { ok: true; url?: string | null; info?: string };
type Fail = { error: string };

// Minimal parser utan generiska typer (undviker Turbopack/TS-konflikter)
function parseForm(req: NextApiRequest): Promise<{ fields: any; files: any }> {
  const form = formidable({ multiples: false, keepExtensions: true });
  return new Promise((resolve, reject) => {
    form.parse(req, (err: any, fields: any, files: any) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Fail>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fields, files } = await parseForm(req);

    // Fält från formuläret (om du skickar med dem)
    const tripId: string | undefined =
      (Array.isArray(fields?.tripId) ? fields.tripId[0] : fields?.tripId) ?? undefined;
    const kind: "cover" | "gallery" =
      ((Array.isArray(fields?.kind) ? fields.kind[0] : fields?.kind) as any) || "gallery";
    const hint: string | undefined =
      (Array.isArray(fields?.hint) ? fields.hint[0] : fields?.hint) ?? undefined;

    // Hämta filobjektet oavsett om formidable ger array eller ej
    const rawFile: any =
      (files as any)?.file?.[0] ??
      (files as any)?.file ??
      (Object.values(files || {})[0] as any);

    if (!rawFile) {
      return res.status(400).json({ error: "Ingen fil mottagen" });
    }

    // TODO: Lagra filen i t.ex. Supabase Storage och returnera en publik URL.
    // Exempel (avaktiverat för att hålla bygget enkelt):
    //
    // import { promises as fs } from "fs";
    // import { createClient } from "@supabase/supabase-js";
    // const bytes = await fs.readFile(rawFile.filepath);
    // const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    // const path = `trips/${tripId ?? "misc"}/${Date.now()}-${rawFile.originalFilename}`;
    // const { data, error } = await supabase.storage.from("trip-media").upload(path, bytes, { contentType: rawFile.mimetype });
    // if (error) throw error;
    // const { data: pub } = supabase.storage.from("trip-media").getPublicUrl(path);
    // return res.status(200).json({ ok: true, url: pub.publicUrl });

    // Stubbsvar så att bygg/deploy går igenom även innan lagring kopplats upp:
    return res.status(200).json({
      ok: true,
      url: null,
      info: `Mottog fil '${rawFile.originalFilename}' (${kind}${hint ? `, ${hint}` : ""}) för tripId=${tripId ?? "—"} (stub)`,
    });
  } catch (e: any) {
    console.error("upload-media error:", e?.message || e);
    return res.status(500).json({ error: "Uppladdning misslyckades" });
  }
}
