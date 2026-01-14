import Link from "next/link";
import { TripRecord } from "@/lib/sundra/trips/types";
import { tripTitleForHeader } from "./editorUtils";

export function TripEditorHeader({
  trip,
  loading,
  previewHref,
  liveHref,
}: {
  trip: TripRecord | null;
  loading: boolean;
  previewHref: string;
  liveHref: string;
}) {
  const isPublished = String((trip as any)?.status ?? "").toLowerCase() === "published";

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          {tripTitleForHeader(trip, loading)}
        </h1>
        <div className="mt-1 text-sm text-gray-600">
          Utkast → Förhandsgranska → Publicera → Arkivera
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/admin/sundra/resor"
          className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
        >
          Till listan
        </Link>

        {trip ? (
          <Link
            href={previewHref}
            target="_blank"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
            style={{ background: "var(--hb-accent)" }}
          >
            Förhandsgranska
          </Link>
        ) : null}

        {isPublished ? (
          <Link
            href={liveHref}
            target="_blank"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
            style={{ background: "var(--hb-primary)" }}
          >
            Öppna live
          </Link>
        ) : null}
      </div>
    </div>
  );
}
