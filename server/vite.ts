import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { buildSeoHeadForUrl, injectSeoIntoHtml } from "./seo";
import { storage } from "./storage";
import { listingPath } from "../shared/listing-slug";

const viteLogger = createLogger();

export async function setupVite(server: Server, app: Express) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use("/{*path}", async (req, res, next) => {
    const url = req.originalUrl;

    // 301 redirect: /product/123 (numeric-only) → /product/slug-123
    // Slugged URLs pass through to SEO rendering unchanged.
    const numericProductMatch = url.match(/^\/product\/(\d+)(?:[/?#]|$)/);
    if (numericProductMatch) {
      try {
        const id = parseInt(numericProductMatch[1], 10);
        const product = await storage.getProduct(id);
        if (product) {
          return res.redirect(301, listingPath(product.title, id));
        }
      } catch {
        // fall through to normal rendering on error
      }
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      let page = await vite.transformIndexHtml(url, template);
      const seo = await buildSeoHeadForUrl(url);
      if (seo) page = injectSeoIntoHtml(page, seo);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
