// src/lib/sundra/departures/repo.client.ts

export type DepartureStatus = "open" | "few" | "sold_out" | "cancelled";

export type DepartureOperator = {
  id: string;
  name: string;
  short_name?: string | null;
  logo_url?: string | null;
};

export type DepartureRecord = {
  id: string;
  trip_id: string;

  // vi använder depart_date + dep_time i DB
  depart_date: string; // YYYY-MM-DD
  dep_time: string | null; // HH:MM:SS (eller null)

  seats_total: number;
  seats_reserved: number;
  status: DepartureStatus;

  operator_id: string | null;
  operator_name: string | null;

  // Servern skickar alltid tillbaka detta för UI
  operator?: DepartureOperator | null;
};

type ListDeparturesResponse = { departures: DepartureRecord[] };
type OneDepartureResponse = { departure: DepartureRecord };

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

  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  return data as T;
}

export const departureRepo = {
  async listByTrip(tripId: string) {
    const data = await jsonFetch<ListDeparturesResponse>(
      `/api/sundra/admin/trips/${encodeURIComponent(tripId)}/departures`,
      { method: "GET" }
    );
    return data?.departures ?? [];
  },

  async create(tripId: string, input: Partial<DepartureRecord>) {
    const data = await jsonFetch<OneDepartureResponse>(
      `/api/sundra/admin/trips/${encodeURIComponent(tripId)}/departures`,
      { method: "POST", body: JSON.stringify(input) }
    );
    return data.departure;
  },

  async update(depId: string, patch: Partial<DepartureRecord>) {
    const data = await jsonFetch<OneDepartureResponse>(
      `/api/sundra/admin/departures/${encodeURIComponent(depId)}`,
      { method: "PUT", body: JSON.stringify(patch) }
    );
    return data.departure;
  },

  async remove(depId: string) {
    return jsonFetch<{ ok: boolean }>(
      `/api/sundra/admin/departures/${encodeURIComponent(depId)}`,
      { method: "DELETE" }
    );
  },
};
