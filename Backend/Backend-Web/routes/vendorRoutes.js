import express from "express";
import vendorsController from "../controllers/vendors/vendorsController.js";

const router = express.Router();

router.post("/", vendorsController.createVendor);
router.get("/", vendorsController.getAllVendors);
router.get(
  "/collector/:collectorId",
  vendorsController.getVendorsByCollectorId
);
router.get("/:id", vendorsController.getVendorById);
router.put("/:id", vendorsController.updateVendor);
router.delete("/:id", vendorsController.deleteVendor);

export default router;
