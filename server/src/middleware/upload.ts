/**
 * upload.ts
 *
 * Multer middleware for the single-file resume upload on /api/parse. Uses memory
 * storage (no disk writes — stateless), enforces the 5 MB size limit, and accepts
 * only PDF and DOCX. Rejections become typed AppErrors.
 *
 * @module middleware/upload
 */

import multer from "multer";
import type { Request } from "express";
import { CONFIG } from "../config.js";
import { AppError } from "../utils/AppError.js";

const ACCEPTED_MIME = new Set<string>([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const storage = multer.memoryStorage();

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  if (ACCEPTED_MIME.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "UNSUPPORTED_FILE_TYPE",
        "Unsupported file type. Please upload a PDF or DOCX file.",
      ),
    );
  }
}

export const upload = multer({
  storage,
  limits: { fileSize: CONFIG.MAX_FILE_SIZE, files: 1 },
  fileFilter,
});

/** Convenience middleware for the single `file` field used by /api/parse. */
export const uploadSingle = upload.single("file");

export default upload;
