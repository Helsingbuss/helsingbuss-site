(() => {
  // injicera CSS så WP slipper klistra in en massa style
  const css = `
#hb-trips{--hb-cols:3;font-family:system-ui,-apple-system,Segoe UI,Roboto,"Helvetica Neue",Arial,"Noto Sans";}
#hb-trips .hb-grid{display:grid;gap:18px;grid-template-columns:repeat(var(--hb-cols),minmax(0,1fr))}
@media (max-width:1024px){#hb-trips .hb-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:640px){#hb-trips .hb-grid{grid-template-columns:1fr}}
.hb-card{background:#fff;border-radius:14px;box-shadow:0 8px 22px rgba(16,24,40,.08);overflow:hidden;border:1px solid #eef2f6}
.hb-img-wrap{position:relative;aspect-ratio:16/9;overflow:hidden}
.hb-img-wrap img{width:100%;height:100%;object-fit:cover;display:block;transform:scale(1.001)}
.hb-ribbon{position:absolute;left:-28px;top:18px;background:#ea4545;color:#fff;font-weight:700;padding:10px 22px;font-size:15px;letter-spacing:.2px;transform:rotate(-10deg);box-shadow:0 6px 16px rgba(0,0,0,.12);border-radius:6px}
.hb-ribbon::before,.hb-ribbon::after{content:"";position:absolute;top:0;bottom:0;width:26px;background:inherit}
.hb-ribbon::before{left:-26px;transform:skewX(-16deg);border-top-left-radius:6px;border-bottom-left-radius:6px}
.hb-ribbon::after{right:-26px;transform:skewX(16deg);border-top-right-radius:6px;border-bottom-right-radius:6px}
.hb-price-badge{position:absolute;right:14px;bottom:12px;background:#e83e8c;color:#fff;font-weight:700;font-size:14px;padding:10px 14px;border-radius:999px;box-shadow:0 8px 16px rgba(232,62,140,.25)}
.hb-body{padding:16px 16px 18px}
.hb-kicker{color:#0f172aA6;font-size:12px;font-weight:700;letter-spacing:.4px;text-transform:uppercase}
.hb-title{margin:4px 0 6px;font-size:20px;color:#0f172a;font-weight:800;line-height:1.2}
.hb-desc{color:#0f172aCC;font-size:14px;line-height:1.5;min-height:42px}
.hb-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:12px}
.hb-type{background:#fff6e5;color:#9a5b00;font-weight:700;font-size:12px;padding:6px 10px;border-radius:999px;border:1px solid #ffe5b4}
.hb-price{color:#0f172a;font-weight:800}
.hb-price small{color:#0f172a99;font-weight:600;margin-right:4px}
.hb-cta{display:inline-flex;align-items:center;justify-content:center;margin-top:12px;width:100%;background:#194C66;color:#fff;text-decoration:none;font-weight:700;padding:10px 14px;border-radius:999px;transition:background .15s ease}
.hb-cta:hover{background:#153e52}
.hb-error{color:#b00020;font-weight:700}
`;
  const style = document.createElement("style");
  style.innerHTML = css;
  document.head.appendChild(style);

  function money(n){
    if(n==null||n==="") return "";
    const num=Number(n); if(!isFinite(num)) return String(n);
    return num.toLocaleString("sv-SE",{style:"currency",currency:"SEK",maximumFractionDigits:0});
  }
  const el=(t,c,txt)=>{const e=document.createElement(t); if(c)e.className=c; if(txt!=null)e.textContent=txt; return e;};

  function initOne(root){
    const apiBase  = root.dataset.api || "https://login.helsingbuss.se";
    const limit    = Math.min(Math.max(parseInt(root.dataset.limit || "6",10)||6,1),24);
    const columns  = Math.min(Math.max(parseInt(root.dataset.columns || "3",10)||3,1),5);
    const linkBase = (root.dataset.linkBase || "https://login.helsingbuss.se/trip/").replace(/\/?$/,"/");

    root.style.setProperty("--hb-cols", String(columns));
    const grid = el("div","hb-grid"); root.appendChild(grid);

    (async () => {
      try{
        const url = new URL("/api/public/trips", apiBase);
        url.searchParams.set("limit", String(limit));
        url.searchParams.set("published","true");
        const r = await fetch(url.toString(), { mode:"cors", credentials:"omit" });
        if(!r.ok) throw new Error("HTTP "+r.status);
        const rows = await r.json();

        if(!(Array.isArray(rows) && rows.length)){
          grid.innerHTML = '<div class="hb-error">Inga resor hittades.</div>';
          return;
        }

        rows.forEach(trip=>{
          const id=trip.id, slug=trip.slug||id, href=linkBase + encodeURIComponent(slug);
          const img=trip.hero_image||"", title=trip.title||"Resa";
          const desc=trip.tagline||trip.summary||"", type=(trip.trip_type||"").toString().trim();
          const label=trip.campaign_label||trip.ribbon||""; // valfritt fält i DB
          const price=trip.price_from ?? trip.price ?? null;

          const card=el("div","hb-card");
          const wrap=el("div","hb-img-wrap");
          if(img){ const im=new Image(); im.alt=title; im.loading="lazy"; im.src=img; wrap.appendChild(im); }
          if(label){ wrap.appendChild(el("div","hb-ribbon",label)); }
          if(price!=null && price!==""){ wrap.appendChild(el("div","hb-price-badge","fr. "+money(price))); }
          card.appendChild(wrap);

          const body=el("div","hb-body");
          if(type) body.appendChild(el("div","hb-kicker",type));
          body.appendChild(el("div","hb-title",title));
          if(desc) body.appendChild(el("div","hb-desc",desc));

          const meta=el("div","hb-meta");
          if(type) meta.appendChild(el("div","hb-type",type));
          if(price!=null && price!==""){ const p=el("div","hb-price"); p.innerHTML='<small>fr.</small> '+money(price); meta.appendChild(p); }
          body.appendChild(meta);

          const a=el("a","hb-cta","Se datum och boka"); a.href=href; a.rel="noopener";
          body.appendChild(a);

          card.appendChild(body);
          grid.appendChild(card);
        });

      }catch(e){
        console.error("[HB Widget]", e);
        grid.innerHTML = '<div class="hb-error">Kunde inte hämta resor.</div>';
      }
    })();
  }

  function init(){
    const single = document.getElementById("hb-trips");
    const many = document.querySelectorAll("[data-hb-trips]");
    if (single) initOne(single);
    many.forEach((root)=> { initOne(root); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
