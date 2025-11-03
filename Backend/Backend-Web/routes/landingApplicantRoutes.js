import express from "express";
import { applicantController } from "../controllers/applicantsLanding/applicantController.js";

const router = express.Router();

// Landing page applicant routes (public routes - no authentication required)
router.post("/stall-application", applicantController.createStallApplication); // POST /api/landing-applicants/stall-application - Submit complete stall application from landing page
router.post("/", applicantController.createApplicant); // POST /api/landing-applicants - Create new applicant
router.get("/", applicantController.getAllApplicants); // GET /api/landing-applicants - Get all applicants
router.get("/:id", applicantController.getApplicantById); // GET /api/landing-applicants/:id - Get applicant by ID
router.put("/:id", applicantController.updateApplicant); // PUT /api/landing-applicants/:id - Update applicant
router.delete("/:id", applicantController.deleteApplicant); // DELETE /api/landing-applicants/:id - Delete applicant

export default router;