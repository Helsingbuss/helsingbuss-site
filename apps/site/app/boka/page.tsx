export default async function BokaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const val = (k: string) => {
    const v = sp?.[k];
    return Array.isArray(v) ? v[0] : v ?? "";
  };

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "40px 16px" }}>
      <h1 style={{ fontSize: 28, margin: 0 }}>Boka buss</h1>
      <p style={{ opacity: 0.8 }}>
        Detta är en placeholder-sida. Nästa steg är att koppla detta till din riktiga offertförfrågan/portal.
      </p>

      <div style={{ marginTop: 18, padding: 16, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12 }}>
        <div><b>Datum:</b> {val("date")}</div>
        <div><b>Från:</b> {val("from")}</div>
        <div><b>Till:</b> {val("to")}</div>
        <div><b>Antal:</b> {val("people")}</div>
      </div>
    </main>
  );
}
