import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import PDFDocument from "pdfkit";

const W = 1080;
const H = 1350;
const OUT_DIR = path.join(process.cwd(), "exports", "saman-deck");
const PNG_DIR = path.join(OUT_DIR, "instagram");
const PDF_PATH = path.join(OUT_DIR, "saman-marketplace-deck.pdf");

const ORANGE = "#f97316";
const ORANGE_DARK = "#c2410c";
const BG_TOP = "#0b0f1a";
const BG_BOT = "#1a2438";
const WHITE = "#ffffff";
const MUTED = "#94a3b8";
const CARD = "#111827";

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const baseDefs = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${BG_TOP}"/>
      <stop offset="1" stop-color="${BG_BOT}"/>
    </linearGradient>
    <linearGradient id="orange" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fb923c"/>
      <stop offset="1" stop-color="${ORANGE_DARK}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${ORANGE}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${ORANGE}" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="20"/>
    </filter>
  </defs>
`;

const bg = `
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="${W * 0.85}" cy="${H * 0.15}" r="280" fill="url(#glow)" opacity="0.7"/>
  <circle cx="${W * 0.1}" cy="${H * 0.85}" r="220" fill="url(#glow)" opacity="0.45"/>
`;

const slideFooter = (n: number, total: number) => `
  <text x="80" y="${H - 60}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="22" fill="${MUTED}" font-weight="500">SAMAN MARKETPLACE</text>
  <text x="${W - 80}" y="${H - 60}" text-anchor="end" font-family="Inter, Helvetica, Arial, sans-serif" font-size="22" fill="${MUTED}" font-weight="600">${n} / ${total}</text>
  <line x1="80" y1="${H - 90}" x2="${W - 80}" y2="${H - 90}" stroke="${MUTED}" stroke-opacity="0.2" stroke-width="1"/>
`;

const eyebrow = (y: number, text: string) => `
  <g transform="translate(80 ${y})">
    <rect x="0" y="-28" width="14" height="14" rx="3" fill="${ORANGE}"/>
    <text x="28" y="-16" font-family="Inter, Helvetica, Arial, sans-serif" font-size="22" fill="${ORANGE}" font-weight="700" letter-spacing="3">${xml(text.toUpperCase())}</text>
  </g>
`;

function svgWrap(content: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${baseDefs}
  ${bg}
  ${content}
</svg>`;
}

const TOTAL = 10;

// ---- SLIDE 1: Cover ----
function slideCover() {
  const content = `
    <g transform="translate(${W / 2} ${H / 2 - 100})">
      <circle r="160" fill="url(#orange)"/>
      <text y="22" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="92" font-weight="900" fill="${WHITE}" letter-spacing="4">SAMAN</text>
    </g>
    <text x="${W / 2}" y="${H / 2 + 160}" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="56" font-weight="800" fill="${WHITE}">UAE's Automotive</text>
    <text x="${W / 2}" y="${H / 2 + 230}" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="56" font-weight="800" fill="${ORANGE}">Marketplace</text>
    <text x="${W / 2}" y="${H / 2 + 310}" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="28" font-weight="500" fill="${MUTED}">Cars · Spare Parts · Bilingual · Trusted</text>
    ${slideFooter(1, TOTAL)}
  `;
  return svgWrap(content);
}

// ---- SLIDE 2: Vision / bridging markets ----
function slideVision() {
  const cardX = 80;
  const cardW = W - 160;
  const content = `
    ${eyebrow(220, "Our Vision")}
    <text x="80" y="320" font-family="Inter, Helvetica, Arial, sans-serif" font-size="68" font-weight="900" fill="${WHITE}">Bridging two</text>
    <text x="80" y="395" font-family="Inter, Helvetica, Arial, sans-serif" font-size="68" font-weight="900" fill="${ORANGE}">communities.</text>

    <g transform="translate(${W / 2} 620)">
      <g transform="translate(-220 0)">
        <circle r="120" fill="${CARD}" stroke="${ORANGE}" stroke-width="3"/>
        <text y="-10" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="34" font-weight="800" fill="${WHITE}">Locals</text>
        <text y="35" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="22" fill="${MUTED}">العربية</text>
      </g>
      <g transform="translate(0 0)">
        <text y="15" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="60" font-weight="800" fill="${ORANGE}">⇄</text>
      </g>
      <g transform="translate(220 0)">
        <circle r="120" fill="${CARD}" stroke="${ORANGE}" stroke-width="3"/>
        <text y="-10" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="34" font-weight="800" fill="${WHITE}">Expats</text>
        <text y="35" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="22" fill="${MUTED}">English</text>
      </g>
    </g>

    <text x="${W / 2}" y="900" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="32" font-weight="500" fill="${WHITE}" opacity="0.9">One marketplace where everyone can</text>
    <text x="${W / 2}" y="945" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="32" font-weight="500" fill="${WHITE}" opacity="0.9">buy, sell, and connect — in their own language.</text>
    ${slideFooter(2, TOTAL)}
  `;
  return svgWrap(content);
}

