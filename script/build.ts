import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, mkdir, copyFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  // Copy .well-known folder for Apple Pay domain verification to static public folder
  const wellKnownSrc = ".well-known";
  const wellKnownDest = "dist/public/.well-known";
  if (existsSync(wellKnownSrc)) {
    console.log("copying .well-known folder to dist/public...");
    await mkdir(wellKnownDest, { recursive: true });
    const applePayFile = "apple-developer-merchantid-domain-association.txt";
    if (existsSync(path.join(wellKnownSrc, applePayFile))) {
      await copyFile(
        path.join(wellKnownSrc, applePayFile),
        path.join(wellKnownDest, applePayFile)
      );
      console.log("Apple Pay verification file copied successfully");
    }
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
