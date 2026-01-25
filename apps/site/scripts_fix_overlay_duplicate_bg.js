const fs = require("fs");

const p = "apps/site/components/sections/ServiceCards.tsx";
let s = fs.readFileSync(p, "utf8");

// Hitta overlay-diven med aria-hidden och plocka ut style={{ ... }}
const re = /(<div[\s\S]*?aria-hidden="true"[\s\S]*?style=\{\{\s*)([\s\S]*?)(\s*\}\}[\s\S]*?\/>)/m;

if (!re.test(s)) {
  console.log("HITTADE INTE overlay-blocket (aria-hidden). Avbryter.");
  process.exit(1);
}

s = s.replace(re, (m, a, styleBody, c) => {
  // Hitta alla "background:"-block och ta bort alla UTOM sista
  // Vi tar hela background: ... , (inkl ev flera rader) fram till nästa property eller slut.
  const bgBlocks = [];
  const bgRe = /(^\s*background\s*:\s*[\s\S]*?)(?=^\s*[a-zA-Z_]+\s*:|\s*$)/gm;

  let match;
  while ((match = bgRe.exec(styleBody)) !== null) {
    bgBlocks.push({ start: match.index, end: match.index + match[1].length });
  }

  if (bgBlocks.length <= 1) {
    console.log("OK: Ingen dubbel background hittades i overlay.");
    return a + styleBody + c;
  }

  // Behåll sista, ta bort tidigare (från slutet bakåt så index inte förstörs)
  const last = bgBlocks[bgBlocks.length - 1];
  let out = styleBody;

  for (let i = bgBlocks.length - 2; i >= 0; i--) {
    const b = bgBlocks[i];
    out = out.slice(0, b.start) + out.slice(b.end);
  }

  // Städa upp extra tomrader
  out = out.replace(/\n{3,}/g, "\n\n");

  console.log(`FIX: Tog bort ${bgBlocks.length - 1} extra background:-rader (behöll sista).`);
  return a + out + c;
});

fs.writeFileSync(p, s, "utf8");
console.log("KLAR: ServiceCards.tsx fixad (dubbla background bort).");
