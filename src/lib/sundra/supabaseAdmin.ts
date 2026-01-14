// src/lib/sundra/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Mål:
 * - supabaseAdmin ska fungera både som client och som funktion:
 *   supabaseAdmin.from(...)
 *   supabaseAdmin().from(...)
 *
 * Då slipper vi jaga runt i alla filer och ändra anrop.
 */

let _client: SupabaseClient | null = null;

function getEnv(name: string) {
  const v = process.env[name];
  return v && String(v).trim() ? String(v).trim() : undefined;
}

function getClient(): SupabaseClient {
  if (_client) return _client;

  const url = getEnv("SUPABASE_URL") || getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey =
    getEnv("SUPABASE_SERVICE_ROLE_KEY") || getEnv("SUPABASE_SERVICE_KEY");

  if (!url) {
    throw new Error("SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL saknas i .env.local");
  }
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY saknas i .env.local (admin API)");
  }

  _client = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return _client;
}

type SupabaseAdmin = SupabaseClient & (() => SupabaseClient);

function makeCallableClient(): SupabaseAdmin {
  return new Proxy((() => getClient()) as any, {
    apply() {
      // supabaseAdmin()
      return getClient();
    },
    get(_target, prop) {
      if (prop === "__esModule") return true;
      // supabaseAdmin.from / rpc / storage / osv.
      return (getClient() as any)[prop];
    },
  }) as any;
}

/** Bakåtkompat: vissa filer använder _supabaseAdmin() och andra _supabaseAdmin.from */
export const _supabaseAdmin: SupabaseAdmin = makeCallableClient();

/** Samma beteende här (det var här din nya error kom ifrån) */
export const supabaseAdmin: SupabaseAdmin = makeCallableClient();

/** Valfritt “nytt sätt”: om du vill ha en ren client utan callable */
export function getSupabaseAdmin(): SupabaseClient {
  return getClient();
}
