// src/pages/offert/test-form.tsx
import { useState } from "react";

export default function TestForm() {
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    notes: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const createOffer = async () => {
    const res = await fetch("/api/offert/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setMessage(JSON.stringify(data, null, 2));
  };

  const updateStatus = async (status: string) => {
    const res = await fetch("/api/offert/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offer_number: "HB25007", // testa med befintlig offert i databasen
        customer_email: form.customer_email,
        status,
      }),
    });
    const data = await res.json();
    setMessage(JSON.stringify(data, null, 2));
  };

  return (
    <div className="p-8 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Testa Offert API</h1>

      <input
        name="customer_name"
        placeholder="Namn"
        value={form.customer_name}
        onChange={handleChange}
        className="border p-2 w-full rounded"
      />
      <input
        name="customer_email"
        placeholder="Email"
        value={form.customer_email}
        onChange={handleChange}
        className="border p-2 w-full rounded"
      />
      <input
        name="customer_phone"
        placeholder="Telefon"
        value={form.customer_phone}
        onChange={handleChange}
        className="border p-2 w-full rounded"
      />
      <textarea
        name="notes"
        placeholder="Meddelande"
        value={form.notes}
        onChange={handleChange}
        className="border p-2 w-full rounded"
      />

      <button
        onClick={createOffer}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Skapa offert
      </button>

      <div className="flex gap-2">
        <button
          onClick={() => updateStatus("besvarad")}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          Sätt till Besvarad
        </button>
        <button
          onClick={() => updateStatus("godkand")}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Sätt till Godkänd
        </button>
        <button
          onClick={() => updateStatus("makulerad")}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Sätt till Makulerad
        </button>
      </div>

      {message && (
        <pre className="bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap">
          {message}
        </pre>
      )}
    </div>
  );
}