// ---- SLIDE 3: What is Saman ----
function slideWhat() {
  const items = [
    { t: "Cars", s: "Buy & sell vehicles" },
    { t: "Spare Parts", s: "All makes & models" },
    { t: "Motorcycles", s: "Bikes & scooters" },
    { t: "Accessories", s: "Wheels, tires & more" },
  ];
  const cards = items
    .map((it, i) => {
      const x = 80 + (i % 2) * 460;
      const y = 540 + Math.floor(i / 2) * 230;
      return `
      <g transform="translate(${x} ${y})">
        <rect width="440" height="200" rx="24" fill="${CARD}" stroke="${ORANGE}" stroke-opacity="0.25" stroke-width="2"/>
        <rect x="28" y="28" width="56" height="56" rx="14" fill="url(#orange)"/>
        <text x="28" y="130" font-family="Inter, Helvetica, Arial, sans-serif" font-size="38" font-weight="800" fill="${WHITE}">${xml(it.t)}</text>
        <text x="28" y="170" font-family="Inter, Helvetica, Arial, sans-serif" font-size="22" fill="${MUTED}">${xml(it.s)}</text>
      </g>`;
    })
    .join("\n");

  const content = `
    ${eyebrow(220, "What is Saman?")}
    <text x="80" y="320" font-family="Inter, Helvetica, Arial, sans-serif" font-size="68" font-weight="900" fill="${WHITE}">The UAE's home for</text>
    <text x="80" y="395" font-family="Inter, Helvetica, Arial, sans-serif" font-size="68" font-weight="900" fill="${ORANGE}">everything automotive.</text>
    <text x="80" y="465" font-family="Inter, Helvetica, Arial, sans-serif" font-size="26" fill="${MUTED}">All in AED. All in one place.</text>
    ${cards}
    ${slideFooter(3, TOTAL)}
  `;
  return svgWrap(content);
}

// ---- SLIDE 4: Bilingual ----
function slideBilingual() {
  const content = `
    ${eyebrow(220, "Bilingual")}
    <text x="80" y="320" font-family="Inter, Helvetica, Arial, sans-serif" font-size="68" font-weight="900" fill="${WHITE}">Arabic. English.</text>
    <text x="80" y="395" font-family="Inter, Helvetica, Arial, sans-serif" font-size="68" font-weight="900" fill="${ORANGE}">One tap.</text>

    <g transform="translate(80 480)">
      <rect width="${W - 160}" height="220" rx="24" fill="${CARD}"/>
      <text x="32" y="60" font-family="Inter, Helvetica, Arial, sans-serif" font-size="22" fill="${MUTED}" font-weight="600">DESCRIPTION</text>
      <text x="32" y="110" font-family="Inter, Helvetica, Arial, sans-serif" font-size="32" fill="${WHITE}" font-weight="600">Audi R8 Twin Turbo · 2017 · 116,000 km</text>
      <text x="32" y="160" font-family="Inter, Helvetica, Arial, sans-serif" font-size="26" fill="${MUTED}">Fully built daily driver, details for serious buyers.</text>
      <g transform="translate(${W - 160 - 280} 165)">
        <rect width="240" height="44" rx="22" fill="url(#orange)"/>
        <text x="120" y="29" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="20" font-weight="700" fill="${WHITE}">Translate to English</text>
      </g>
    </g>

    <g transform="translate(80 730)">
      <rect width="${W - 160}" height="220" rx="24" fill="${CARD}"/>
      <text x="${W - 192}" y="60" text-anchor="end" font-family="Inter, Helvetica, Arial, sans-serif" font-size="22" fill="${MUTED}" font-weight="600">الوصف</text>
      <text x="${W - 192}" y="110" text-anchor="end" font-family="Inter, Helvetica, Arial, sans-serif" font-size="32" fill="${WHITE}" font-weight="600">أودي R8 · 2017 · 116,000 كم</text>
      <text x="${W - 192}" y="160" text-anchor="end" font-family="Inter, Helvetica, Arial, sans-serif" font-size="26" fill="${MUTED}">سيارة يومية مجهزة بالكامل، التفاصيل للجادين.</text>
      <g transform="translate(40 165)">
        <rect width="200" height="44" rx="22" fill="url(#orange)"/>
        <text x="100" y="29" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="20" font-weight="700" fill="${WHITE}">ترجم للعربية</text>
      </g>
    </g>

    <text x="${W / 2}" y="1030" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="26" fill="${MUTED}">Powered by AI translation — never lose a buyer to a language gap.</text>
    ${slideFooter(4, TOTAL)}
  `;
  return svgWrap(content);
}

