const fs = require("fs");

const p = "apps/site/components/sections/ServiceCards.tsx";
let s = fs.readFileSync(p, "utf8");

// ==============================
// LÅS DINA MÅTT (rör inget annat)
// ==============================
const setConst = (name, value) => {
  const re = new RegExp(`const\\s+${name}\\s*=\\s*\\d+\\s*;`);
  if (re.test(s)) {
    s = s.replace(re, `const ${name} = ${value};`);
  } else {
    console.log("HITTAR INTE:", name, "(hoppar över)");
  }
};

setConst("DESKTOP_GAP", 10);
setConst("IMAGE_H", 140);
setConst("ICON_TO_TITLE", 20);
setConst("DESKTOP_CARD_MIN", 240);
setConst("DESKTOP_CARD_MAX", 280);

// ===================================================
// Desktop-grid: se till att den använder MIN/MAX rätt
// (utan att röra mobil-karusell)
// ===================================================
const reOld = /gridTemplateColumns:\s*`repeat\(5,\s*minmax\(\$\{DESKTOP_CARD_MIN\}px,\s*1fr\)\)`\s*,/g;
s = s.replace(
  reOld,
  "gridTemplateColumns: `repeat(5, minmax(${DESKTOP_CARD_MIN}px, ${DESKTOP_CARD_MAX}px))`,"
);

// Centrera om det finns en desktop-wrapper med justifyItems:
if (s.includes('justifyItems: "center"') && !s.includes('justifyContent: "center"')) {
  s = s.replace('justifyItems: "center",', 'justifyItems: "center",\n          justifyContent: "center",');
}

// Skriv tillbaka
fs.writeFileSync(p, s, "utf8");
console.log("OK: ServiceCards patchad (mått + desktop-grid). Mobil-karusell rördes inte.");
