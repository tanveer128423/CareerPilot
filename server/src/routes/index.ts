/**
 * routes/index.ts
 *
 * Central API router. Phase 1 mounts the two read-only endpoints; later phases
 * add /parse, /analyze, and /mentor here.
 *
 * @module routes
 */

import { Router } from "express";
import { getHealth } from "../controllers/healthController.js";
import { getRoles } from "../controllers/rolesController.js";
import { postParse } from "../controllers/parseController.js";
import { postAnalyze } from "../controllers/analyzeController.js";
import { postExtractRole } from "../controllers/extractRoleController.js";
import { postMentor } from "../controllers/mentorController.js";
import { postValidateKey } from "../controllers/validateKeyController.js";
import { uploadSingle } from "../middleware/upload.js";

const router = Router();

router.get("/health", getHealth);
router.get("/roles", getRoles);

// Multipart upload: multer runs first (file type/size guards), then the controller.
router.post("/parse", uploadSingle, postParse);

// Parse a pasted job description into a structured role (AI extraction).
router.post("/extract-role", postExtractRole);

// Deterministic analysis (JSON body already parsed by express.json in server.ts).
router.post("/analyze", postAnalyze);

// Grounded, non-streaming AI mentor.
router.post("/mentor", postMentor);

// Verify a user-supplied Gemini API key before relying on it (token-free check).
router.post("/validate-key", postValidateKey);

export default router;
