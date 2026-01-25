const fs = require("fs");

function read(p){ return fs.readFileSync(p,"utf8"); }
function write(p,s){ fs.writeFileSync(p, s.replace(/\r\n/g,"\n"), "utf8"); console.log("OK:", p); }

// ---- 1) Fix ServiceCards.tsx (centrering + blur + desktop/mobile visibility classes)
const svcPath = "apps/site/components/sections/ServiceCards.tsx";
let s = read(svcPath);

// a) Sänk blur lite (du kan ändra sen)
s = s.replace(/const IMAGE_BLUR_PX\s*=\s*[0-9.]+;/, "const IMAGE_BLUR_PX = 0.9;");

// b) Se till att desktopWrap inte är display:none (vi styr via CSS istället)
s = s.replace(/const desktopWrap:[\s\S]*?display:\s*"none",/m, (m) => m.replace(/display:\s*"none",/, 'display: "block",'));

// c) Lägg på className för att styra visibility med media queries
// Desktop wrapper:
s = s.replace(
  /<div\s+style=\{desktopWrap\}>/g,
  '<div className="hb-desktop-only" style={desktopWrap}>'
);

// Mobile wrapper:
s = s.replace(
  /<div\s+style=\{mobileWrap\}>/g,
  '<div className="hb-mobile-only" style={mobileWrap}>'
);

// d) Säkerställ att desktop grid är centrerad (om någon rad råkat ändras)
s = s.replace(/justifyContent:\s*"[^"]*"/, 'justifyContent: "center"');

write(svcPath, s);

// ---- 2) Lägg media queries i globals.css så:
// - Mobil visar karusell
// - Desktop visar grid (centrerat)
const gPath = "apps/site/app/globals.css";
let g = "";
try { g = read(gPath); } catch { g = ""; }

const marker = "/* HB: service cards visibility */";
if (!g.includes(marker)) {
  g += `\n\n${marker}
.hb-desktop-only { display: none; }
.hb-mobile-only { display: block; }

/* Desktop: visa grid, dölj karusell */
@media (min-width: 980px) {
  .hb-desktop-only { display: block; }
  .hb-mobile-only { display: none; }
}
`;
}

// Säkerställ ingen sid-scroll
if (!g.includes("overflow-x: hidden")) {
  g += `\n\nhtml, body { overflow-x: hidden; }\n`;
}

write(gPath, g);

console.log("DONE: centrerad desktop + mobil karusell kvar + blur sänkt + globals.css media queries.");
