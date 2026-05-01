import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const W = 1080;
const H = 1350;
const OUT_DIR = path.join(process.cwd(), "exports", "saman-deck-v3");
const PNG_DIR = path.join(OUT_DIR, "instagram");
const PDF_PATH = path.join(OUT_DIR, "saman-marketplace-deck-v3.pdf");
const LOGO_PATH = path.join(OUT_DIR, "assets", "saman-logo-hd.png");
const LOGO_B64 = `data:image/png;base64,${fs.readFileSync(LOGO_PATH).toString("base64")}`;
// Trimmed HD logo dimensions (intrinsic): 553 x 299 → aspect ~1.850
const LOGO_AR = 553 / 299;

const xml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Premium automotive palette
const C = {
  black: "#0d0d0e",
  charcoal: "#17181a",
  nardo: "#6F7372",
  nardoLight: "#8a8e8d",
  nardoDark: "#3a3c3c",
  orange: "#d2461a",
  orangeBright: "#e85e2c",
  orangeDeep: "#a8350f",
  white: "#ffffff",
  offWhite: "#f5f5f4",
  mute: "#a3a4a5",
};

const FONT = `'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif`;
const TOTAL = 7;

// ---------- ICONS (clean line/filled SVG) ----------
const iconGear = (cx: number, cy: number, r: number, color: string, opacity = 1) => {
  const teeth = 12;
  const innerR = r * 0.78;
  const outerR = r;
  const points: string[] = [];
  const toothW = (Math.PI * 2) / (teeth * 2);
  for (let i = 0; i < teeth * 2; i++) {
    const a = i * toothW - Math.PI / 2;
    const rr = i % 2 === 0 ? outerR : innerR;
    points.push(`${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`);
  }
  return `
    <g opacity="${opacity}">
      <polygon points="${points.join(" ")}" fill="${color}"/>
      <circle cx="${cx}" cy="${cy}" r="${r * 0.42}" fill="none" stroke="${color}" stroke-width="${r * 0.08}"/>
      <circle cx="${cx}" cy="${cy}" r="${r * 0.18}" fill="none" stroke="${color}" stroke-width="${r * 0.06}"/>
    </g>
  `;
};

const iconGearOutline = (cx: number, cy: number, r: number, color: string, opacity = 1, stroke = 4) => {
  const teeth = 14;
  const innerR = r * 0.82;
  const points: string[] = [];
  const toothW = (Math.PI * 2) / (teeth * 2);
  for (let i = 0; i < teeth * 2; i++) {
    const a = i * toothW - Math.PI / 2;
    const rr = i % 2 === 0 ? r : innerR;
    points.push(`${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`);
  }
  return `
    <g opacity="${opacity}">
      <polygon points="${points.join(" ")}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linejoin="round"/>
      <circle cx="${cx}" cy="${cy}" r="${r * 0.45}" fill="none" stroke="${color}" stroke-width="${stroke}"/>
    </g>
  `;
};

const iconWrench = (cx: number, cy: number, size: number, color: string, rotate = -45, opacity = 1) => `
  <g transform="translate(${cx} ${cy}) rotate(${rotate}) scale(${size / 100})" opacity="${opacity}">
    <path d="M -45 -20
             A 22 22 0 1 1 -10 18
             L 40 18
             L 40 -18
             L -10 -18
             A 22 22 0 0 1 -45 -20 Z
             M -45 -20
             A 22 22 0 0 0 -45 20"
          fill="${color}"/>
    <circle cx="-32" cy="0" r="8" fill="${C.black}" opacity="0.25"/>
  </g>
`;

const iconWrenchSimple = (cx: number, cy: number, size: number, color: string, rotate = -45, opacity = 1) => {
  const s = size / 130;
  // Classic open-end spanner: long handle with two open jaws (one each end)
  return `
    <g transform="translate(${cx} ${cy}) rotate(${rotate}) scale(${s})" opacity="${opacity}">
      <!-- handle -->
      <rect x="-35" y="-10" width="70" height="20" fill="${color}"/>
      <!-- left jaw (open C, facing left) -->
      <path d="M -65 -28
               L -35 -28
               L -35 28
               L -65 28
               L -65 10
               L -48 10
               L -48 -10
               L -65 -10 Z"
            fill="${color}"/>
      <!-- right jaw (open C, facing right, rotated 180) -->
      <path d="M 65 -28
               L 35 -28
               L 35 28
               L 65 28
               L 65 10
               L 48 10
               L 48 -10
               L 65 -10 Z"
            fill="${color}"/>
    </g>
  `;
};

