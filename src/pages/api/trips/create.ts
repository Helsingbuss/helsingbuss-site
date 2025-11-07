// src/pages/api/trips/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

/** --- Supabase admin (service role krävs) --- */
function getSupabase() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY || // ditt namn
    "";

  if (!url || !key) {
    throw new Error("Supabase URL eller SERVICE ROLE KEY saknas (.env.local)");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

/** --- Helpers --- */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[\s_/]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function ensureUniqueSlug(
  base: string,
  supabase: ReturnType<typeof getSupabase>
) {
  let slug = base || "trip";
  let n = 1;
  // loopa tills slug inte finns
  // head:true returnerar bara count
  while (true) {
    const { count, error } = await supabase
      .from("trips")
      .select("id", { count: "exact", head: true })
      .eq("slug", slug);

    if (error) throw error;
    if (!count || count === 0) return slug;

    n += 1;
    slug = `${base}-${n}`;
  }
}

/** Försöker insert, och om felmeddelandet säger att en kolumn inte finns
 * tar vi bort den ur row och försöker igen (max 5 gånger).
 */
async function insertWithColumnFallback(
  supabase: ReturnType<typeof getSupabase>,
  row: Record<string, any>
) {
  const MAX_RETRIES = 5;
  let payload = { ...row };
  for (let i = 0; i <= MAX_RETRIES; i++) {
    const { data, error } = await supabase
      .from("trips")
      .insert(payload)
      .select()
      .single();
    if (!error) return { data };

    // matcha t.ex. 'column "summary" does not exist'
    const m = /column\s+"?([a-zA-Z0-9_]+)"?\s+does\s+not\s+exist/i.exec(
      error.message || ""
    );
    if (m && payload[m[1]] !== undefined) {
      // ta bort problemkolumn och prova igen
      delete (payload as any)[m[1]];
      continue;
    }

    // annat fel – returnera
    return { error };
  }
  return {
    error: { message: "Could not insert: too many missing columns" } as any,
  };
}

/** --- Handler --- */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const supabase = getSupabase();
    const b = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    // Required
    const title = (b.title ?? "").toString().trim();
    const hero_image = (b.hero_image ?? "").toString().trim();
    if (!title)  return res.status(400).json({ ok: false, error: "Ange titel." });
    if (!hero_image) return res.status(400).json({ ok: false, error: "Ladda upp eller ange en bild." });

    // Optional / cast
    const subtitle     = (b.subtitle ?? null) || null;
    const trip_kind    = (b.trip_kind ?? null) || null;
    const badge        = (b.badge ?? null) || null;
    const ribbon       = (b.ribbon ?? null) || null;
    const city         = (b.city ?? null) || null;
    const country      = (b.country ?? null) || null;
    const external_url = (b.external_url ?? null) || null;
    const summary      = (b.summary ?? null) || null;
    const published    = !!b.published;

    let price_from: number | null = null;
    if (b.price_from !== null && b.price_from !== undefined && b.price_from !== "") {
      const n = Number(b.price_from);
      price_from = Number.isFinite(n) ? Math.trunc(n) : null;
    }

    let year: number | null = null;
    if (b.year !== null && b.year !== undefined && b.year !== "") {
      const y = Number(b.year);
      year = Number.isInteger(y) ? y : null;
    }

    const lines       = b.lines ?? null;       // Json
    const departures  = b.departures ?? null;  // Json

    // slug (unik)
    const baseSlug = slugify(title);
    const slug = await ensureUniqueSlug(baseSlug, supabase);

    // bygg row – med alla fält vi KAN ha
    const row: Record<string, any> = {
      title,
      slug,
      subtitle,
      trip_kind,
      badge,
      ribbon,
      city,
      country,
      price_from,
      hero_image,
      published,
      external_url,
      year,
      summary,
      lines,
      departures,
    };

    // ta bort undefined (städ)
    Object.keys(row).forEach((k) => row[k] === undefined && delete row[k]);

    // insert (med fallback om någon kolumn saknas)
    const { data, error } = await insertWithColumnFallback(supabase, row);
    if (error) return res.status(400).json({ ok: false, error: error.message || error });

    return res.status(200).json({ ok: true, trip: data });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "Tekniskt fel" });
  }
}
