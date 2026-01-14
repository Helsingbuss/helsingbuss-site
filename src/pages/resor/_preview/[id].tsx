import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/sundra/public/PublicLayout";
import { getTrip } from "@/lib/sundra/trips/store";
import type { TripDraft } from "@/lib/sundra/trips/types";
import { TripPreviewTemplate } from "@/components/sundra/public/TripPreviewTemplate";

export default function TripPreviewPage() {
  const router = useRouter();
  const id = String(router.query.id || "");
  const [trip, setTrip] = useState<TripDraft | null>(null);

  useEffect(() => {
    if (!id) return;
    setTrip(getTrip(id));
  }, [id]);

  return (
    <PublicLayout>
      <Head>
        <title>Förhandsgranska resa | Sundra</title>
      </Head>

      {trip ? (
        <TripPreviewTemplate trip={trip} />
      ) : (
        <div className="mx-auto max-w-[1200px] px-4 py-10 text-sm text-gray-700">
          Laddar förhandsgranskning…
        </div>
      )}
    </PublicLayout>
  );
}
