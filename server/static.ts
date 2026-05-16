import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { buildSeoHeadForUrl, injectSeoIntoHtml } from "./seo";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // `index: false` disables auto-serving index.html for "/". We route all
  // HTML responses through the catch-all below so SEO injection and the
  // X-Robots-Tag / Cache-Control headers are applied consistently.
  app.use(express.static(distPath, { dotfiles: 'allow', index: false }));

  // fall through to index.html if the file doesn't exist;
  // inject per-page SEO (e.g. product JSON-LD) when applicable.
  app.use("/{*path}", async (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    // Explicitly tell crawlers the page is indexable. Defensive: the HTML
    // already has <meta name="robots" content="index, follow"> but some
    // SEO auditors check the HTTP header too.
    res.setHeader("X-Robots-Tag", "index, follow");
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    try {
      const seo = await buildSeoHeadForUrl(req.originalUrl);
      if (seo) {
        const html = await fs.promises.readFile(indexPath, "utf-8");
        const page = injectSeoIntoHtml(html, seo);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
        return;
      }
    } catch {
      // fall through to plain index.html
    }
    res.sendFile(indexPath);
  });
}
