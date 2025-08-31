// src/pages/create-offer-test.tsx
import { useState } from "react";

export default function CreateOfferTest() {
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    passengers: "",
    departure_place: "",
    destination: "",
    departure_date: "",
    departure_time: "",
    notes: "",
  });

  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("/api/create-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error(err);
      setResponse({ error: "Något gick fel." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold mb-4">Testa skapa offert</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-md space-y-4"
      >
        <input
          name="customer_name"
          placeholder="Kundnamn"
          value={form.customer_name}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <input
          name="customer_email"
          placeholder="E-post"
          type="email"
          value={form.customer_email}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <input
          name="customer_phone"
          placeholder="Telefon"
          value={form.customer_phone}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <input
          name="passengers"
          placeholder="Antal passagerare"
          type="number"
          value={form.passengers}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <input
          name="departure_place"
          placeholder="Avreseort"
          value={form.departure_place}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <input
          name="destination"
          placeholder="Destination"
          value={form.destination}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <input
          name="departure_date"
          placeholder="Avresedatum"
          type="date"
          value={form.departure_date}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <input
          name="departure_time"
          placeholder="Avresetid"
          type="time"
          value={form.departure_time}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <textarea
          name="notes"
          placeholder="Övrig information"
          value={form.notes}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#194C66] text-white py-2 rounded hover:bg-[#163b4d]"
        >
          {loading ? "Skickar..." : "Skicka offert"}
        </button>
      </form>

      {response && (
        <div className="mt-6 bg-white p-4 rounded shadow w-full max-w-md text-sm">
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
