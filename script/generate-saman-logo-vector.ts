import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

const OUT = "exports/saman-deck-v3/assets/saman-logo-vector.png";
const PREVIEW = "exports/saman-deck-v3/assets/saman-logo-vector-preview.png";

const W = 2200;
const H = 1100;

function gearTeeth(cx: number, cy: number, rOuter: number, rInner: number, n: number): string {
  const paths: string[] = [];
  const slot = (Math.PI * 2) / n;
  const tipHalf = slot * 0.32;
  const baseHalf = slot * 0.48;
  for (let i = 0; i < n; i++) {
    const a = i * slot - Math.PI / 2;
    const a1 = a - tipHalf;
    const a2 = a + tipHalf;
    const a3 = a + baseHalf;
    const a4 = a - baseHalf;
    const x1 = cx + rOuter * Math.cos(a1), y1 = cy + rOuter * Math.sin(a1);
    const x2 = cx + rOuter * Math.cos(a2), y2 = cy + rOuter * Math.sin(a2);
    const x3 = cx + rInner * Math.cos(a3), y3 = cy + rInner * Math.sin(a3);
    const x4 = cx + rInner * Math.cos(a4), y4 = cy + rInner * Math.sin(a4);
    paths.push(
      `M${x4.toFixed(1)} ${y4.toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} L${x3.toFixed(1)} ${y3.toFixed(1)} Z`
    );
  }
  return paths.join(" ");
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="orangeBevel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f57a28"/>
      <stop offset="45%" stop-color="#d2461a"/>
      <stop offset="100%" stop-color="#7a2608"/>
    </linearGradient>
    <linearGradient id="orangeFlat" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e85a1e"/>
      <stop offset="100%" stop-color="#a23612"/>
    </linearGradient>
    <radialGradient id="orangeInner" cx="0.5" cy="0.4" r="0.7">
      <stop offset="0%" stop-color="#f78a3a"/>
      <stop offset="60%" stop-color="#d2461a"/>
      <stop offset="100%" stop-color="#7a2608"/>
    </radialGradient>
    <linearGradient id="orangeDark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5a1c08"/>
      <stop offset="100%" stop-color="#2e0d04"/>
    </linearGradient>

    <linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="20%" stop-color="#dcdcdc"/>
      <stop offset="48%" stop-color="#5a5a5a"/>
      <stop offset="52%" stop-color="#3a3a3a"/>
      <stop offset="80%" stop-color="#bcbcbc"/>
      <stop offset="100%" stop-color="#f0f0f0"/>
    </linearGradient>

    <linearGradient id="chromeSwoosh" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f8f8f8"/>
      <stop offset="40%" stop-color="#9a9a9a"/>
      <stop offset="60%" stop-color="#5a5a5a"/>
      <stop offset="100%" stop-color="#c8c8c8"/>
    </linearGradient>

    <radialGradient id="sInner" cx="0.5" cy="0.55" r="0.7">
      <stop offset="0%" stop-color="#ffe79a"/>
      <stop offset="40%" stop-color="#f8a82a"/>
      <stop offset="80%" stop-color="#c25a14"/>
      <stop offset="100%" stop-color="#7a2608"/>
    </radialGradient>

    <linearGradient id="silver" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f4f4f4"/>
      <stop offset="50%" stop-color="#a0a0a0"/>
      <stop offset="100%" stop-color="#4a4a4a"/>
    </linearGradient>

    <filter id="ds" x="-15%" y="-15%" width="130%" height="135%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
      <feOffset dx="0" dy="6"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.55"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- ===================== GEAR (left) ===================== -->
  <g transform="translate(560, 580)" filter="url(#ds)">
    <!-- Outer teeth (in front) -->
    <path d="${gearTeeth(0, 0, 420, 360, 14)}" fill="url(#orangeBevel)" stroke="#5a1c08" stroke-width="3"/>
    <!-- Outer flat ring -->
    <circle r="362" fill="url(#orangeFlat)"/>
    <!-- Dark recessed ring (rim accent) -->
    <circle r="320" fill="url(#orangeDark)"/>
    <!-- Inner orange face -->
    <circle r="295" fill="url(#orangeInner)"/>
    <!-- Center hub recess -->
    <circle r="95" fill="#3a1408"/>
    <circle r="65" fill="#0a0504"/>
    <!-- Subtle highlight on top edge of inner face -->
    <ellipse cx="0" cy="-180" rx="200" ry="60" fill="#f78a3a" opacity="0.35"/>
  </g>

  <!-- ===================== SILVER SWOOSH (behind text) ===================== -->
  <g filter="url(#ds)">
    <path d="
      M 380 660
      Q 1100 540, 1900 620
      L 2050 660
      L 2120 700
      L 1950 730
      Q 1100 770, 380 730
      Z
    " fill="url(#chromeSwoosh)" stroke="#3a3a3a" stroke-width="2"/>
    <!-- bright highlight band -->
    <path d="
      M 420 670
      Q 1100 580, 1900 660
      L 1900 685
      Q 1100 615, 420 695
      Z
    " fill="#f8f8f8" opacity="0.75"/>
    <!-- pointed right tip -->
    <path d="M 2050 660 L 2160 695 L 2050 720 Z" fill="url(#chromeSwoosh)" stroke="#3a3a3a" stroke-width="2"/>
  </g>

  <!-- ===================== PISTON (top of gear, behind wrench) ===================== -->
  <g transform="translate(440, 260) rotate(18)" filter="url(#ds)">
    <!-- cylinder head -->
    <rect x="-58" y="-110" width="116" height="140" rx="10" fill="url(#silver)" stroke="#3a3a3a" stroke-width="3"/>
    <!-- compression rings -->
    <rect x="-58" y="-60" width="116" height="7" fill="#2a2a2a"/>
    <rect x="-58" y="-35" width="116" height="7" fill="#2a2a2a"/>
    <rect x="-58" y="-10" width="116" height="7" fill="#2a2a2a"/>
    <!-- highlight band -->
    <rect x="-50" y="-100" width="20" height="120" fill="#ffffff" opacity="0.45" rx="4"/>
    <!-- conrod -->
    <rect x="-14" y="30" width="28" height="120" fill="url(#silver)" stroke="#3a3a3a" stroke-width="2"/>
    <!-- big-end -->
    <circle cx="0" cy="160" r="26" fill="url(#silver)" stroke="#3a3a3a" stroke-width="3"/>
    <circle cx="0" cy="160" r="9" fill="#0a0504"/>
  </g>

  <!-- ===================== WRENCH (top, in front) ===================== -->
  <g transform="translate(640, 230) rotate(-12)" filter="url(#ds)">
    <!-- shaft -->
    <rect x="-22" y="40" width="44" height="220" rx="8" fill="url(#silver)" stroke="#3a3a3a" stroke-width="3"/>
    <!-- shaft highlight -->
    <rect x="-18" y="44" width="10" height="210" rx="4" fill="#ffffff" opacity="0.5"/>
    <!-- open-end head (forks) -->
    <path d="
      M -75 -75
      L 75 -75
      L 95 -40
      L 75 30
      L 30 30
      L 30 -10
      L -30 -10
      L -30 30
      L -75 30
      L -95 -40
      Z
    " fill="url(#silver)" stroke="#3a3a3a" stroke-width="3"/>
    <!-- inner mouth -->
    <path d="M -30 -10 L 30 -10 L 30 -50 L -30 -50 Z" fill="#0a0504"/>
    <!-- highlight on head -->
    <path d="M -65 -65 L 65 -65 L 75 -50 L -75 -50 Z" fill="#ffffff" opacity="0.5"/>
  </g>

  <!-- ===================== SAMAN TEXT ===================== -->
  <!-- The S sits ON the gear; AMAN extends right along the swoosh. -->
  <g filter="url(#ds)">
    <!-- S -->
    <text x="380" y="800"
      font-family="Impact, 'Arial Black', 'Helvetica Neue', sans-serif"
      font-weight="900"
      font-size="440"
      font-style="italic"
      letter-spacing="-12"
      fill="url(#sInner)"
      stroke="#3a1408" stroke-width="6"
      paint-order="stroke">S</text>
    <!-- AMAN -->
    <text x="690" y="800"
      font-family="Impact, 'Arial Black', 'Helvetica Neue', sans-serif"
      font-weight="900"
      font-size="440"
      font-style="italic"
      letter-spacing="-10"
      fill="url(#chrome)"
      stroke="#1a1a1a" stroke-width="4"
      paint-order="stroke">AMAN</text>
  </g>
</svg>`;

(async () => {
  const png = await sharp(Buffer.from(svg), { density: 150 }).png({ compressionLevel: 6 }).toBuffer();
  fs.writeFileSync(PREVIEW, png);
  await sharp(png).trim({ threshold: 1 }).png({ compressionLevel: 6 }).toFile(OUT);
  const m = await sharp(OUT).metadata();
  console.log("vector logo:", m.width + "x" + m.height);
})();
