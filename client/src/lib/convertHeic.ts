// iPhones save photos as HEIC by default. Browsers can't render HEIC and the
// server's image processor (sharp/libvips) has no HEIC decoder built in, so a
// raw HEIC upload shows up as a broken image everywhere. To prevent this we
// detect HEIC files in the browser and convert them to JPEG before upload.
//
// The heic2any library is heavy (libheif compiled to wasm), so it is loaded
// lazily — only when an actual HEIC file is detected.

const HEIF_BRANDS = new Set([
  "heic",
  "heix",
  "heim",
  "heis",
  "hevc",
  "hevx",
  "hevm",
  "hevs",
  "mif1",
  "msf1",
]);

/**
 * Detect whether a file is HEIC/HEIF. file.type is unreliable across browsers
 * (often empty), so we also sniff the ISO-BMFF "ftyp" box brand from the first
 * bytes of the file.
 */
export async function isHeicFile(file: File): Promise<boolean> {
  if (/^image\/(heic|heif)/i.test(file.type)) return true;
  if (/\.(heic|heif)$/i.test(file.name)) return true;
  try {
    const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    // bytes 4-7 must spell "ftyp"
    const box = String.fromCharCode(header[4], header[5], header[6], header[7]);
    if (box !== "ftyp") return false;
    const brand = String.fromCharCode(
      header[8],
      header[9],
      header[10],
      header[11],
    ).toLowerCase();
    return HEIF_BRANDS.has(brand);
  } catch {
    return false;
  }
}

/**
 * If the given file is HEIC/HEIF, convert it to a JPEG File. Otherwise return
 * the file unchanged. If conversion fails for any reason, the original file is
 * returned so the upload still proceeds (and we surface the issue in the
 * console) rather than blocking the user entirely.
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  if (!(await isHeicFile(file))) return file;

  try {
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9,
    });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    const baseName = file.name.replace(/\.(heic|heif)$/i, "") || "photo";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch (err) {
    console.error("HEIC conversion failed, uploading original file", err);
    return file;
  }
}
