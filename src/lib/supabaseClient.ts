// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// Läs publika nycklar (för browser/klientkod)
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL ?? // fallback om någon satt denna
  "";

const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_KEY ?? // din tidigare variabel
  process.env.SUPABASE_ANON_KEY ?? // ev. alias
  "";

if (!url) {
  console.warn("[supabaseClient] NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL saknas");
}
if (!anonKey) {
  console.warn("[supabaseClient] Anon key saknas (NEXT_PUBLIC_SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_KEY)");
}

// Klientinstans för *frontend* (OBS: använd supabaseAdmin på serversidan!)
export const client = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Namngiven export för bakåtkompatibilitet
export const supabase = client;

// Default-export så `import supabase from "@/lib/supabaseClient"` också funkar
export default client;
