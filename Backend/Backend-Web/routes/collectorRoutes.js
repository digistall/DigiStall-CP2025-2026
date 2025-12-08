import express from "express";
import collectorsController from "../controllers/collectors/collectorsController.js";

const router = express.Router();

router.post("/", collectorsController.createCollector);
router.get("/", collectorsController.getAllCollectors);
router.get("/:id", collectorsController.getCollectorById);
router.put("/:id", collectorsController.updateCollector);
router.delete("/:id", collectorsController.deleteCollector);

export default router;
