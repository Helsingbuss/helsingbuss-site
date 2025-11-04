// public/widget/trips.js
(function () {
  function $(sel) { return document.querySelector(sel); }
  function create(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "style" && typeof v === "object") Object.assign(el.style, v);
      else if (k === "class") el.className = v;
      else el.setAttribute(k, v);
    });
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if (c == null) return;
      el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return el;
  }

  function renderTrips(root, items, cols, linkBase) {
    root.innerHTML = "";
    Object.assign(root.style, {
      display: "grid",
      gap: "16px",
      gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`,
      alignItems: "stretch"
    });

    items.forEach(t => {
      const card = create("a", {
        href: `${linkBase}${encodeURIComponent(t.id)}`,
        style: {
          display: "flex",
          flexDirection: "column",
          textDecoration: "none",
          color: "inherit",
          background: "#fff",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,.06)"
        }
      });

      // Bildwrap (för ribban)
      const imgWrap = create("div", { style: { position: "relative" } });
      const img = create("img", {
        src: t.image || "https://login.helsingbuss.se/placeholder.jpg",
        alt: t.title || "",
        style: { width: "100%", height: "190px", objectFit: "cover", display: "block" }
      });

      // Röd banderoll (kampanj)
      if (t.ribbon) {
        const ribbon = create("div", {
          style: {
            position: "absolute",
            top: "16px",
            left: "-16px",
            background: "#ef4444",
            color: "#fff",
            padding: "10px 18px",
            fontWeight: "700",
            transform: "rotate(-10deg)",
            boxShadow: "0 6px 12px rgba(0,0,0,.15)",
            borderRadius: "6px"
          }
        }, t.ribbon);
        imgWrap.appendChild(ribbon);
      }

      imgWrap.appendChild(img);
      card.appendChild(imgWrap);

      // Innehåll
      const body = create("div", { style: { padding: "14px 14px 16px 14px" } }, [
        // Badge (typ av resa)
        t.badge ? create("div", {
          style: {
            display: "inline-block",
            background: "#fff7ed",
            color: "#c2410c",
            border: "1px solid #fed7aa",
            borderRadius: "10px",
            fontSize: "12px",
            padding: "2px 8px",
            marginBottom: "8px"
          }
        }, t.badge) : null,

        create("div", { style: { fontSize: "18px", fontWeight: 700, color: "#0f172a" } }, t.title || "—"),

        (t.city || t.country) ? create("div", {
          style: { fontSize: "13px", marginTop: "4px", color: "#334155" }
        }, [t.city ? t.city : "", (t.city && t.country) ? ", " : "", t.country ? t.country : ""]) : null,

        t.subtitle ? create("div", {
          style: { fontSize: "14px", marginTop: "6px", color: "#334155" }
        }, t.subtitle) : null,

        // Pris-pill
        (t.price_from != null) ? create("div", {
          style: {
            marginTop: "12px",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "999px",
            padding: "6px 12px",
            fontWeight: 700
          }
        }, [create("span", {}, "fr."), ` ${Number(t.price_from).toLocaleString("sv-SE")}:-`]) : null
      ]);

      card.appendChild(body);
      root.appendChild(card);
    });
  }

  function boot() {
    const root = document.getElementById("hb-trips");
    if (!root) return;

    const api = (root.getAttribute("data-api") || "").replace(/\/$/, "");
    const linkBase = (root.getAttribute("data-link-base") || "https://login.helsingbuss.se/trip/").replace(/\/?$/, "/");
    const cols = parseInt(root.getAttribute("data-columns") || "3", 10) || 3;
    const limit = parseInt(root.getAttribute("data-limit") || "6", 10) || 6;

    if (!api) {
      root.innerHTML = '<div style="color:#b91c1c">Saknar data-api på #hb-trips</div>';
      return;
    }

    fetch(`${api}/api/public/trips?limit=${limit}`, { credentials: "omit" })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(j => {
        if (!j || !Array.isArray(j.trips)) throw new Error("bad payload");
        if (!j.trips.length) {
          root.innerHTML = '<div style="color:#334155">Inga resor att visa ännu.</div>';
          return;
        }
        renderTrips(root, j.trips, cols, linkBase);
      })
      .catch(() => {
        root.innerHTML = '<div style="color:#b91c1c">Kunde inte hämta resor.</div>';
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
