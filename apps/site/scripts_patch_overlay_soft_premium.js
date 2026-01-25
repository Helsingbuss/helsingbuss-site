const fs = require("fs");

const p = "apps/site/components/sections/ServiceCards.tsx";
let s = fs.readFileSync(p, "utf8");

// ======================================================
// 1) Mjuka upp bilderna (filter på Image-komponenten)
//    - Vi lägger till style.filter om det saknas
// ======================================================
function addImageFilter(code) {
  // A) Om <Image ... style={{ ... }} finns: lägg till filter: "..."
  code = code.replace(
    /<Image([\s\S]*?)style=\{\{([\s\S]*?)\}\}([\s\S]*?)\/>/m,
    (m, a, styleBody, b) => {
      if (/filter\s*:/.test(styleBody)) return m; // redan satt
      const filter = `\n                filter: "saturate(0.92) contrast(0.94) brightness(0.95)",`;
      return `<Image${a}style={{${styleBody}${filter}\n              }}${b}/>`;
    }
  );

  // B) Om Image saknar style helt men finns: lägg på style med filter
  code = code.replace(
    /<Image([\s\S]*?)\/>/m,
    (m, a) => {
      if (/style=\{\{/.test(m)) return m;
      return `<Image${a}style={{ filter: "saturate(0.92) contrast(0.94) brightness(0.95)" }} />`;
    }
  );

  return code;
}

s = addImageFilter(s);

// ======================================================
// 2) Starkare, snyggare premium overlay över bilden
//    - Vi letar efter overlay-diven i IMAGE-blocket och uppdaterar
// ======================================================

// Försök hitta overlay-blocket (aria-hidden overlay) och ersätt dess background + lägg lite blur
const overlayStyleRe =
  /(aria-hidden="true"[\s\S]*?style=\{\{\s*[\s\S]*?inset:\s*0,\s*\r?\n)([\s\S]*?)(\}\}\s*\/>)/m;

if (overlayStyleRe.test(s)) {
  s = s.replace(overlayStyleRe, (m, start, mid, end) => {
    // behåll opacity/mixBlendMode om du redan har dem
    const keepOpacity = /opacity\s*:/.test(mid) ? "" : `            opacity: 0.92,\n`;
    const keepBlend = /mixBlendMode\s*:/.test(mid) ? "" : `            mixBlendMode: "multiply",\n`;

    // Ny overlay: mjuk vignette + guldglow + lätt frost
    const newMid =
`${keepOpacity}${keepBlend}            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.10) 55%, rgba(0,0,0,0.36) 100%)," +
              "radial-gradient(120% 85% at 22% 10%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.00) 62%)," +
              "radial-gradient(100% 70% at 78% 14%, rgba(196,154,72,0.34) 0%, rgba(196,154,72,0.00) 60%)," +
              "linear-gradient(90deg, rgba(196,154,72,0.12) 0%, rgba(255,255,255,0.00) 42%, rgba(196,154,72,0.10) 100%)",
            pointerEvents: "none",\n`;

    // Ta bort gammal background/backdropFilter om den finns i mid
    let cleaned = mid
      .replace(/backdropFilter:\s*"[^"]*",?\s*\r?\n?/g, "")
      .replace(/WebkitBackdropFilter:\s*"[^"]*",?\s*\r?\n?/g, "")
      .replace(/background:\s*[\s\S]*?(,?\s*\r?\n)(?=\s*[a-zA-Z]+\s*:)/m, "");

    return `${start}${newMid}${cleaned}${end}`;
  });
} else {
  console.log("OBS: Hittade inte overlay-blocket automatiskt. Säg till så patchar vi med annan regex.");
}

// ======================================================
// 3) SÄKERHET: rör INTE dina mått
//    (Vi lämnar gap=10, IMAGE_H=140, rubrik-offset=20 etc.)
// ======================================================

fs.writeFileSync(p, s, "utf8");
console.log("OK: Premium overlay + mjukare bilder patchat i ServiceCards.tsx");
