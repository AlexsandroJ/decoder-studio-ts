import { Router } from "express";
import UnifiedDataController from "../controllers/UnifiedDataController";

const router = Router();

//router.post("/", UnifiedDataController.ingest);
router.get("/", UnifiedDataController.list);
router.get("/range", UnifiedDataController.getByTimeRange);
router.get("/:id", UnifiedDataController.getById);
router.post("/merge", UnifiedDataController.merge);
router.delete("/", UnifiedDataController.clear);

export default router;
