// src/pages/test-form.tsx
import { useState } from "react";

export default function TestForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData(e.currentTarget);

    const payload = {
      customer_name: formData.get("customer_name"),
      customer_email: formData.get("customer_email"),
      customer_phone: formData.get("customer_phone"),
      passengers: Number(formData.get("passengers")),
      departure_place: formData.get("departure_place"),
      destination: formData.get("destination"),
      departure_date: formData.get("departure_date"),
      departure_time: formData.get("departure_time"),
      round_trip: formData.get("round_trip") === "on",
      notes: formData.get("notes"),
    };

    try {
      const res = await fetch("/api/offert/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload), // ✅ skickar payload nu
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`✅ Offerten skapades! ID: ${data.offerId}`);
      } else {
        setMessage(`❌ Fel: ${data.error || "Något gick fel"}`);
      }
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f4f0] p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow w-full max-w-md space-y-4"
      >
        <h1 className="text-xl font-bold">Skapa offert (Test)</h1>

        <input
          name="customer_name"
          placeholder="Namn"
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="email"
          name="customer_email"
          placeholder="E-post"
          className="w-full border p-2 rounded"
          required
        />
        <input
          name="customer_phone"
          placeholder="Telefon"
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="number"
          name="passengers"
          placeholder="Antal passagerare"
          className="w-full border p-2 rounded"
        />
        <input
          name="departure_place"
          placeholder="Avreseplats"
          className="w-full border p-2 rounded"
        />
        <input
          name="destination"
          placeholder="Destination"
          className="w-full border p-2 rounded"
        />
        <input
          type="date"
          name="departure_date"
          className="w-full border p-2 rounded"
        />
        <input
          type="time"
          name="departure_time"
          className="w-full border p-2 rounded"
        />

        <label className="flex items-center gap-2">
          <input type="checkbox" name="round_trip" /> Tur & retur
        </label>

        <textarea
          name="notes"
          placeholder="Övrig information"
          className="w-full border p-2 rounded"
        />

        <button
          type="submit"
          className="w-full bg-[#194C66] text-white py-2 rounded hover:bg-[#163b4d]"
          disabled={loading}
        >
          {loading ? "Skickar..." : "Skicka offert"}
        </button>

        {message && <p className="mt-4 text-sm">{message}</p>}
      </form>
    </div>
  );
}
