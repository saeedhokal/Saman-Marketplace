import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import PDFDocument from "pdfkit";

const W = 1080;
const H = 1350;
const OUT_DIR = path.join(process.cwd(), "exports", "saman-deck-v2");
const PNG_DIR = path.join(OUT_DIR, "instagram");
const PDF_PATH = path.join(OUT_DIR, "saman-marketplace-deck-v2.pdf");

const xml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Vibrant palette — mix of warm + cool, brand orange anchored
const C = {
  orange: "#ff6a1a",
  orangeDeep: "#e94f00",
  yellow: "#ffd23f",
  pink: "#ff3d8b",
  hotPink: "#ff1f6b",
  coral: "#ff7a59",
  purple: "#8b5cf6",
  indigo: "#5b3df5",
  blue: "#2b6dff",
  cyan: "#22d3ee",
  teal: "#14b8a6",
  lime: "#a3e635",
  green: "#22c55e",
  cream: "#fff7ed",
  ink: "#0b0f1a",
  inkSoft: "#1f2937",
  white: "#ffffff",
};

const FONT = `'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif`;

const TOTAL = 9;

// ---------- helpers ----------
const sparkle = (x: number, y: number, size: number, color = C.white, opacity = 1) => `
  <g transform="translate(${x} ${y})" opacity="${opacity}">
    <path d="M0 -${size} L${size * 0.25} -${size * 0.25} L${size} 0 L${size * 0.25} ${size * 0.25} L0 ${size} L-${size * 0.25} ${size * 0.25} L-${size} 0 L-${size * 0.25} -${size * 0.25} Z" fill="${color}"/>
  </g>
`;

const dot = (x: number, y: number, r: number, color: string, opacity = 1) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${opacity}"/>`;

const sticker = (
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  text: string,
  textColor: string,
  rotate = 0,
  fontSize = 36,
) => `
  <g transform="translate(${x} ${y}) rotate(${rotate})">
    <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}"/>
    <text x="0" y="${fontSize / 3}" text-anchor="middle" font-family="${FONT}" font-size="${fontSize}" font-weight="900" fill="${textColor}">${xml(text)}</text>
  </g>
`;

const footer = (n: number, total: number, color = C.white, opacity = 0.65) => `
  <text x="80" y="${H - 60}" font-family="${FONT}" font-size="22" fill="${color}" opacity="${opacity}" font-weight="700" letter-spacing="3">SAMAN</text>
  <text x="${W - 80}" y="${H - 60}" text-anchor="end" font-family="${FONT}" font-size="22" fill="${color}" opacity="${opacity}" font-weight="700">${n} / ${total}</text>
`;

