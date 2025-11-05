// /public/widget/trips.js
(function () {
  function $(sel) { return document.querySelector(sel); }
  function css(el, styles) { Object.assign(el.style, styles || {}); return el; }

  function kr(n) {
    if (n == null) return "—";
    try { return Number(n).toLocaleString("sv-SE") + " kr"; } catch { return n + " kr"; }
  }

  function el(tag, props, children) {
    const x = document.createElement(tag);
    if (props) for (const k in props) {
      if (k === "class") x.className = props[k];
      else if (k === "style") Object.assign(x.style, props[k]);
      else x.setAttribute(k, props[k]);
    }
    (children || []).forEach(c => x.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return x;
  }

  function card(item, linkBase) {
    const href = (linkBase || "/trip/") + item.id;

    const wrap = el("a", { href, style:{
      display:"block", textDecoration:"none", color:"#0f172a"
    }});

    // Bild
    const imgBox = el("div", { style:{
      position:"relative", overflow:"hidden",
      borderRadius:"16px", boxShadow:"0 8px 24px rgba(0,0,0,0.08)",
      height:"220px", background:"#e5e7eb"
    }});
    if (item.image) {
      const img = el("img",{ src:item.image, alt:item.title||"", style:{
        width:"100%", height:"100%", objectFit:"cover", display:"block"
      }});
      imgBox.appendChild(img);
    }

    // Ribbon
    if (item.ribbon) {
      const rib = el("div", { style:{
        position:"absolute", top:"16px", left:"-12px", transform:"rotate(-9deg)",
        padding:"10px 18px", background:"#ef4444", color:"#fff", fontWeight:"700",
        boxShadow:"0 4px 12px rgba(0,0,0,.15)", borderRadius:"6px"
      }}, [ item.ribbon ]);
      imgBox.appendChild(rib);
    }

    // Body
    const body = el("div", { style:{
      background:"#fff", borderRadius:"16px", marginTop:"10px", padding:"16px",
      boxShadow:"0 8px 24px rgba(0,0,0,0.06)"
    }});

    const title = el("div", { style:{fontSize:"18px", fontWeight:"700", marginBottom:"6px", color:"#0f172a"}}, [ item.title || "—" ]);
    const sub   = el("div", { style:{fontSize:"14px", color:"#334155", minHeight:"38px"}}, [ item.subtitle || item.teaser || "" ]);
    const line  = el("div", { style:{display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:"12px"}}, [
      el("span", { style:{
        fontSize:"14px", background:"#fff1f2", color:"#9f1239",
        borderRadius:"999px", padding:"6px 10px", fontWeight:"700"
      }}, [ "fr. ", kr(item.price_from) ]),
      el("span", { style:{
        fontSize:"14px", background:"#194C66", color:"#fff",
        borderRadius:"999px", padding:"8px 14px", fontWeight:"600"
      }}, [ "Se datum & boka" ])
    ]);

    if (item.badge) {
      const badge = el("div", { style:{marginTop:"8px", fontSize:"12px", color:"#194C66", opacity:.7}}, [ item.badge ]);
      body.appendChild(badge);
    }

    body.appendChild(title);
    body.appendChild(sub);
    body.appendChild(line);

    wrap.appendChild(imgBox);
    wrap.appendChild(body);

    return wrap;
  }

  function render(container, items, cols, linkBase) {
    container.innerHTML = "";
    const grid = el("div", { style:{
      display:"grid",
      gridTemplateColumns:`repeat(${cols}, minmax(0,1fr))`,
      gap:"20px"
    }});
    items.forEach(it => grid.appendChild(card(it, linkBase)));
    container.appendChild(grid);
  }

  async function boot() {
    const host = document.getElementById("hb-trips");
    if (!host) return;

    const api = (host.getAttribute("data-api") || "").replace(/\/$/, "");
    const limit = Number(host.getAttribute("data-limit") || 6);
    const cols  = Math.max(1, Math.min(5, Number(host.getAttribute("data-columns") || 3)));
    const linkBase = (host.getAttribute("data-link-base") || "/trip/").replace(/\/?$/, "/");

    // Liten loader
    host.innerHTML = `<div style="padding:12px;color:#194C66">Laddar resor…</div>`;

    try {
      const r = await fetch(`${api}/api/public/trips?limit=${limit}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();

      // Mappa till widgetens förväntade nycklar
      const items = (j.trips || []).map(t => ({
        id: t.id,
        title: t.title,
        subtitle: t.subtitle || t.teaser || "",
        image: t.image || t.hero_image || null,
        price_from: t.price_from ?? null,
        badge: t.badge || null,
        ribbon: t.ribbon || null
      }));

      if (!items.length) {
        host.innerHTML = `<div style="padding:12px;color:#B91C1C">Inga resor hittades.</div>`;
        return;
      }
      render(host, items, cols, linkBase);
    } catch (e) {
      host.innerHTML = `<div style="padding:12px;color:#B91C1C">Kunde inte hämta resor.</div>`;
      console.error("HB Widget:", e);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
