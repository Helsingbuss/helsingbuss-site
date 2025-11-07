/* Helsingbuss Trips Widget – FULL */
(function () {
  function $(sel) { return document.querySelector(sel); }
  function css(el, styles) { Object.assign(el.style, styles || {}); return el; }

  // ---------- Badge helpers ----------
  function badgeAutoColors(txt) {
    const s = String(txt || "").toLowerCase();
    if (/ny(het)?/.test(s)) return { bg: "#10b981", fg: "#ffffff" };       // Nyhet → grön
    if (/rabatt|kampanj|rea/.test(s)) return { bg: "#ef4444", fg: "#ffffff" }; // Kampanj → röd
    if (/sista|limited|slut/.test(s)) return { bg: "#f59e0b", fg: "#111827" }; // Varning → amber
    return { bg: "#3b82f6", fg: "#ffffff" }; // default blå
  }
  // Allow "Text|#bg|#fg"
  function parseBadgeSpec(raw) {
    if (!raw) return null;
    const parts = String(raw).split("|").map(s => s.trim()).filter(Boolean);
    if (!parts.length) return null;
    const text = parts[0];
    let bg, fg;
    if (parts[1] && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(parts[1])) bg = parts[1];
    if (parts[2] && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(parts[2])) fg = parts[2];
    const auto = badgeAutoColors(text);
    return { text, bg: bg || auto.bg, fg: fg || auto.fg };
  }

  function renderTrips(el, items, cols, linkbase) {
    el.innerHTML = "";
    css(el, {
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`,
      gap: "16px",
      alignItems: "stretch",
    });

    items.forEach((t) => {
      // Länk: extern_url > href > /trip/:id
      var href = t.external_url || t.href || ((linkbase || "/trip/").replace(/\/+$/, "/") + (t.id || ""));

      const card = document.createElement(href ? "a" : "div");
      if (href) { card.href = href; card.target = "_self"; card.rel = "noopener"; }
      card.style.textDecoration = "none";
      card.style.color = "inherit";

      const wrap = document.createElement("div");
      css(wrap, {
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "16px",
        boxShadow: "0 1px 6px rgba(0,0,0,.06)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        transition: "box-shadow .2s ease",
      });
      card.addEventListener("mouseenter", () => wrap.style.boxShadow = "0 6px 20px rgba(0,0,0,.12)");
      card.addEventListener("mouseleave", () => wrap.style.boxShadow = "0 1px 6px rgba(0,0,0,.06)");

      // ---- Bild med 600x390 aspect ----
      const fig = document.createElement("div");
      css(fig, { position: "relative", background: "#f3f4f6" });
      const ph = document.createElement("div");
      css(ph, { width: "100%", paddingTop: "65%" }); // 390/600
      fig.appendChild(ph);

      if (t.image) {
        const img = document.createElement("img");
        img.src = t.image;
        img.alt = t.title || "";
        css(img, {
          position: "absolute", inset: 0,
          width: "100%", height: "100%", objectFit: "cover", display: "block"
        });
        fig.appendChild(img);
      }

      // RÖD diagonal ribbon om du använder t.ribbon (valfritt – kvar som innan)
      if (t.ribbon && (t.ribbon.text || typeof t.ribbon === "string")) {
        const text = t.ribbon.text || t.ribbon;
        const rb = document.createElement("div");
        rb.textContent = text;
        css(rb, {
          position: "absolute",
          top: "12px",
          left: "12px",
          transform: "rotate(-10deg)",
          background: "#EF4444",
          color: "#fff",
          padding: "6px 14px",
          fontWeight: "700",
          fontSize: "13px",
          borderRadius: "6px",
          boxShadow: "0 2px 8px rgba(0,0,0,.15)",
          letterSpacing: ".2px",
        });
        fig.appendChild(rb);
      }

      // 🔵 HÖRN-BADGE (NY): text eller "Text|#bg|#fg" från t.badge
      const badgeSpec = parseBadgeSpec(t.badge);
      if (badgeSpec) {
        const b = document.createElement("div");
        b.textContent = badgeSpec.text;
        css(b, {
          position: "absolute",
          top: "12px",
          right: "12px",
          background: badgeSpec.bg,
          color: badgeSpec.fg,
          padding: "8px 12px",
          fontWeight: "800",
          fontSize: "12px",
          borderRadius: "999px",
          boxShadow: "0 2px 10px rgba(0,0,0,.18)",
          letterSpacing: ".2px",
          maxWidth: "75%",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        });
        fig.appendChild(b);
      }

      wrap.appendChild(fig);

      // ---- Body ----
      const body = document.createElement("div");
      css(body, { padding: "14px" });

      // Piller-rad (kategori/land/år)
      const pills = document.createElement("div");
      css(pills, { display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "12px" });
      function pill(txt) {
        if (!txt) return;
        const p = document.createElement("span");
        p.textContent = txt;
        css(p, {
          background: "#f1f5f9",
          color: "#334155",
          padding: "4px 8px",
          borderRadius: "999px",
          fontWeight: "600",
        });
        pills.appendChild(p);
      }
      pill(t.trip_kind);     // "dagsresa/flerdagar/shopping"
      pill(t.country);
      pill(t.year);
      if (pills.childNodes.length) body.appendChild(pills);

      // Titel + undertitel
      const h = document.createElement("div");
      h.textContent = t.title || "";
      css(h, { marginTop: pills.childNodes.length ? "8px" : "0", fontSize: "20px", fontWeight: "700", color: "#0f172a" });
      body.appendChild(h);

      if (t.subtitle) {
        const sub = document.createElement("div");
        sub.textContent = t.subtitle;
        css(sub, { marginTop: "4px", color: "#0f172aB3", fontSize: "14px" });
        body.appendChild(sub);
      }

      // Kort beskrivning (summary)
      if (t.summary) {
        const sum = document.createElement("div");
        sum.textContent = t.summary;
        css(sum, { marginTop: "10px", color: "#0f172ab3", fontSize: "14px", lineHeight: "1.5" });
        body.appendChild(sum);
      }

      // Bottrad: next_date + pris-chip
      const foot = document.createElement("div");
      css(foot, { marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" });

      const left = document.createElement("span");
      css(left, { fontSize: "13px", color: "#0f172a99" });
      if (t.next_date) {
        // format YYYY-MM-DD -> sv
        try {
          const d = new Date(String(t.next_date));
          left.textContent = "Nästa avgång: " + d.toLocaleDateString("sv-SE", { year: "numeric", month: "short", day: "2-digit" });
        } catch {
          left.textContent = "Nästa avgång: " + t.next_date;
        }
      }
      foot.appendChild(left);

      if (t.price_from != null) {
        const price = document.createElement("span");
        price.textContent = "fr. " + Number(t.price_from).toLocaleString("sv-SE") + " kr";
        css(price, {
          padding: "6px 12px",
          borderRadius: "999px",
          background: "#eef2f7",
          color: "#0f172a",
          fontWeight: "700",
          fontSize: "14px",
          whiteSpace: "nowrap",
        });
        foot.appendChild(price);
      }
      body.appendChild(foot);

      wrap.appendChild(body);
      card.appendChild(wrap);
      el.appendChild(card);
    });
  }

  async function boot() {
    const el = document.getElementById("hb-trips");
    if (!el) return;

    const api = (el.getAttribute("data-api") || "").replace(/\/$/, "");
    const limit = Number(el.getAttribute("data-limit") || "6") || 6;
    const cols = Number(el.getAttribute("data-columns") || "3") || 3;
    const linkbase = (el.getAttribute("data-link-base") || "/trip/").replace(/\/\/+$/, "/");

    const url = `${api}/api/public/trips?limit=${encodeURIComponent(limit)}&_=${Date.now()}`;

    try {
      const r = await fetch(url, { method: "GET", mode: "cors", credentials: "omit" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();

      if (!j || !Array.isArray(j.trips)) throw new Error("Felaktigt format från API.");
      if (j.trips.length === 0) {
        el.innerHTML = '<div style="color:#666">Inga resor att visa ännu.</div>';
        return;
      }
      renderTrips(el, j.trips, cols, linkbase);
    } catch (e) {
      console.error("HB Widget: kunde inte hämta resor:", e);
      el.innerHTML = '<div style="color:#B00020">Kunde inte hämta resor.</div>';
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
