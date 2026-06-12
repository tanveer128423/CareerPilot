/**
 * rolesController.ts
 *
 * GET /api/roles — returns the curated supported roles (id, name, required,
 * niceToHave, keywords) from roles.json so the client can render the role
 * selector and preview requirements.
 *
 * @module controllers/rolesController
 */

import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import rolesData from "../data/roles.json" with { type: "json" };

interface RoleRecord {
  id: string;
  name: string;
  required: string[];
  niceToHave: string[];
  keywords: string[];
  [k: string]: unknown;
}

export function getRoles(_req: Request, res: Response, next: NextFunction): void {
  try {
    const source = (rolesData as { roles?: RoleRecord[] }).roles;
    if (!Array.isArray(source)) {
      throw new AppError("INTERNAL_ERROR", "Roles data is unavailable.");
    }
    // Project only the client-facing fields (API_CONTRACTS.md §2).
    const roles = source.map((r) => ({
      id: r.id,
      name: r.name,
      required: r.required,
      niceToHave: r.niceToHave,
      keywords: r.keywords,
    }));
    res.status(200).json({ roles });
  } catch (err) {
    next(err);
  }
}

export default getRoles;