function svgWrap(content: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${content}
</svg>`;
}

// ---------- SLIDE 1: COVER ----------
function s1Cover() {
  const content = `
    <defs>
      <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${C.orange}"/>
        <stop offset="0.5" stop-color="${C.hotPink}"/>
        <stop offset="1" stop-color="${C.purple}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g1)"/>

    <!-- floating shapes -->
    ${dot(140, 200, 80, C.yellow, 0.95)}
    ${dot(W - 120, 280, 50, C.cyan, 0.9)}
    ${dot(160, H - 360, 30, C.white, 0.8)}
    ${sparkle(W - 180, 950, 22, C.yellow)}
    ${sparkle(220, 1080, 16, C.white, 0.9)}
    ${sparkle(W - 250, 200, 14, C.white)}

    <!-- big circle behind logo -->
    <circle cx="${W / 2}" cy="${H / 2 - 80}" r="240" fill="${C.white}"/>
    <text x="${W / 2}" y="${H / 2 - 50}" text-anchor="middle" font-family="${FONT}" font-size="120" font-weight="900" fill="${C.ink}" letter-spacing="6">SAMAN</text>

    <!-- tagline -->
    <text x="${W / 2}" y="${H / 2 + 240}" text-anchor="middle" font-family="${FONT}" font-size="62" font-weight="900" fill="${C.white}">Buy. Sell.</text>
    <text x="${W / 2}" y="${H / 2 + 315}" text-anchor="middle" font-family="${FONT}" font-size="62" font-weight="900" fill="${C.yellow}">Drive away.</text>

    <text x="${W / 2}" y="${H / 2 + 395}" text-anchor="middle" font-family="${FONT}" font-size="28" font-weight="600" fill="${C.white}" opacity="0.95">UAE's marketplace for cars &amp; spare parts</text>

    ${sticker(W - 220, 140, 240, 64, C.yellow, "100% FREE", C.ink, -8, 26)}

    ${footer(1, TOTAL, C.white, 0.85)}
  `;
  return svgWrap(content);
}

// ---------- SLIDE 2: WHAT IS IT ----------
function s2What() {
  const content = `
    <defs>
      <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.indigo}"/>
        <stop offset="1" stop-color="${C.purple}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g2)"/>

    ${dot(W - 100, 180, 120, C.pink, 0.55)}
    ${dot(80, H - 250, 100, C.cyan, 0.45)}
    ${sparkle(W - 240, 720, 22, C.yellow)}
    ${sparkle(W - 180, H - 200, 22, C.yellow, 0.9)}

    <text x="80" y="240" font-family="${FONT}" font-size="26" font-weight="700" fill="${C.yellow}" letter-spacing="4">WHAT IS SAMAN?</text>

    <text x="80" y="380" font-family="${FONT}" font-size="92" font-weight="900" fill="${C.white}">The fastest</text>
    <text x="80" y="470" font-family="${FONT}" font-size="92" font-weight="900" fill="${C.white}">way to buy</text>
    <text x="80" y="560" font-family="${FONT}" font-size="92" font-weight="900" fill="${C.yellow}">&amp; sell in the</text>
    <text x="80" y="650" font-family="${FONT}" font-size="92" font-weight="900" fill="${C.yellow}">UAE.</text>

    <!-- decorative pills -->
    ${sticker(220, 850, 240, 80, C.coral, "Cars", C.white, -4, 36)}
    ${sticker(580, 880, 240, 80, C.cyan, "Parts", C.ink, 5, 36)}
    ${sticker(280, 1000, 240, 80, C.lime, "Bikes", C.ink, 4, 36)}
    ${sticker(680, 1030, 280, 80, C.yellow, "& more", C.ink, -6, 36)}

    ${footer(2, TOTAL)}
  `;
  return svgWrap(content);
}

// ---------- SLIDE 3: 100% FREE (HERO) ----------
function s3Free() {
  const content = `
    <defs>
      <linearGradient id="g3" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${C.lime}"/>
        <stop offset="1" stop-color="${C.green}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g3)"/>

    ${dot(140, 180, 60, C.yellow)}
    ${dot(W - 140, 240, 80, C.white, 0.5)}
    ${dot(W - 200, H - 280, 100, C.orange, 0.85)}
    ${sparkle(180, 340, 22, C.white)}
    ${sparkle(W - 240, 480, 18, C.white, 0.9)}
    ${sparkle(220, H - 280, 18, C.yellow)}
    ${sparkle(W - 130, H - 380, 14, C.yellow, 0.9)}

    <text x="${W / 2}" y="280" text-anchor="middle" font-family="${FONT}" font-size="32" font-weight="800" fill="${C.ink}" letter-spacing="6">RIGHT NOW</text>

    <!-- giant FREE -->
    <text x="${W / 2}" y="600" text-anchor="middle" font-family="${FONT}" font-size="320" font-weight="900" fill="${C.ink}" letter-spacing="-8">FREE</text>

    <text x="${W / 2}" y="730" text-anchor="middle" font-family="${FONT}" font-size="46" font-weight="900" fill="${C.ink}">to post. to browse. to sell.</text>

    <!-- sticker -->
    ${sticker(W / 2, 870, 600, 110, C.ink, "Zero fees · No catches", C.yellow, -3, 36)}

    <text x="${W / 2}" y="1080" text-anchor="middle" font-family="${FONT}" font-size="30" font-weight="700" fill="${C.ink}" opacity="0.85">List your first item in under a minute</text>

    ${footer(3, TOTAL, C.ink, 0.7)}
  `;
  return svgWrap(content);
}

// ---------- SLIDE 4: GOT SOMETHING TO SELL ----------
function s4Sell() {
  const content = `
    <defs>
      <linearGradient id="g4" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${C.hotPink}"/>
        <stop offset="1" stop-color="${C.orange}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g4)"/>

    ${dot(W - 130, 200, 90, C.yellow, 0.95)}
    ${dot(W - 200, 720, 50, C.cyan, 0.9)}
    ${sparkle(W - 280, 220, 20, C.white)}
    ${sparkle(W - 100, 1100, 16, C.white, 0.9)}

    <text x="80" y="240" font-family="${FONT}" font-size="26" font-weight="800" fill="${C.yellow}" letter-spacing="5">FOR SELLERS</text>

    <text x="80" y="360" font-family="${FONT}" font-size="100" font-weight="900" fill="${C.white}">Got parts</text>
    <text x="80" y="460" font-family="${FONT}" font-size="100" font-weight="900" fill="${C.white}">collecting</text>
    <text x="80" y="560" font-family="${FONT}" font-size="100" font-weight="900" fill="${C.yellow}">dust?</text>

    <text x="80" y="670" font-family="${FONT}" font-size="34" font-weight="600" fill="${C.white}" opacity="0.95">Turn your old gear into cash —</text>
    <text x="80" y="715" font-family="${FONT}" font-size="34" font-weight="600" fill="${C.white}" opacity="0.95">in just three taps.</text>

    <!-- 3 step pills -->
    <g transform="translate(80 800)">
      <rect width="${W - 160}" height="80" rx="40" fill="${C.white}"/>
      <circle cx="50" cy="40" r="28" fill="${C.hotPink}"/>
      <text x="50" y="52" text-anchor="middle" font-family="${FONT}" font-size="32" font-weight="900" fill="${C.white}">1</text>
      <text x="100" y="52" font-family="${FONT}" font-size="30" font-weight="800" fill="${C.ink}">Snap a few photos</text>
    </g>
    <g transform="translate(80 900)">
      <rect width="${W - 160}" height="80" rx="40" fill="${C.white}"/>
      <circle cx="50" cy="40" r="28" fill="${C.hotPink}"/>
      <text x="50" y="52" text-anchor="middle" font-family="${FONT}" font-size="32" font-weight="900" fill="${C.white}">2</text>
      <text x="100" y="52" font-family="${FONT}" font-size="30" font-weight="800" fill="${C.ink}">Add price &amp; details</text>
    </g>
    <g transform="translate(80 1000)">
      <rect width="${W - 160}" height="80" rx="40" fill="${C.yellow}"/>
      <circle cx="50" cy="40" r="28" fill="${C.ink}"/>
      <text x="50" y="52" text-anchor="middle" font-family="${FONT}" font-size="32" font-weight="900" fill="${C.yellow}">3</text>
      <text x="100" y="52" font-family="${FONT}" font-size="30" font-weight="900" fill="${C.ink}">Hit publish — done!</text>
    </g>

    ${footer(4, TOTAL)}
  `;
  return svgWrap(content);
}

// ---------- SLIDE 5: LOOKING FOR SOMETHING ----------
function s5Browse() {
  const content = `
    <defs>
      <linearGradient id="g5" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.cyan}"/>
        <stop offset="1" stop-color="${C.blue}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g5)"/>

    ${dot(W - 110, 230, 70, C.yellow, 0.95)}
    ${dot(W - 130, 1130, 50, C.pink, 0.9)}
    ${sparkle(W - 280, 230, 18, C.white)}
    ${sparkle(80, 1130, 14, C.yellow, 0.9)}

    <text x="80" y="240" font-family="${FONT}" font-size="26" font-weight="800" fill="${C.yellow}" letter-spacing="5">FOR BUYERS</text>

    <text x="80" y="360" font-family="${FONT}" font-size="100" font-weight="900" fill="${C.white}">Hunting for</text>
    <text x="80" y="460" font-family="${FONT}" font-size="100" font-weight="900" fill="${C.yellow}">that one</text>
    <text x="80" y="560" font-family="${FONT}" font-size="100" font-weight="900" fill="${C.yellow}">part?</text>

    <text x="80" y="660" font-family="${FONT}" font-size="32" font-weight="600" fill="${C.white}" opacity="0.95">Search thousands of listings,</text>
    <text x="80" y="705" font-family="${FONT}" font-size="32" font-weight="600" fill="${C.white}" opacity="0.95">contact sellers directly.</text>

    <!-- search bar mock -->
    <g transform="translate(80 770)">
      <rect width="${W - 160}" height="100" rx="50" fill="${C.white}"/>
      <circle cx="60" cy="50" r="18" fill="none" stroke="${C.ink}" stroke-width="4"/>
      <line x1="74" y1="64" x2="92" y2="82" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>
      <text x="120" y="62" font-family="${FONT}" font-size="30" fill="${C.ink}" opacity="0.55">Brake pads, headlights, wheels…</text>
    </g>

    <!-- chips -->
    <g transform="translate(80 920)">
      ${sticker(110, 40, 200, 60, C.ink, "Cars", C.white, 0, 26)}
      ${sticker(340, 40, 200, 60, C.yellow, "Parts", C.ink, 0, 26)}
      ${sticker(570, 40, 200, 60, C.white, "Bikes", C.ink, 0, 26)}
      ${sticker(800, 40, 200, 60, C.pink, "Wheels", C.white, 0, 26)}
    </g>
    <g transform="translate(80 1000)">
      ${sticker(110, 40, 200, 60, C.coral, "Audio", C.white, 0, 26)}
      ${sticker(340, 40, 200, 60, C.lime, "Tires", C.ink, 0, 26)}
      ${sticker(570, 40, 240, 60, C.white, "Accessories", C.ink, 0, 24)}
      ${sticker(820, 40, 200, 60, C.yellow, "+ More", C.ink, 0, 26)}
    </g>

    ${footer(5, TOTAL)}
  `;
  return svgWrap(content);
}

// ---------- SLIDE 6: WHY SAMAN ----------
function s6Why() {
  const content = `
    <defs>
      <linearGradient id="g6" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.yellow}"/>
        <stop offset="1" stop-color="${C.orange}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g6)"/>

    ${dot(W - 130, 200, 70, C.pink, 0.9)}
    ${dot(140, H - 200, 60, C.cyan, 0.9)}
    ${sparkle(W - 280, 240, 20, C.white)}
    ${sparkle(W - 130, H - 280, 18, C.white)}

    <text x="80" y="240" font-family="${FONT}" font-size="26" font-weight="800" fill="${C.ink}" letter-spacing="5">WHY SAMAN?</text>

    <text x="80" y="370" font-family="${FONT}" font-size="80" font-weight="900" fill="${C.ink}">Built for the</text>
    <text x="80" y="450" font-family="${FONT}" font-size="80" font-weight="900" fill="${C.white}">UAE crowd.</text>

    <!-- benefit cards -->
    <g transform="translate(80 540)">
      <rect width="${W - 160}" height="120" rx="24" fill="${C.white}"/>
      <circle cx="70" cy="60" r="36" fill="${C.hotPink}"/>
      <text x="70" y="76" text-anchor="middle" font-family="${FONT}" font-size="40" font-weight="900" fill="${C.white}">✓</text>
      <text x="140" y="55" font-family="${FONT}" font-size="32" font-weight="900" fill="${C.ink}">Verified phone numbers</text>
      <text x="140" y="92" font-family="${FONT}" font-size="22" font-weight="600" fill="${C.ink}" opacity="0.7">Every seller — real, reachable, trusted.</text>
    </g>

    <g transform="translate(80 690)">
      <rect width="${W - 160}" height="120" rx="24" fill="${C.white}"/>
      <circle cx="70" cy="60" r="36" fill="${C.purple}"/>
      <text x="70" y="78" text-anchor="middle" font-family="${FONT}" font-size="44" font-weight="900" fill="${C.white}">د.إ</text>
      <text x="140" y="55" font-family="${FONT}" font-size="32" font-weight="900" fill="${C.ink}">All in AED, all local</text>
      <text x="140" y="92" font-family="${FONT}" font-size="22" font-weight="600" fill="${C.ink}" opacity="0.7">Pricing &amp; sellers from across the Emirates.</text>
    </g>

    <g transform="translate(80 840)">
      <rect width="${W - 160}" height="120" rx="24" fill="${C.white}"/>
      <circle cx="70" cy="60" r="36" fill="${C.cyan}"/>
      <text x="70" y="74" text-anchor="middle" font-family="${FONT}" font-size="26" font-weight="900" fill="${C.ink}">AR/EN</text>
      <text x="140" y="55" font-family="${FONT}" font-size="32" font-weight="900" fill="${C.ink}">Arabic &amp; English supported</text>
      <text x="140" y="92" font-family="${FONT}" font-size="22" font-weight="600" fill="${C.ink}" opacity="0.7">In-app translation built right in.</text>
    </g>

    <g transform="translate(80 990)">
      <rect width="${W - 160}" height="120" rx="24" fill="${C.ink}"/>
      <circle cx="70" cy="60" r="36" fill="${C.yellow}"/>
      <text x="70" y="76" text-anchor="middle" font-family="${FONT}" font-size="40" font-weight="900" fill="${C.ink}">★</text>
      <text x="140" y="55" font-family="${FONT}" font-size="32" font-weight="900" fill="${C.white}">Free to use, today</text>
      <text x="140" y="92" font-family="${FONT}" font-size="22" font-weight="600" fill="${C.white}" opacity="0.85">No subscriptions. No fees. Just post.</text>
    </g>

    ${footer(6, TOTAL, C.ink, 0.7)}
  `;
  return svgWrap(content);
}

// ---------- SLIDE 7: AVAILABLE EVERYWHERE ----------
function s7Available() {
  const content = `
    <defs>
      <linearGradient id="g7" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${C.purple}"/>
        <stop offset="1" stop-color="${C.hotPink}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g7)"/>

    ${dot(W - 120, 220, 90, C.yellow, 0.95)}
    ${dot(150, H - 320, 70, C.cyan, 0.95)}
    ${sparkle(180, 240, 20, C.white)}
    ${sparkle(W - 250, H - 220, 22, C.yellow)}

    <text x="${W / 2}" y="260" text-anchor="middle" font-family="${FONT}" font-size="26" font-weight="800" fill="${C.yellow}" letter-spacing="5">AVAILABLE NOW</text>

    <text x="${W / 2}" y="400" text-anchor="middle" font-family="${FONT}" font-size="80" font-weight="900" fill="${C.white}">Wherever</text>
    <text x="${W / 2}" y="490" text-anchor="middle" font-family="${FONT}" font-size="80" font-weight="900" fill="${C.yellow}">you are.</text>

    <!-- App Store button -->
    <g transform="translate(${W / 2 - 250} 600)">
      <rect width="500" height="140" rx="34" fill="${C.ink}"/>
      <text x="60" y="62" font-family="${FONT}" font-size="22" fill="${C.white}" font-weight="600" opacity="0.85">Download on the</text>
      <text x="60" y="115" font-family="${FONT}" font-size="52" fill="${C.white}" font-weight="900">App Store</text>
      <g transform="translate(420 70)">
        <text x="0" y="22" text-anchor="middle" font-family="${FONT}" font-size="60" fill="${C.white}"></text>
      </g>
    </g>

    <!-- Web button -->
    <g transform="translate(${W / 2 - 250} 770)">
      <rect width="500" height="140" rx="34" fill="${C.white}"/>
      <text x="60" y="62" font-family="${FONT}" font-size="22" fill="${C.ink}" font-weight="600" opacity="0.65">Or visit</text>
      <text x="60" y="115" font-family="${FONT}" font-size="44" fill="${C.ink}" font-weight="900">thesamanapp.com</text>
    </g>

    <text x="${W / 2}" y="990" text-anchor="middle" font-family="${FONT}" font-size="30" font-weight="700" fill="${C.white}" opacity="0.95">iPhone · Android · Web</text>

    ${sticker(W / 2, 1080, 320, 70, C.yellow, "Made in the UAE", C.ink, 0, 28)}

    ${footer(7, TOTAL)}
  `;
  return svgWrap(content);
}

// ---------- SLIDE 8: JOIN THE COMMUNITY ----------
function s8Community() {
  const avatars = [
    { x: 250, y: 600, color: C.coral, initial: "A" },
    { x: 380, y: 580, color: C.cyan, initial: "M" },
    { x: 510, y: 620, color: C.lime, initial: "S" },
    { x: 640, y: 580, color: C.yellow, initial: "K" },
    { x: 770, y: 620, color: C.pink, initial: "R" },
  ];
  const content = `
    <defs>
      <linearGradient id="g8" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.ink}"/>
        <stop offset="1" stop-color="${C.indigo}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g8)"/>

    ${dot(W - 130, 220, 90, C.orange, 0.85)}
    ${dot(140, H - 280, 70, C.cyan, 0.7)}
    ${sparkle(180, 240, 18, C.yellow)}
    ${sparkle(W - 240, 980, 20, C.yellow, 0.9)}
    ${sparkle(220, 1100, 14, C.white, 0.9)}

    <text x="${W / 2}" y="260" text-anchor="middle" font-family="${FONT}" font-size="26" font-weight="800" fill="${C.yellow}" letter-spacing="5">JOIN US</text>

    <text x="${W / 2}" y="400" text-anchor="middle" font-family="${FONT}" font-size="86" font-weight="900" fill="${C.white}">Be part of the</text>
    <text x="${W / 2}" y="490" text-anchor="middle" font-family="${FONT}" font-size="86" font-weight="900" fill="${C.orange}">Saman crew.</text>

    <!-- avatar row -->
    ${avatars
      .map(
        (a) => `
      <g transform="translate(${a.x} ${a.y})">
        <circle r="60" fill="${a.color}" stroke="${C.white}" stroke-width="6"/>
        <text y="20" text-anchor="middle" font-family="${FONT}" font-size="50" font-weight="900" fill="${C.ink}">${a.initial}</text>
      </g>`,
      )
      .join("\n")}

    <text x="${W / 2}" y="780" text-anchor="middle" font-family="${FONT}" font-size="32" font-weight="700" fill="${C.white}" opacity="0.95">Real buyers. Real sellers.</text>
    <text x="${W / 2}" y="825" text-anchor="middle" font-family="${FONT}" font-size="32" font-weight="700" fill="${C.white}" opacity="0.95">Real deals — every single day.</text>

    <g transform="translate(${W / 2 - 280} 920)">
      <rect width="560" height="130" rx="65" fill="${C.orange}"/>
      <text x="280" y="83" text-anchor="middle" font-family="${FONT}" font-size="42" font-weight="900" fill="${C.white}">Start posting today →</text>
    </g>

    ${footer(8, TOTAL)}
  `;
  return svgWrap(content);
}

// ---------- SLIDE 9: CTA ----------
function s9CTA() {
  const content = `
    <defs>
      <linearGradient id="g9" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${C.orange}"/>
        <stop offset="0.5" stop-color="${C.hotPink}"/>
        <stop offset="1" stop-color="${C.purple}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g9)"/>

    ${dot(140, 220, 90, C.yellow, 0.95)}
    ${dot(W - 130, 320, 60, C.cyan, 0.95)}
    ${dot(180, H - 320, 50, C.white, 0.85)}
    ${dot(W - 200, H - 360, 70, C.lime, 0.85)}
    ${sparkle(W - 260, 220, 22, C.white)}
    ${sparkle(220, 980, 22, C.yellow)}
    ${sparkle(W - 200, 1080, 18, C.white, 0.9)}
    ${sparkle(150, 580, 16, C.yellow, 0.9)}

    <!-- big circle behind logo -->
    <circle cx="${W / 2}" cy="${H / 2 - 200}" r="170" fill="${C.white}"/>
    <text x="${W / 2}" y="${H / 2 - 175}" text-anchor="middle" font-family="${FONT}" font-size="78" font-weight="900" fill="${C.ink}" letter-spacing="4">SAMAN</text>

    <text x="${W / 2}" y="${H / 2 + 60}" text-anchor="middle" font-family="${FONT}" font-size="92" font-weight="900" fill="${C.white}">Don't scroll —</text>
    <text x="${W / 2}" y="${H / 2 + 155}" text-anchor="middle" font-family="${FONT}" font-size="92" font-weight="900" fill="${C.yellow}">start trading.</text>

    <g transform="translate(${W / 2 - 280} ${H / 2 + 230})">
      <rect width="560" height="130" rx="65" fill="${C.white}"/>
      <text x="280" y="83" text-anchor="middle" font-family="${FONT}" font-size="42" font-weight="900" fill="${C.ink}">Download Saman →</text>
    </g>

    <text x="${W / 2}" y="${H - 200}" text-anchor="middle" font-family="${FONT}" font-size="32" font-weight="800" fill="${C.white}">thesamanapp.com</text>
    <text x="${W / 2}" y="${H - 155}" text-anchor="middle" font-family="${FONT}" font-size="22" font-weight="600" fill="${C.white}" opacity="0.85">Free on the App Store · Web · Android</text>

    ${footer(9, TOTAL)}
  `;
  return svgWrap(content);
}

const SLIDES: Array<{ name: string; svg: () => string }> = [
  { name: "01-cover", svg: s1Cover },
  { name: "02-what", svg: s2What },
  { name: "03-free", svg: s3Free },
  { name: "04-sell", svg: s4Sell },
  { name: "05-browse", svg: s5Browse },
  { name: "06-why", svg: s6Why },
  { name: "07-available", svg: s7Available },
  { name: "08-community", svg: s8Community },
  { name: "09-cta", svg: s9CTA },
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(PNG_DIR, { recursive: true });

  const pngBuffers: Buffer[] = [];

  for (const slide of SLIDES) {
    const svg = slide.svg();
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    const pngPath = path.join(PNG_DIR, `${slide.name}.png`);
    fs.writeFileSync(pngPath, png);
    pngBuffers.push(png);
    console.log(`✓ ${slide.name}.png`);
  }

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ size: [W, H], margin: 0, autoFirstPage: false });
    const stream = fs.createWriteStream(PDF_PATH);
    stream.on("finish", () => resolve());
    stream.on("error", reject);
    doc.pipe(stream);
    pngBuffers.forEach((buf) => {
      doc.addPage({ size: [W, H], margin: 0 });
      doc.image(buf, 0, 0, { width: W, height: H });
    });
    doc.end();
  });

  console.log(`\n📄 PDF: ${PDF_PATH}`);
  console.log(`📸 PNGs: ${PNG_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
