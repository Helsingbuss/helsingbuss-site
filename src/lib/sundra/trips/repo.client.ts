// src/lib/sundra/trips/repo.client.ts
import type { TripRecord, TripStatus, TripType } from "./types";

/** ------------ Types: Operatörer ------------- */
export type OperatorRecord = {
  id: string;
  name: string;
  short_name?: string | null;
  is_active?: boolean | null;
  logo_url?: string | null;
};

/** ------------ Types: Avgångar ------------- */
export type DepartureRecord = {
  id: string;
  trip_id: string;

  depart_date: string; // YYYY-MM-DD
  dep_time: string | null; // HH:MM eller null

  // "vem som kör" – vi stödjer både id + namn (för enkelhet)
  operator_id?: string | null;
  operator_name?: string | null;

  // legacy/extra fält som kan användas (du har kolumnen line_name)
  line_name?: string | null;

  // hållplatser som jsonb (vi sparar som string[] tills vi kopplar register)
  stops?: any[] | null;

  seats_total: number | null;
  seats_reserved: number | null;

  status?: "open" | "few" | "sold_out" | "cancelled" | string;

  created_at?: string | null;
  updated_at?: string | null;
};

export type CreateDepartureInput = {
  depart_date: string;
  dep_time?: string | null;

  operator_id?: string | null;
  operator_name?: string | null;

  line_name?: string | null;
  stops?: any[] | null;

  seats_total?: number | null;
};

/** ------------ Helpers ------------- */
async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  }

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

/** ------------ Repo ------------- */
export const tripRepo = {
  async listTrips(params?: { q?: string; status?: TripStatus | "all"; type?: TripType | "all" }) {
    const raw = await jsonFetch<any>(
      `/api/sundra/admin/trips${qs({
        q: params?.q,
        status: params?.status && params.status !== "all" ? params.status : undefined,
        type: params?.type && params.type !== "all" ? params.type : undefined,
      })}`
    );
    return normalizeArray<TripRecord>(raw, "trips");
  },

  async createDraftTrip(input: { title: string; type: TripType }) {
    const raw = await jsonFetch<any>(`/api/sundra/admin/trips`, {
      method: "POST",
      body: JSON.stringify(input),
    });
    return normalizeOne<TripRecord>(raw, "trip");
  },

  async getTripById(id: string) {
    const raw = await jsonFetch<any>(`/api/sundra/admin/trips/${encodeURIComponent(id)}`, { method: "GET" });
    return normalizeOne<TripRecord>(raw, "trip");
  },

  async updateTrip(id: string, patch: Partial<TripRecord>) {
    const raw = await jsonFetch<any>(`/api/sundra/admin/trips/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    return normalizeOne<TripRecord>(raw, "trip");
  },

  async upsertTrip(trip: TripRecord) {
    const raw = await jsonFetch<any>(`/api/sundra/admin/trips/${encodeURIComponent(trip.id)}`, {
      method: "PUT",
      body: JSON.stringify(trip),
    });
    return normalizeOne<TripRecord>(raw, "trip");
  },

  // ✅ BACKWARDS COMPAT: status-wrappers (så dina sidor funkar utan ändringar)
  async setStatus(id: string, status: TripStatus) {
    return tripRepo.updateTrip(id, { status } as any);
  },

  async publishTrip(id: string) {
    // vi använder lowercase här eftersom flera av dina andra moduler kör "published"
    return tripRepo.setStatus(id, "published" as TripStatus);
  },

  async archiveTrip(id: string) {
    return tripRepo.setStatus(id, "archived" as TripStatus);
  },

  async unpublishTripToDraft(id: string) {
    return tripRepo.setStatus(id, "draft" as TripStatus);
  },

  // ---------------- OPERATÖRER ----------------
  async listOperators(): Promise<OperatorRecord[]> {
    const raw = await jsonFetch<any>(`/api/sundra/admin/operators`, { method: "GET" });
    return normalizeArray<OperatorRecord>(raw, "operators");
  },

  // ---------------- AVGÅNGAR ----------------
  async listDepartures(tripId: string): Promise<DepartureRecord[]> {
    const raw = await jsonFetch<any>(`/api/sundra/admin/trips/${encodeURIComponent(tripId)}/departures`, {
      method: "GET",
    });
    return normalizeArray<DepartureRecord>(raw, "departures");
  },

  async createDeparture(tripId: string, input: CreateDepartureInput): Promise<DepartureRecord> {
    const raw = await jsonFetch<any>(`/api/sundra/admin/trips/${encodeURIComponent(tripId)}/departures`, {
      method: "POST",
      body: JSON.stringify(input),
    });
    return normalizeOne<DepartureRecord>(raw, "departure");
  },

  async updateDeparture(depId: string, patch: Partial<CreateDepartureInput>): Promise<DepartureRecord> {
    const raw = await jsonFetch<any>(`/api/sundra/admin/departures/${encodeURIComponent(depId)}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    return normalizeOne<DepartureRecord>(raw, "departure");
  },

  async deleteDeparture(depId: string): Promise<{ ok: boolean }> {
    const raw = await jsonFetch<any>(`/api/sundra/admin/departures/${encodeURIComponent(depId)}`, {
      method: "DELETE",
    });
    return { ok: raw?.ok ?? true };
  },
};
