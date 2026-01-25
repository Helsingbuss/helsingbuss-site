const fs = require("fs");

const p = "apps/site/components/sections/ServiceCards.tsx";
let s = fs.readFileSync(p, "utf8");

// ================================
// A) Sätt CONTENT-gap till 10
// (vi sätter bara "gap:" i content-delen, inte hela filen)
// ================================
s = s.replace(
  /(display:\s*"grid",\s*\r?\n\s*)gap:\s*\d+(\s*,\s*\/\/[^\r\n]*\r?\n)/,
  `$1gap: 10$2`
);

// fallback om kommentaren inte finns
s = s.replace(
  /(display:\s*"grid",\s*\r?\n\s*)gap:\s*\d+(\s*,\s*\r?\n)/,
  `$1gap: 10$2`
);

// ================================
// B) Lyxigare overlay (synlig) + mjukare guld
// Vi ersätter hela background-blocket om vi hittar "linear-gradient(180deg" i overlayn
// ================================
const overlayBgRe = /background:\s*\n\s*"linear-gradient\(180deg[\s\S]*?\)\s*"\s*\+\s*\n\s*"radial-gradient\([\s\S]*?\)\s*"\s*\+\s*\n\s*"linear-gradient\(90deg[\s\S]*?\)"/m;

const overlayBgNew =
`background:
            "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.06) 45%, rgba(0,0,0,0.30) 100%)," +
            "radial-gradient(120% 80% at 20% 10%, rgba(255,255,255,0.40) 0%, rgba(255,255,255,0.00) 62%)," +
            "radial-gradient(95% 70% at 78% 12%, rgba(196,154,72,0.26) 0%, rgba(196,154,72,0.00) 60%)," +
            "linear-gradient(90deg, rgba(196,154,72,0.10) 0%, rgba(255,255,255,0.00) 40%, rgba(196,154,72,0.10) 100%)"`;

if (overlayBgRe.test(s)) {
  s = s.replace(overlayBgRe, overlayBgNew);
}

// ================================
// C) Se till att overlay-diven har opacity + blend (så den syns)
// ================================
if (!/mixBlendMode:\s*"multiply"/.test(s)) {
  s = s.replace(
    /(aria-hidden="true"[\s\S]*?inset:\s*0,\s*\r?\n)/m,
    `$1            opacity: 0.95,\n            mixBlendMode: "multiply",\n`
  );
}

fs.writeFileSync(p, s, "utf8");
console.log("OK: Patchade ServiceCards.tsx (overlay + gap=10)");
