// src/lib/offerNumber.ts
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * HB{YY}{NNN} med 3-siffrig löpdel. Första ska bli HB25 007.
 * Vi sätter baseline på 6, så första next blir 7.
 */
export async function nextOfferNumberHB3(supabase: SupabaseClient): Promise<string> {
  const yy = new Date().getFullYear().toString().slice(-2); // "25"
  const prefix = `HB${yy}`; // "HB25"

  // Hämta senaste poster som matchar årets HB-prefix
  const { data } = await supabase
    .from("offers")
    .select("offer_number, created_at")
    .ilike("offer_number", `${prefix}%`)
    .order("created_at", { ascending: false })
    .limit(200);

  // max startar på 6 -> next = 7 (=> HB25007)
  let maxSeq = 6;

  for (const r of data || []) {
    const raw = String((r as any).offer_number || "").replace(/\s+/g, "");
    // matcha exakt HB{YY}{NNN} (3-siffrig)
    const m = raw.match(/^HB(\d{2})(\d{3})$/i);
    if (!m) continue;
    const yyRow = m[1];
    const seq = parseInt(m[2], 10);
    if (yyRow === yy && Number.isFinite(seq)) {
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  const next = maxSeq + 1; // minst 7
  return `${prefix}${String(next).padStart(3, "0")}`;
}