const iconCar = (cx: number, cy: number, size: number, color: string, opacity = 1) => {
  const s = size / 200;
  return `
    <g transform="translate(${cx} ${cy}) scale(${s})" opacity="${opacity}">
      <!-- car silhouette: side profile -->
      <path d="M -100 20
               L -90 -10
               Q -80 -40 -50 -45
               L 30 -45
               Q 55 -45 70 -25
               L 95 -10
               L 100 5
               L 100 25
               L 80 25
               A 18 18 0 0 1 44 25
               L -44 25
               A 18 18 0 0 1 -80 25
               L -100 25 Z"
            fill="${color}"/>
      <!-- windows -->
      <path d="M -75 -10
               Q -68 -32 -50 -35
               L -10 -35
               L -10 -10 Z" fill="${C.black}" opacity="0.4"/>
      <path d="M -5 -10
               L -5 -35
               L 30 -35
               Q 50 -35 60 -22
               L 65 -10 Z" fill="${C.black}" opacity="0.4"/>
      <!-- wheels -->
      <circle cx="-62" cy="25" r="18" fill="${C.black}"/>
      <circle cx="-62" cy="25" r="9" fill="${color}"/>
      <circle cx="62" cy="25" r="18" fill="${C.black}"/>
      <circle cx="62" cy="25" r="9" fill="${color}"/>
    </g>
  `;
};

const iconCamera = (cx: number, cy: number, size: number, color: string) => {
  const s = size / 100;
  return `
    <g transform="translate(${cx} ${cy}) scale(${s})">
      <rect x="-50" y="-25" width="100" height="60" rx="8" fill="${color}"/>
      <rect x="-22" y="-38" width="44" height="18" rx="4" fill="${color}"/>
      <circle cx="0" cy="5" r="20" fill="none" stroke="${C.black}" stroke-width="5"/>
      <circle cx="0" cy="5" r="10" fill="${C.black}"/>
      <circle cx="34" cy="-12" r="4" fill="${C.black}"/>
    </g>
  `;
};

const iconDoc = (cx: number, cy: number, size: number, color: string) => {
  const s = size / 100;
  return `
    <g transform="translate(${cx} ${cy}) scale(${s})">
      <path d="M -32 -45 L 20 -45 L 35 -30 L 35 45 L -32 45 Z" fill="${color}"/>
      <path d="M 20 -45 L 20 -30 L 35 -30" fill="none" stroke="${C.black}" stroke-width="3" opacity="0.3"/>
      <line x1="-22" y1="-10" x2="25" y2="-10" stroke="${C.black}" stroke-width="4" opacity="0.5"/>
      <line x1="-22" y1="5" x2="25" y2="5" stroke="${C.black}" stroke-width="4" opacity="0.5"/>
      <line x1="-22" y1="20" x2="10" y2="20" stroke="${C.black}" stroke-width="4" opacity="0.5"/>
    </g>
  `;
};

const iconCheck = (cx: number, cy: number, size: number, color: string) => {
  const s = size / 100;
  return `
    <g transform="translate(${cx} ${cy}) scale(${s})">
      <circle r="50" fill="${color}"/>
      <path d="M -22 0 L -6 18 L 24 -16" fill="none" stroke="${C.white}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  `;
};

const iconSearch = (cx: number, cy: number, size: number, color: string) => {
  const s = size / 100;
  return `
    <g transform="translate(${cx} ${cy}) scale(${s})">
      <circle cx="-8" cy="-8" r="28" fill="none" stroke="${color}" stroke-width="9"/>
      <line x1="14" y1="14" x2="34" y2="34" stroke="${color}" stroke-width="11" stroke-linecap="round"/>
    </g>
  `;
};

const iconChat = (cx: number, cy: number, size: number, color: string) => {
  const s = size / 100;
  return `
    <g transform="translate(${cx} ${cy}) scale(${s})">
      <path d="M -40 -28
               L 40 -28
               Q 50 -28 50 -18
               L 50 12
               Q 50 22 40 22
               L -10 22
               L -28 38
               L -24 22
               L -40 22
               Q -50 22 -50 12
               L -50 -18
               Q -50 -28 -40 -28 Z" fill="${color}"/>
      <circle cx="-18" cy="-3" r="4" fill="${C.black}"/>
      <circle cx="0" cy="-3" r="4" fill="${C.black}"/>
      <circle cx="18" cy="-3" r="4" fill="${C.black}"/>
    </g>
  `;
};

