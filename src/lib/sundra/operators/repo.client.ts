// src/lib/sundra/operators/repo.client.ts

export type OperatorRecord = {
  id: string;
  name: string;
  short_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  logo_url: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
};

export type CreateOperatorInput = {
  name: string;
  short_name?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website?: string | null;
  logo_url?: string | null;
  notes?: string | null;
  is_active?: boolean;
};

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await res.text();

  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      const t = text.trim();
      const isHtml = t.startsWith("<!DOCTYPE") || t.startsWith("<html");
      throw new Error(
        isHtml
          ? `API svarade med HTML (troligen 404/redirect/serverfel). Kolla endpoint: ${url}`
          : `API svarade med ogiltig JSON: ${url}`
      );
    }
  }

  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  return data as T;
}

function qs(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v && v.trim()) sp.set(k, v);
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function normalizeArray<T>(raw: any, key?: string): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (key && raw && Array.isArray(raw[key])) return raw[key] as T[];
  if (raw && Array.isArray(raw.data)) return raw.data as T[];
  return [];
}

function normalizeOne<T>(raw: any, key?: string): T {
  if (raw && key && raw[key]) return raw[key] as T;
  if (raw && raw.data) return raw.data as T;
  return raw as T;
}

export const operatorRepo = {
  async listOperators(params?: { q?: string; active?: "true" | "false" | "all" }) {
    const raw = await jsonFetch<any>(
      `/api/sundra/admin/operators${qs({
        q: params?.q,
        active: params?.active && params.active !== "all" ? params.active : undefined,
      })}`
    );

    return normalizeArray<OperatorRecord>(raw, "operators");
  },

  async createOperator(input: CreateOperatorInput) {
    const raw = await jsonFetch<any>(`/api/sundra/admin/operators`, {
      method: "POST",
      body: JSON.stringify(input),
    });

    return normalizeOne<OperatorRecord>(raw, "operator");
  },

  async updateOperator(id: string, patch: Partial<CreateOperatorInput>) {
    const raw = await jsonFetch<any>(`/api/sundra/admin/operators/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });

    return normalizeOne<OperatorRecord>(raw, "operator");
  },

  async deleteOperator(id: string) {
    const raw = await jsonFetch<any>(`/api/sundra/admin/operators/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    return { ok: raw?.ok ?? true };
  },
};
