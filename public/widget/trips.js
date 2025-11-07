// /public/widget/trips.js
(function () {
  function $(sel) { return document.querySelector(sel); }
  function css(el, styles) { Object.assign(el.style, styles || {}); return el; }

  function renderTrips(el, items, cols, linkbase) {
    el.innerHTML = "";
    css(el, {
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`,
      gap: "16px",
      alignItems: "stretch",
    });

    items.forEach((t) => {
      // ---- Rätt länklogik ----
      // 1) extern URL från admin
      // 2) linkbase + id (om båda finns)
      // 3) ingen länk (div) om vi inte kan bygga en korrekt URL
      var href = null;
      if (t && typeof t.external_url === "string" && t.external_url.trim()) {
        href = t.external_url.trim();
      } else if (t && t.id && linkbase) {
        href = (linkbase || "/trip/").replace(/\/+$/, "/") + String(t.id);
      }

      const clickable = !!href;
      const card = document.createElement(clickable ? "a" : "div");
      if (clickable) {
        card.href = href;
        card.target = "_self";
        card.rel = "noopener";
      }
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
      card.addEventListener("mouseenter", () => wrap.style.boxShadow = "0 3px 16px rgba(0,0,0,.1)");
      card.addEventListener("mouseleave", () => wrap.style.boxShadow = "0 1px 6px rgba(0,0,0,.06)");

      // ---- Bild (600x390) ----
      const fig = document.createElement("div");
      css(fig, { position: "relative", background: "#f3f4f6" });
      const ph = document.createElement("div");
      css(ph, { width: "100%", paddingTop: "65%" }); // 390/600
      fig.appendChild(ph);

      if (t && t.image) {
        const img = document.createElement("img");
        img.src = t.image;
        img.alt = t.title || "";
        css(img, {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        });
        fig.appendChild(img);
      }

      if (t && t.ribbon) {
        const text = typeof t.ribbon === "string" ? t.ribbon : (t.ribbon.text || "");
        if (text) {
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
      }
      wrap.appendChild(fig);

      // ---- Body ----
      const body = document.createElement("div");
      css(body, { padding: "14px" });

      // Piller: trip_kind + extra kategorier + land + år
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
      if (t && t.trip_kind) pill(t.trip_kind);
      if (t && Array.isArray(t.categories)) t.categories.forEach(pill);
      if (t && t.country) pill(t.country);
      if (t && t.year) pill(String(t.year));
      if (pills.childNodes.length) body.appendChild(pills);

      const h = document.createElement("div");
      h.textContent = (t && t.title) || "";
      css(h, { marginTop: pills.childNodes.length ? "8px" : "0", fontSize: "18px", fontWeight: "700", color: "#0f172a" });
      body.appendChild(h);

      if (t && t.subtitle) {
        const sub = document.createElement("div");
        sub.textContent = t.subtitle;
        css(sub, { marginTop: "4px", color: "#0f172aB3", fontSize: "14px" });
        body.appendChild(sub);
      }

      // Kort om resan (summary) – den som saknades
      if (t && t.summary) {
        const sum = document.createElement("div");
        sum.textContent = t.summary;
        css(sum, { marginTop: "6px", color: "#0f172acc", fontSize: "14px", lineHeight: "1.45" });
        body.appendChild(sum);
      }

      // Datum/Pris-rad
      const foot = document.createElement("div");
      css(foot, { marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" });

      const left = document.createElement("span");
      css(left, { fontSize: "13px", color: "#0f172a99" });
      if (t && t.next_date) left.textContent = "Nästa avgång: " + t.next_date;
      else left.textContent = "Flera datum";
      foot.appendChild(left);

      if (t && t.price_from != null) {
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
      const text = await r.text();

      // Försök parsa JSON; logga ev. server-svar för felsökning
      let j = null;
      try { j = JSON.parse(text); } catch (_) { j = null; }

      if (!r.ok) {
        console.error("HB Widget: HTTP fel", r.status, text);
        throw new Error(`HTTP ${r.status}`);
      }
      if (!j || (j && j.ok === false)) {
        console.error("HB Widget: API fel", j || text);
        throw new Error((j && j.error) || "Felaktigt format från API.");
      }
      if (!Array.isArray(j.trips)) {
        console.error("HB Widget: oväntat payload", j);
        throw new Error("Felaktigt format från API.");
      }
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