// Background patterns
const cornerGears = (color: string, opacity: number) => `
  ${iconGearOutline(W + 80, -60, 280, color, opacity, 3)}
  ${iconGearOutline(-100, H + 60, 240, color, opacity, 3)}
`;

const subtleGrid = (color: string, opacity: number) => {
  const lines: string[] = [];
  for (let i = 0; i <= W; i += 90) {
    lines.push(`<line x1="${i}" y1="0" x2="${i}" y2="${H}" stroke="${color}" stroke-width="1" opacity="${opacity}"/>`);
  }
  return lines.join("");
};

const orangeBar = (x: number, y: number, w = 80, h = 8) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.orange}"/>`;

const eyebrow = (x: number, y: number, text: string, color = C.orange) => `
  ${orangeBar(x, y - 22, 56, 6)}
  <text x="${x + 72}" y="${y - 11}" font-family="${FONT}" font-size="20" font-weight="800" fill="${color}" letter-spacing="5">${xml(text.toUpperCase())}</text>
`;

const footer = (n: number, total: number, color = C.mute) => `
  <line x1="80" y1="${H - 95}" x2="${W - 80}" y2="${H - 95}" stroke="${color}" stroke-opacity="0.18" stroke-width="1"/>
  <text x="80" y="${H - 55}" font-family="${FONT}" font-size="20" fill="${color}" font-weight="700" letter-spacing="3">SAMAN MARKETPLACE</text>
  <text x="${W - 80}" y="${H - 55}" text-anchor="end" font-family="${FONT}" font-size="20" fill="${color}" font-weight="700">${n.toString().padStart(2, "0")} / ${total.toString().padStart(2, "0")}</text>
`;