// ---- SLIDE 5: Easy to list ----
function slideEasy() {
  const steps = [
    { n: "1", t: "Snap photos", s: "Up to 20 images per listing" },
    { n: "2", t: "Add details", s: "Title, price, year, mileage" },
    { n: "3", t: "Publish", s: "Live after quick review" },
  ];
  const items = steps
    .map((s, i) => {
      const y = 520 + i * 200;
      return `
      <g transform="translate(80 ${y})">
        <circle cx="60" cy="60" r="60" fill="url(#orange)"/>
        <text x="60" y="78" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="58" font-weight="900" fill="${WHITE}">${s.n}</text>
        <text x="160" y="50" font-family="Inter, Helvetica, Arial, sans-serif" font-size="44" font-weight="800" fill="${WHITE}">${xml(s.t)}</text>
        <text x="160" y="95" font-family="Inter, Helvetica, Arial, sans-serif" font-size="26" fill="${MUTED}">${xml(s.s)}</text>
      </g>`;
    })
    .join("\n");
  const content = `
    ${eyebrow(220, "Easy to use")}
    <text x="80" y="320" font-family="Inter, Helvetica, Arial, sans-serif" font-size="68" font-weight="900" fill="${WHITE}">List your item in</text>
    <text x="80" y="395" font-family="Inter, Helvetica, Arial, sans-serif" font-size="68" font-weight="900" fill="${ORANGE}">under a minute.</text>
    ${items}
    ${slideFooter(5, TOTAL)}
  `;
  return svgWrap(content);
}

// ---- SLIDE 6: Credits / subscriptions ----
function slideCredits() {
  const content = `
    ${eyebrow(220, "Credit System")}
    <text x="80" y="320" font-family="Inter, Helvetica, Arial, sans-serif" font-size="68" font-weight="900" fill="${WHITE}">Sell more.</text>
    <text x="80" y="395" font-family="Inter, Helvetica, Arial, sans-serif" font-size="68" font-weight="900" fill="${ORANGE}">Pay less.</text>

    <g transform="translate(80 480)">
      <rect width="${W - 160}" height="560" rx="28" fill="${CARD}"/>
      <g transform="translate(40 50)">
        <circle cx="40" cy="40" r="40" fill="url(#orange)"/>
        <text x="40" y="56" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="40" font-weight="900" fill="${WHITE}">★</text>
        <text x="110" y="35" font-family="Inter, Helvetica, Arial, sans-serif" font-size="34" font-weight="800" fill="${WHITE}">Subscription packages</text>
        <text x="110" y="72" font-family="Inter, Helvetica, Arial, sans-serif" font-size="24" fill="${MUTED}">Get listing credits each month at a discount.</text>
      </g>
      <g transform="translate(40 180)">
        <circle cx="40" cy="40" r="40" fill="url(#orange)"/>
        <text x="40" y="56" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="40" font-weight="900" fill="${WHITE}">↑</text>
        <text x="110" y="35" font-family="Inter, Helvetica, Arial, sans-serif" font-size="34" font-weight="800" fill="${WHITE}">Boost a listing</text>
        <text x="110" y="72" font-family="Inter, Helvetica, Arial, sans-serif" font-size="24" fill="${MUTED}">Push to the top of the feed when it matters.</text>
      </g>
      <g transform="translate(40 310)">
        <circle cx="40" cy="40" r="40" fill="url(#orange)"/>
        <text x="40" y="56" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="36" font-weight="900" fill="${WHITE}">⟳</text>
        <text x="110" y="35" font-family="Inter, Helvetica, Arial, sans-serif" font-size="34" font-weight="800" fill="${WHITE}">Renew anytime</text>
        <text x="110" y="72" font-family="Inter, Helvetica, Arial, sans-serif" font-size="24" fill="${MUTED}">Keep listings fresh — no need to repost.</text>
      </g>
      <g transform="translate(40 480)">
        <text x="0" y="0" font-family="Inter, Helvetica, Arial, sans-serif" font-size="24" fill="${MUTED}" font-weight="600">Pay with</text>
        <g transform="translate(140 -28)">
          <rect width="160" height="44" rx="10" fill="${WHITE}" opacity="0.12"/>
          <text x="80" y="29" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="20" font-weight="700" fill="${WHITE}">Apple Pay</text>
        </g>
        <g transform="translate(316 -28)">
          <rect width="120" height="44" rx="10" fill="${WHITE}" opacity="0.12"/>
          <text x="60" y="29" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="20" font-weight="700" fill="${WHITE}">Card</text>
        </g>
      </g>
    </g>
    ${slideFooter(6, TOTAL)}
  `;
  return svgWrap(content);
}

