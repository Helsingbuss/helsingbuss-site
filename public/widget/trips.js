// /public/widget/trips.js
(function () {
  function $(sel) { return document.querySelector(sel); }
  function css(el, styles) { Object.assign(el.style, styles || {}); return el; }
  function fmtDateISO(iso) {
    try { return new Date(iso).toLocaleDateString('sv-SE', { year:'numeric', month:'short', day:'numeric' }); }
    catch { return iso || ""; }
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
      card.addEventListener("mouseenter", () => wrap.style.boxShadow = "0 3px 16px rgba(0,0,0,.1)");
      card.addEventListener("mouseleave", () => wrap.style.boxShadow = "0 1px 6px rgba(0,0,0,.06)");

      // Bild 600x390 aspect (65% trick)
      const fig = document.createElement("div");
      css(fig, { position: "relative", background: "#f3f4f6" });
      const ph = document.createElement("div");
      css(ph, { width: "100%", paddingTop: "65%" });
      fig.appendChild(ph);

      if (t.image) {
        const img = document.createElement("img");
        img.src = t.image;
        img.alt = t.title || "";
        css(img, { position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", display:"block" });
        fig.appendChild(img);
      }

      if (t.ribbon && (t.ribbon.text || typeof t.ribbon === "string")) {
        const text = t.ribbon.text || t.ribbon;
        const rb = document.createElement("div");
        rb.textContent = text;
        css(rb, {
          position: "absolute", top: "12px", left: "12px",
          transform: "rotate(-10deg)",
          background: "#EF4444", color: "#fff",
          padding: "6px 14px", fontWeight: "700", fontSize: "13px",
          borderRadius: "6px", boxShadow: "0 2px 8px rgba(0,0,0,.15)",
          letterSpacing: ".2px",
        });
        fig.appendChild(rb);
      }
      wrap.appendChild(fig);

      const body = document.createElement("div");
      css(body, { padding: "14px" });

      const pills = document.createElement("div");
      css(pills, { display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "12px" });

      function pill(txt) {
        if (!txt) return;
        const p = document.createElement("span");
        p.textContent = txt;
        css(p, { background: "#f1f5f9", color: "#334155", padding: "4px 8px", borderRadius: "999px", fontWeight: "600" });
        pills.appendChild(p);
      }
      pill(t.badge);
      pill(t.country);
      pill(t.year);
      if (pills.childNodes.length) body.appendChild(pills);

      const h = document.createElement("div");
      h.textContent = t.title || "";
      css(h, { marginTop: pills.childNodes.length ? "8px" : "0", fontSize: "18px", fontWeight: "700", color: "#0f172a" });
      body.appendChild(h);

      if (t.subtitle) {
        const sub = document.createElement("div");
        sub.textContent = t.subtitle;
        css(sub, { marginTop: "4px", color: "#0f172aB3", fontSize: "14px" });
        body.appendChild(sub);
      }

      const foot = document.createElement("div");
      css(foot, { marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" });

      const left = document.createElement("span");
      css(left, { fontSize: "13px", color: "#0f172a99" });
      if (t.next_date) left.textContent = "Nästa avgång: " + fmtDateISO(t.next_date);
      else left.textContent = "Flera datum";
      foot.appendChild(left);

      if (t.price_from != null) {
        const price = document.createElement("span");
        price.textContent = "fr. " + Number(t.price_from).toLocaleString("sv-SE") + " kr";
        css(price, {
          padding: "6px 12px", borderRadius: "999px", background: "#eef2f7",
          color: "#0f172a", fontWeight: "700", fontSize: "14px", whiteSpace: "nowrap",
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
      const j = await r.json();
      if (!r.ok || !j || j.ok === false || !Array.isArray(j.trips)) {
        console.error("HB Widget: bad response", j);
        el.innerHTML = '<div style="color:#B00020">Kunde inte hämta resor.</div>';
        return;
      }
      if (j.warning) console.warn("HB Widget warning:", j.warning);

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

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