function svgWrap(content: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${content}
</svg>`;
}

// ---------- SLIDE 1: TITLE ----------
function s1Title() {
  const logoW = 720;
  const logoH = logoW / LOGO_AR;
  const logoX = (W - logoW) / 2;
  const logoY = 360;

  const content = `
    <defs>
      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.black}"/>
        <stop offset="1" stop-color="${C.nardoDark}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g1)"/>
    ${subtleGrid(C.white, 0.025)}

    <!-- Subtle gears -->
    ${iconGearOutline(W - 60, 220, 220, C.orange, 0.22, 2)}
    ${iconGearOutline(W - 220, 140, 90, C.orange, 0.32, 2)}
    ${iconGearOutline(-40, H - 240, 200, C.orange, 0.18, 2)}

    <!-- Faint car silhouette bottom -->
    ${iconCar(W / 2, H - 220, 460, C.white, 0.05)}

    <!-- Logo image -->
    <image href="${LOGO_B64}" x="${logoX}" y="${logoY}" width="${logoW}" height="${logoH}" preserveAspectRatio="xMidYMid meet"/>

    <!-- "Marketplace" wordmark beneath logo -->
    <text x="${W / 2}" y="${logoY + logoH + 70}" text-anchor="middle" font-family="${FONT}" font-size="64" font-weight="900" fill="${C.white}" letter-spacing="14">MARKETPLACE</text>

    <!-- Divider -->
    <line x1="${W / 2 - 90}" y1="${logoY + logoH + 110}" x2="${W / 2 + 90}" y2="${logoY + logoH + 110}" stroke="${C.orange}" stroke-width="3"/>

    <!-- Subtitle -->
    <text x="${W / 2}" y="${logoY + logoH + 180}" text-anchor="middle" font-family="${FONT}" font-size="32" font-weight="600" fill="${C.white}">Cars &amp; Spare Parts Advertising Platform</text>

    <text x="${W / 2}" y="${H - 180}" text-anchor="middle" font-family="${FONT}" font-size="22" font-weight="700" fill="${C.mute}" letter-spacing="6">FROM THE UAE · FOR THE UAE</text>

    ${footer(1, TOTAL)}
  `;
  return svgWrap(content);
}

// ---------- SLIDE 2: WHAT THE APP DOES ----------
function s2What() {
  const card = (x: number, y: number, w: number, h: number, icon: string, title: string, sub: string, accent = false) => `
    <g transform="translate(${x} ${y})">
      <rect width="${w}" height="${h}" rx="20" fill="${accent ? C.orange : C.charcoal}"/>
      <g transform="translate(80 ${h / 2})">${icon}</g>
      <text x="180" y="${h / 2 - 8}" font-family="${FONT}" font-size="30" font-weight="800" fill="${C.white}">${xml(title)}</text>
      <text x="180" y="${h / 2 + 28}" font-family="${FONT}" font-size="20" font-weight="500" fill="${accent ? C.white : C.mute}" opacity="${accent ? 0.95 : 1}">${xml(sub)}</text>
    </g>
  `;

  const content = `
    <rect width="${W}" height="${H}" fill="${C.black}"/>
    ${subtleGrid(C.white, 0.025)}
    ${iconGearOutline(W - 40, 100, 180, C.orange, 0.18, 2)}

    ${eyebrow(80, 240, "What it is")}
    <text x="80" y="320" font-family="${FONT}" font-size="74" font-weight="900" fill="${C.white}">An online</text>
    <text x="80" y="395" font-family="${FONT}" font-size="74" font-weight="900" fill="${C.white}">marketplace for</text>
    <text x="80" y="470" font-family="${FONT}" font-size="74" font-weight="900" fill="${C.orange}">cars &amp; parts.</text>

    ${card(80, 540, W - 160, 130, iconCar(0, 0, 110, C.orange), "Post cars for sale", "Reach UAE buyers fast")}
    ${card(80, 690, W - 160, 130, iconWrenchSimple(0, 0, 110, C.orange, -25), "Post spare parts", "From a single bolt to a full kit")}
    ${card(80, 840, W - 160, 130, iconSearch(0, 0, 90, C.orange), "Browse listings easily", "Search by make, model, or part")}
    ${card(80, 990, W - 160, 130, iconChat(0, 0, 100, C.white), "Connect directly", "Talk to buyers and sellers", true)}

    ${footer(2, TOTAL)}
  `;
  return svgWrap(content);
}

// ---------- SLIDE 3: WHY USE SAMAN ----------
function s3Why() {
  const reasons = [
    { t: "Built for cars &amp; parts", s: "Not generic — automotive only." },
    { t: "Designed for the UAE", s: "AED prices. Local sellers." },
    { t: "Fast to list, easy to use", s: "From idea to live in minutes." },
    { t: "Modern, app-like experience", s: "On iPhone, Android, and web." },
  ];

  const items = reasons
    .map(
      (r, i) => `
    <g transform="translate(80 ${500 + i * 110})">
      <rect width="${W - 160}" height="90" rx="14" fill="${C.charcoal}" stroke="${C.nardoDark}" stroke-width="1"/>
      <rect width="6" height="90" rx="3" fill="${C.orange}"/>
      <text x="40" y="40" font-family="${FONT}" font-size="32" font-weight="800" fill="${C.orange}">${(i + 1).toString().padStart(2, "0")}</text>
      <text x="120" y="40" font-family="${FONT}" font-size="26" font-weight="800" fill="${C.white}">${r.t}</text>
      <text x="120" y="68" font-family="${FONT}" font-size="20" font-weight="500" fill="${C.mute}">${r.s}</text>
    </g>
  `,
    )
    .join("\n");

  const content = `
    <defs>
      <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.nardoDark}"/>
        <stop offset="1" stop-color="${C.black}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g3)"/>
    ${subtleGrid(C.white, 0.02)}
    ${iconGearOutline(-80, 100, 220, C.orange, 0.2, 2)}

    ${eyebrow(80, 240, "Why Saman")}
    <text x="80" y="320" font-family="${FONT}" font-size="74" font-weight="900" fill="${C.white}">Built for the</text>
    <text x="80" y="395" font-family="${FONT}" font-size="74" font-weight="900" fill="${C.orange}">UAE driver.</text>

    ${items}

    ${footer(3, TOTAL)}
  `;
  return svgWrap(content);
}

// ---------- SLIDE 4: HOW EASY ----------
function s4How() {
  const step = (n: number, x: number, y: number, w: number, h: number, icon: string, title: string, sub: string) => `
    <g transform="translate(${x} ${y})">
      <rect width="${w}" height="${h}" rx="20" fill="${C.charcoal}" stroke="${C.nardoDark}" stroke-width="1"/>
      <text x="40" y="60" font-family="${FONT}" font-size="80" font-weight="900" fill="${C.orange}" opacity="0.95">${n.toString().padStart(2, "0")}</text>
      <line x1="40" y1="84" x2="160" y2="84" stroke="${C.orange}" stroke-width="3"/>
      <g transform="translate(${w - 130} ${h / 2 - 10})">${icon}</g>
      <text x="40" y="${h - 80}" font-family="${FONT}" font-size="34" font-weight="800" fill="${C.white}">${xml(title)}</text>
      <text x="40" y="${h - 40}" font-family="${FONT}" font-size="20" font-weight="500" fill="${C.mute}">${xml(sub)}</text>
    </g>
  `;

  const content = `
    <rect width="${W}" height="${H}" fill="${C.black}"/>
    ${subtleGrid(C.white, 0.025)}
    ${iconGearOutline(W - 40, 80, 180, C.orange, 0.18, 2)}

    ${eyebrow(80, 240, "How to post")}
    <text x="80" y="320" font-family="${FONT}" font-size="74" font-weight="900" fill="${C.white}">Three taps.</text>
    <text x="80" y="395" font-family="${FONT}" font-size="74" font-weight="900" fill="${C.orange}">That's it.</text>

    ${step(1, 80, 510, W - 160, 200, iconCamera(0, 0, 90, C.orange), "Take a picture", "Snap a clear photo of your car or part")}
    ${step(2, 80, 730, W - 160, 200, iconDoc(0, 0, 90, C.orange), "Add basic details", "Title, price, condition. Done.")}
    ${step(3, 80, 950, W - 160, 200, iconCheck(0, 0, 70, C.orange), "Post your ad", "Goes live after a quick review")}

    ${footer(4, TOTAL)}
  `;
  return svgWrap(content);
}

// ---------- SLIDE 5: FOR CAR SELLERS ----------
function s5Cars() {
  const content = `
    <defs>
      <linearGradient id="g5" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${C.black}"/>
        <stop offset="1" stop-color="${C.nardoDark}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g5)"/>
    ${subtleGrid(C.white, 0.025)}
    ${iconGearOutline(W + 40, 60, 200, C.orange, 0.2, 2)}

    ${eyebrow(80, 240, "For car sellers")}

    <text x="80" y="340" font-family="${FONT}" font-size="80" font-weight="900" fill="${C.white}">List your car</text>
    <text x="80" y="425" font-family="${FONT}" font-size="80" font-weight="900" fill="${C.orange}">in minutes.</text>

    <text x="80" y="510" font-family="${FONT}" font-size="28" font-weight="500" fill="${C.mute}">Reach people actively looking</text>
    <text x="80" y="550" font-family="${FONT}" font-size="28" font-weight="500" fill="${C.mute}">for vehicles across the UAE.</text>

    <!-- Car centerpiece on dark Nardo card -->
    <g transform="translate(80 620)">
      <rect width="${W - 160}" height="430" rx="24" fill="${C.charcoal}" stroke="${C.nardoDark}" stroke-width="1"/>
      <!-- speed lines (left of car) -->
      <line x1="40" y1="170" x2="160" y2="170" stroke="${C.orange}" stroke-width="3" opacity="0.5"/>
      <line x1="60" y1="200" x2="180" y2="200" stroke="${C.orange}" stroke-width="3" opacity="0.35"/>
      <line x1="80" y1="230" x2="200" y2="230" stroke="${C.orange}" stroke-width="3" opacity="0.2"/>
      <!-- car (centered) -->
      ${iconCar((W - 160) / 2, 200, 460, C.orange)}
      <!-- spec chips below car -->
      <g transform="translate(60 360)">
        <rect width="200" height="44" rx="22" fill="${C.black}" stroke="${C.nardoDark}" stroke-width="1"/>
        <text x="100" y="29" text-anchor="middle" font-family="${FONT}" font-size="18" font-weight="700" fill="${C.white}">Year &amp; Mileage</text>
      </g>
      <g transform="translate(280 360)">
        <rect width="160" height="44" rx="22" fill="${C.black}" stroke="${C.nardoDark}" stroke-width="1"/>
        <text x="80" y="29" text-anchor="middle" font-family="${FONT}" font-size="18" font-weight="700" fill="${C.white}">Condition</text>
      </g>
      <g transform="translate(460 360)">
        <rect width="200" height="44" rx="22" fill="${C.orange}"/>
        <text x="100" y="29" text-anchor="middle" font-family="${FONT}" font-size="18" font-weight="800" fill="${C.white}">Price in AED</text>
      </g>
    </g>

    ${footer(5, TOTAL)}
  `;
  return svgWrap(content);
}

// ---------- SLIDE 6: FOR PARTS SELLERS ----------
function s6Parts() {
  const content = `
    <rect width="${W}" height="${H}" fill="${C.black}"/>
    ${subtleGrid(C.white, 0.025)}
    ${iconGearOutline(-60, H - 240, 240, C.orange, 0.2, 2)}
    ${iconGearOutline(120, H - 380, 110, C.orange, 0.3, 2)}

    ${eyebrow(80, 240, "For parts sellers")}

    <text x="80" y="340" font-family="${FONT}" font-size="76" font-weight="900" fill="${C.white}">Garages, shops,</text>
    <text x="80" y="420" font-family="${FONT}" font-size="76" font-weight="900" fill="${C.orange}">individuals.</text>

    <text x="80" y="510" font-family="${FONT}" font-size="28" font-weight="500" fill="${C.mute}">Post parts clearly so buyers</text>
    <text x="80" y="550" font-family="${FONT}" font-size="28" font-weight="500" fill="${C.mute}">find exactly what they need.</text>

    <!-- 4 quick benefit tiles -->
    <g transform="translate(80 620)">
      <rect width="440" height="140" rx="20" fill="${C.charcoal}" stroke="${C.nardoDark}" stroke-width="1"/>
      <g transform="translate(70 70)">${iconCamera(0, 0, 60, C.orange)}</g>
      <text x="160" y="60" font-family="${FONT}" font-size="24" font-weight="800" fill="${C.white}">Clear photos</text>
      <text x="160" y="92" font-family="${FONT}" font-size="18" font-weight="500" fill="${C.mute}">Up to 20 per listing</text>
    </g>

    <g transform="translate(560 620)">
      <rect width="440" height="140" rx="20" fill="${C.charcoal}" stroke="${C.nardoDark}" stroke-width="1"/>
      <g transform="translate(70 70)">${iconWrenchSimple(0, 0, 70, C.orange, -25)}</g>
      <text x="160" y="60" font-family="${FONT}" font-size="24" font-weight="800" fill="${C.white}">Make &amp; model</text>
      <text x="160" y="92" font-family="${FONT}" font-size="18" font-weight="500" fill="${C.mute}">Tell buyers it fits</text>
    </g>

    <g transform="translate(80 780)">
      <rect width="440" height="140" rx="20" fill="${C.charcoal}" stroke="${C.nardoDark}" stroke-width="1"/>
      <g transform="translate(70 70)">${iconCheck(0, 0, 50, C.orange)}</g>
      <text x="160" y="60" font-family="${FONT}" font-size="24" font-weight="800" fill="${C.white}">Condition</text>
      <text x="160" y="92" font-family="${FONT}" font-size="18" font-weight="500" fill="${C.mute}">New, used, refurbished</text>
    </g>

    <g transform="translate(560 780)">
      <rect width="440" height="140" rx="20" fill="${C.orange}"/>
      <g transform="translate(70 70)">${iconChat(0, 0, 70, C.white)}</g>
      <text x="160" y="60" font-family="${FONT}" font-size="24" font-weight="800" fill="${C.white}">Direct contact</text>
      <text x="160" y="92" font-family="${FONT}" font-size="18" font-weight="500" fill="${C.white}" opacity="0.95">Buyers reach you instantly</text>
    </g>

    <text x="${W / 2}" y="990" text-anchor="middle" font-family="${FONT}" font-size="22" fill="${C.mute}" font-weight="600" letter-spacing="2">FROM A SINGLE BOLT TO A FULL ENGINE</text>

    ${footer(6, TOTAL)}
  `;
  return svgWrap(content);
}

// ---------- SLIDE 7: CTA + QR ----------
async function s7CTA() {
  // Generate QR for thesamanapp.com — keep its viewBox so we can nest it
  const qrSvg = await QRCode.toString("https://thesamanapp.com/downloads", {
    type: "svg",
    margin: 1,
    color: { dark: C.black, light: "#ffffff" },
    errorCorrectionLevel: "M",
  });
  const vbMatch = qrSvg.match(/viewBox="([^"]+)"/);
  const innerMatch = qrSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
  const qrViewBox = vbMatch ? vbMatch[1] : "0 0 25 25";
  const qrInner = innerMatch ? innerMatch[1] : "";

  const content = `
    <defs>
      <linearGradient id="g7" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.black}"/>
        <stop offset="1" stop-color="${C.nardoDark}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g7)"/>
    ${subtleGrid(C.white, 0.025)}
    ${iconGearOutline(W + 40, 80, 180, C.orange, 0.25, 2)}
    ${iconGearOutline(-60, H - 200, 220, C.orange, 0.2, 2)}

    ${eyebrow(80, 240, "Get started")}

    <text x="80" y="340" font-family="${FONT}" font-size="84" font-weight="900" fill="${C.white}">Start posting</text>
    <text x="80" y="425" font-family="${FONT}" font-size="84" font-weight="900" fill="${C.orange}">for free today.</text>

    <text x="80" y="510" font-family="${FONT}" font-size="28" font-weight="500" fill="${C.mute}">Download Saman Marketplace and</text>
    <text x="80" y="550" font-family="${FONT}" font-size="28" font-weight="500" fill="${C.mute}">list your cars or spare parts.</text>

    <!-- Logo block (matches QR card height) -->
    <g transform="translate(80 640)">
      <rect width="320" height="240" rx="36" fill="${C.charcoal}" stroke="${C.nardoDark}" stroke-width="1"/>
      <!-- Logo image (centered, scaled to fit width) -->
      <image href="${LOGO_B64}" x="30" y="40" width="260" height="${260 / LOGO_AR}" preserveAspectRatio="xMidYMid meet"/>
      <!-- Marketplace wordmark -->
      <text x="160" y="210" text-anchor="middle" font-family="${FONT}" font-size="20" font-weight="900" fill="${C.white}" letter-spacing="6">MARKETPLACE</text>
    </g>

    <!-- QR card -->
    <g transform="translate(${W - 80 - 320} 640)">
      <rect width="320" height="320" rx="36" fill="${C.white}"/>
      <text x="160" y="42" text-anchor="middle" font-family="${FONT}" font-size="14" font-weight="800" fill="${C.black}" letter-spacing="3">SCAN TO DOWNLOAD</text>
      <svg x="40" y="60" width="240" height="210" viewBox="${qrViewBox}" preserveAspectRatio="xMidYMid meet">${qrInner}</svg>
      <text x="160" y="298" text-anchor="middle" font-family="${FONT}" font-size="14" font-weight="700" fill="${C.black}" opacity="0.6">thesamanapp.com/downloads</text>
    </g>

    <!-- Distribution row -->
    <g transform="translate(80 900)">
      <text x="0" y="30" font-family="${FONT}" font-size="20" font-weight="700" fill="${C.mute}" letter-spacing="2">AVAILABLE ON</text>
    </g>
    <g transform="translate(80 950)">
      <rect width="280" height="80" rx="16" fill="${C.white}"/>
      <text x="30" y="38" font-family="${FONT}" font-size="14" font-weight="600" fill="${C.black}">Download on the</text>
      <text x="30" y="65" font-family="${FONT}" font-size="28" font-weight="900" fill="${C.black}">App Store</text>
    </g>
    <g transform="translate(380 950)">
      <rect width="380" height="80" rx="16" fill="none" stroke="${C.white}" stroke-width="2"/>
      <text x="24" y="38" font-family="${FONT}" font-size="14" font-weight="600" fill="${C.mute}">Or visit</text>
      <text x="24" y="65" font-family="${FONT}" font-size="20" font-weight="900" fill="${C.white}">thesamanapp.com/downloads</text>
    </g>

    ${footer(7, TOTAL)}
  `;
  return svgWrap(content);
}

const SLIDES: Array<{ name: string; svg: () => string | Promise<string> }> = [
  { name: "01-title", svg: s1Title },
  { name: "02-what", svg: s2What },
  { name: "03-why", svg: s3Why },
  { name: "04-how", svg: s4How },
  { name: "05-cars", svg: s5Cars },
  { name: "06-parts", svg: s6Parts },
  { name: "07-cta", svg: s7CTA },
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(PNG_DIR, { recursive: true });

  const pngBuffers: Buffer[] = [];

  for (const slide of SLIDES) {
    const svg = await slide.svg();
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