// ---- SLIDE 7: Browse smart ----
function slideBrowse() {
  const content = `
    ${eyebrow(220, "Find it fast")}
    <text x="80" y="320" font-family="Inter, Helvetica, Arial, sans-serif" font-size="68" font-weight="900" fill="${WHITE}">Search smart.</text>
    <text x="80" y="395" font-family="Inter, Helvetica, Arial, sans-serif" font-size="68" font-weight="900" fill="${ORANGE}">Filter sharper.</text>

    <g transform="translate(80 470)">
      <rect width="${W - 160}" height="78" rx="20" fill="${CARD}"/>
      <circle cx="50" cy="39" r="14" fill="none" stroke="${MUTED}" stroke-width="3"/>
      <line x1="60" y1="49" x2="74" y2="63" stroke="${MUTED}" stroke-width="3"/>
      <text x="100" y="48" font-family="Inter, Helvetica, Arial, sans-serif" font-size="26" fill="${MUTED}">Search Audi, Toyota, turbos…</text>
    </g>

    ${["Make", "Model", "Year", "Price", "Mileage", "Condition"]
      .map((label, i) => {
        const x = 80 + (i % 3) * 305;
        const y = 600 + Math.floor(i / 3) * 100;
        return `
        <g transform="translate(${x} ${y})">
          <rect width="285" height="76" rx="38" fill="${CARD}" stroke="${ORANGE}" stroke-opacity="0.3" stroke-width="2"/>
          <text x="142" y="48" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="26" font-weight="700" fill="${WHITE}">${xml(label)}</text>
        </g>`;
      })
      .join("\n")}

    <text x="80" y="900" font-family="Inter, Helvetica, Arial, sans-serif" font-size="30" fill="${WHITE}" opacity="0.9">Built-in filters get you to the right listing</text>
    <text x="80" y="945" font-family="Inter, Helvetica, Arial, sans-serif" font-size="30" fill="${WHITE}" opacity="0.9">in seconds — no scrolling forever.</text>
    ${slideFooter(7, TOTAL)}
  `;
  return svgWrap(content);
}

// ---- SLIDE 8: Trust ----
function slideTrust() {
  const items = [
    { t: "Phone Verified", s: "OTP for every account" },
    { t: "Reviewed Listings", s: "Admin moderation" },
    { t: "Direct Contact", s: "Call or WhatsApp the seller" },
    { t: "Secure Payments", s: "Telr · LIVE certified" },
  ];
  const cards = items
    .map((it, i) => {
      const x = 80 + (i % 2) * 460;
      const y = 510 + Math.floor(i / 2) * 220;
      return `
      <g transform="translate(${x} ${y})">
        <rect width="440" height="190" rx="24" fill="${CARD}"/>
        <circle cx="60" cy="60" r="32" fill="url(#orange)"/>
        <text x="60" y="74" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="32" font-weight="900" fill="${WHITE}">✓</text>
        <text x="120" y="55" font-family="Inter, Helvetica, Arial, sans-serif" font-size="30" font-weight="800" fill="${WHITE}">${xml(it.t)}</text>
        <text x="120" y="90" font-family="Inter, Helvetica, Arial, sans-serif" font-size="22" fill="${MUTED}">${xml(it.s)}</text>
      </g>`;
    })
    .join("\n");
  const content = `
    ${eyebrow(220, "Trust & safety")}
    <text x="80" y="320" font-family="Inter, Helvetica, Arial, sans-serif" font-size="68" font-weight="900" fill="${WHITE}">Every listing.</text>
    <text x="80" y="395" font-family="Inter, Helvetica, Arial, sans-serif" font-size="68" font-weight="900" fill="${ORANGE}">Every seller. Verified.</text>
    ${cards}
    ${slideFooter(8, TOTAL)}
  `;
  return svgWrap(content);
}

