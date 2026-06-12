import express from "express";
import { applicantController } from "../BACKEND/PUBLIC/applicantsLanding/applicantController.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validateRequest.js";
import { createStallApplicationSchema, createApplicantSchema } from "../middleware/schemas/applicantSchemas.js";

const router = express.Router();

// Landing page applicant routes (public routes - no authentication required)
router.post("/stall-application", authLimiter, validate(createStallApplicationSchema), applicantController.createStallApplication); // POST /api/landing-applicants/stall-application - Submit complete stall application from landing page
router.post("/", authLimiter, validate(createApplicantSchema), applicantController.createApplicant); // POST /api/landing-applicants - Create new applicant
router.get("/", applicantController.getAllApplicants); // GET /api/landing-applicants - Get all applicants
router.get("/:id", applicantController.getApplicantById); // GET /api/landing-applicants/:id - Get applicant by ID
router.put("/:id", applicantController.updateApplicant); // PUT /api/landing-applicants/:id - Update applicant
router.delete("/:id", applicantController.deleteApplicant); // DELETE /api/landing-applicants/:id - Delete applicant

export default router;
