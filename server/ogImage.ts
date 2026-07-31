import sharp from "sharp";
import path from "path";
import fs from "fs";

// Generates a branded 1200x630 Open Graph card for seller store pages.
// Used as the og:image when a seller has no profile photo, so shared
// links in WhatsApp/social apps still look like a Saman store card.

const CARD_W = 1200;
const CARD_H = 630;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "S";
  const first = parts[0][0] || "";
  const second = parts.length > 1 ? parts[parts.length - 1][0] || "" : "";
  return (first + second).toUpperCase();
}

let logoBufferPromise: Promise<Buffer | null> | null = null;
function getLogoBuffer(): Promise<Buffer | null> {
  if (!logoBufferPromise) {
    logoBufferPromise = (async () => {
      try {
        const candidates = [
          path.resolve(import.meta.dirname, "..", "client", "public", "icon-512.png"),
          path.resolve(import.meta.dirname, "public", "icon-512.png"),
        ];
        for (const p of candidates) {
          if (fs.existsSync(p)) {
            return await sharp(p).resize(72, 72).png().toBuffer();
          }
        }
      } catch {}
      return null;
    })();
  }
  return logoBufferPromise;
}

export async function generateSellerOgCard(
  name: string,
  listingCount: number
): Promise<Buffer> {
  const safeName = escapeXml(name.length > 34 ? name.slice(0, 33) + "…" : name);
  const initials = escapeXml(initialsOf(name));
  const sub =
    listingCount > 0
      ? `${listingCount} listing${listingCount === 1 ? "" : "s"} · Auto parts &amp; vehicles in the UAE`
      : "Auto parts &amp; vehicles in the UAE";

  const svg = `<svg width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#27272a"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#fb923c"/>
    </linearGradient>
  </defs>
  <rect width="${CARD_W}" height="${CARD_H}" fill="url(#bg)"/>
  <circle cx="1120" cy="-40" r="260" fill="#f97316" opacity="0.12"/>
  <circle cx="80" cy="680" r="300" fill="#f97316" opacity="0.10"/>
  <rect x="0" y="0" width="${CARD_W}" height="10" fill="url(#accent)"/>
  <circle cx="180" cy="290" r="90" fill="url(#accent)"/>
  <text x="180" y="290" text-anchor="middle" dominant-baseline="central" font-family="DejaVu Sans, Arial, sans-serif" font-size="72" font-weight="700" fill="#ffffff">${initials}</text>
  <text x="320" y="272" font-family="DejaVu Sans, Arial, sans-serif" font-size="58" font-weight="700" fill="#ffffff">${safeName}</text>
  <text x="320" y="330" font-family="DejaVu Sans, Arial, sans-serif" font-size="30" fill="#f97316" font-weight="600">Seller Store</text>
  <text x="320" y="382" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" fill="#d4d4d8">${sub}</text>
  <line x1="90" y1="500" x2="1110" y2="500" stroke="#3f3f46" stroke-width="2"/>
  <text x="182" y="560" font-family="DejaVu Sans, Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff">Saman Marketplace</text>
  <text x="182" y="595" font-family="DejaVu Sans, Arial, sans-serif" font-size="24" fill="#a1a1aa">thesamanapp.com · سوق سامان</text>
</svg>`;

  let image = sharp(Buffer.from(svg));
  const logo = await getLogoBuffer();
  if (logo) {
    image = sharp(await image.png().toBuffer()).composite([
      { input: logo, left: 90, top: 528 },
    ]);
  }
  return image.png().toBuffer();
}