// ---- SLIDE 9: Available everywhere ----
function slideAvailable() {
  const content = `
    ${eyebrow(220, "Available now")}
    <text x="80" y="320" font-family="Inter, Helvetica, Arial, sans-serif" font-size="68" font-weight="900" fill="${WHITE}">On the App Store.</text>
    <text x="80" y="395" font-family="Inter, Helvetica, Arial, sans-serif" font-size="68" font-weight="900" fill="${ORANGE}">On the web.</text>

    <g transform="translate(${W / 2 - 240} 520)">
      <rect width="480" height="160" rx="32" fill="${WHITE}"/>
      <text x="60" y="65" font-family="Inter, Helvetica, Arial, sans-serif" font-size="22" fill="#0b0f1a" font-weight="600">Download on the</text>
      <text x="60" y="115" font-family="Inter, Helvetica, Arial, sans-serif" font-size="46" fill="#0b0f1a" font-weight="900">App Store</text>
      <text x="420" y="100" text-anchor="end" font-family="Inter, Helvetica, Arial, sans-serif" font-size="80" fill="#0b0f1a"></text>
    </g>

    <g transform="translate(${W / 2 - 240} 720)">
      <rect width="480" height="160" rx="32" fill="${CARD}" stroke="${ORANGE}" stroke-width="3"/>
      <text x="60" y="65" font-family="Inter, Helvetica, Arial, sans-serif" font-size="22" fill="${MUTED}" font-weight="600">Visit on the web</text>
      <text x="60" y="120" font-family="Inter, Helvetica, Arial, sans-serif" font-size="38" fill="${WHITE}" font-weight="900">thesamanapp.com</text>
    </g>

    <text x="${W / 2}" y="970" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="28" fill="${MUTED}">iPhone · Android · Web — your account, everywhere.</text>
    ${slideFooter(9, TOTAL)}
  `;
  return svgWrap(content);
}

// ---- SLIDE 10: CTA ----
function slideCTA() {
  const content = `
    <g transform="translate(${W / 2} ${H / 2 - 200})">
      <circle r="120" fill="url(#orange)"/>
      <text y="18" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="68" font-weight="900" fill="${WHITE}" letter-spacing="3">SAMAN</text>
    </g>
    <text x="${W / 2}" y="${H / 2 + 10}" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="80" font-weight="900" fill="${WHITE}">Ready to drive a</text>
    <text x="${W / 2}" y="${H / 2 + 95}" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="80" font-weight="900" fill="${ORANGE}">better deal?</text>

    <g transform="translate(${W / 2 - 220} ${H / 2 + 180})">
      <rect width="440" height="100" rx="50" fill="url(#orange)"/>
      <text x="220" y="65" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="34" font-weight="900" fill="${WHITE}">Download Saman</text>
    </g>

    <text x="${W / 2}" y="${H - 200}" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="28" fill="${WHITE}" opacity="0.9">thesamanapp.com</text>
    <text x="${W / 2}" y="${H - 160}" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="22" fill="${MUTED}">Available on iPhone, Android &amp; Web · Made in the UAE</text>
    ${slideFooter(10, TOTAL)}
  `;
  return svgWrap(content);
}

const SLIDES: Array<{ name: string; svg: () => string }> = [
  { name: "01-cover", svg: slideCover },
  { name: "02-vision", svg: slideVision },
  { name: "03-what", svg: slideWhat },
  { name: "04-bilingual", svg: slideBilingual },
  { name: "05-easy", svg: slideEasy },
  { name: "06-credits", svg: slideCredits },
  { name: "07-browse", svg: slideBrowse },
  { name: "08-trust", svg: slideTrust },
  { name: "09-available", svg: slideAvailable },
  { name: "10-cta", svg: slideCTA },
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
