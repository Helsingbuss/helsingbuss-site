// src/lib/pushNewOffer.ts
import { Expo } from "expo-server-sdk";
import admin from "@/lib/supabaseAdmin";

const expo = new Expo();

type NewOffer = {
  id: string;
  departure_place: string | null;
  destination: string | null;
  passengers: number | null;
};

export async function sendNewOfferNotification(offer: NewOffer) {
  // Hämta alla användare som vill ha notiser och har token
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("expo_push_token")
    .eq("notify_new_offer", true)
    .not("expo_push_token", "is", null);

  if (error || !profiles?.length) {
    console.log("Inga profiler att skicka notis till", error?.message);
    return;
  }

  const messages = profiles
    .filter((p) => Expo.isExpoPushToken(p.expo_push_token))
    .map((p) => ({
      to: p.expo_push_token as string,
      sound: "default" as const,
      title: "Ny offertförfrågan",
      body: `${offer.departure_place ?? "Okänd start"} → ${
        offer.destination ?? "Okänt mål"
      } • ${offer.passengers ?? "?"} pax`,
      data: { offerId: offer.id },
    }));

  if (messages.length === 0) return;

  try {
    await expo.sendPushNotificationsAsync(messages);
  } catch (err) {
    console.error("Kunde inte skicka push-notiser:", err);
  }
}
