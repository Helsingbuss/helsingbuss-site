const fs = require("fs");

const file = "apps/site/components/sections/ServiceCards.tsx";
let s = fs.readFileSync(file, "utf8");

// 1) Hitta overlay-diven (aria-hidden="true") med style={{ ... }} och ersätt STYLE-INNEHÅLLET
// Vi byter bara overlayns style-body. Alla andra delar av filen lämnas.
const re = /(<div[\s\S]*?aria-hidden="true"[\s\S]*?style=\{\{\s*)([\s\S]*?)(\s*\}\}[\s\S]*?\/>)/m;

if (!re.test(s)) {
  console.log("HITTADE INTE overlay-blocket (aria-hidden). Avbryter.");
  process.exit(1);
}

const overlayStyle = `
position: "absolute",
inset: 0,
pointerEvents: "none",

// Premium overlay (mjuk + lyxig, minskar 'skarpa' bilder)
opacity: 0.92,
mixBlendMode: "multiply",
background:
  "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.06) 45%, rgba(0,0,0,0.22) 100%)," +
  "radial-gradient(120% 85% at 22% 10%, rgba(255,255,255,0.36) 0%, rgba(255,255,255,0.00) 62%)," +
  "radial-gradient(100% 70% at 78% 14%, rgba(196,154,72,0.28) 0%, rgba(196,154,72,0.00) 60%)," +
  "linear-gradient(90deg, rgba(196,154,72,0.12) 0%, rgba(255,255,255,0.00) 42%, rgba(196,154,72,0.10) 100%)",

filter: "saturate(0.95) contrast(0.98)",
backdropFilter: "blur(6px)",
WebkitBackdropFilter: "blur(6px)",
`;

s = s.replace(re, (m, a, body, c) => {
  return a + overlayStyle.trim() + "\n" + c;
});

// 2) Extra-säkring: om det fortfarande finns lösa "radial-gradient(...)"-rader inne i overlay-style,
// ta bort dem (de ska bara finnas efter background: ...)
s = s.replace(
  /(aria-hidden="true"[\s\S]*?style=\{\{[\s\S]*?)(^\s*\"(?:linear|radial)-gradient[\s\S]*?$)+/gm,
  (m) => m.replace(/^\s*\"(?:linear|radial)-gradient[\s\S]*?$\r?\n?/gm, "")
);

fs.writeFileSync(file, s, "utf8");
console.log("KLAR: Overlay-style fixad (ingen lös gradienttext).");
