import type { Express } from "express";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

/**
 * Register object storage routes for file uploads.
 *
 * This provides example routes for the presigned URL upload flow:
 * 1. POST /api/uploads/request-url - Get a presigned URL for uploading
 * 2. The client then uploads directly to the presigned URL
 *
 * IMPORTANT: These are example routes. Customize based on your use case:
 * - Add authentication middleware for protected uploads
 * - Add file metadata storage (save to database after upload)
 * - Add ACL policies for access control
 */
export function registerObjectStorageRoutes(app: Express): void {
  const objectStorageService = new ObjectStorageService();

  /**
   * Request a presigned URL for file upload.
   *
   * Request body (JSON):
   * {
   *   "name": "filename.jpg",
   *   "size": 12345,
   *   "contentType": "image/jpeg"
   * }
   *
   * Response:
   * {
   *   "uploadURL": "https://storage.googleapis.com/...",
   *   "objectPath": "/objects/uploads/uuid"
   * }
   *
   * IMPORTANT: The client should NOT send the file to this endpoint.
   * Send JSON metadata only, then upload the file directly to uploadURL.
   */
  app.post("/api/uploads/request-url", async (req, res) => {
    try {
      const { name, size, contentType } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "Missing required field: name",
        });
      }

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();

      // Extract object path from the presigned URL for later reference
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      res.json({
        uploadURL,
        objectPath,
        // Echo back the metadata for client convenience
        metadata: { name, size, contentType },
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  /**
   * Serve uploaded objects.
   *
   * GET /objects/:objectPath(*)
   *
   * This serves files from object storage. For public files, no auth needed.
   * For protected files, add authentication middleware and ACL checks.
   */
  app.get(/^\/objects\/(.*)/, async (req, res) => {
    try {
      const objectPath = req.params[0];
      const objectFile = await objectStorageService.getObjectEntityFile(`/objects/${objectPath}`);
      const signedUrl = await objectStorageService.getSignedDownloadURL(objectFile);
      // Cache the 302 redirect for ~20 hours. The redirect points to a signed
      // GCS URL that expires in 5-6 days, so 20h is always safely inside the
      // signed-URL lifetime.
      //
      // IMPORTANT: do NOT add stale-while-revalidate here. SWR would let
      // browsers serve a stale redirect for days AFTER the underlying signed
      // URL has already expired — that was the cause of "images occasionally
      // break" for users who opened the app 5-7 days after first loading it.
      // 5 minutes: short enough that a stale/bad redirect self-heals quickly
      // on mobile WebViews, long enough to still benefit performance for
      // back-to-back requests within a session.
      res.set(
        "Cache-Control",
        "public, max-age=300, s-maxage=300",
      );
      return res.redirect(302, signedUrl);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}

