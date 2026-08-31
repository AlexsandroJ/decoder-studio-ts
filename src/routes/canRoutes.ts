import { Router } from "express";
import CanDataController from "../controllers/CanDataController";

const router = Router();

router.post("/frames", CanDataController.ingest);
router.get("/frames", CanDataController.list);
router.get("/frames/:id", CanDataController.getById);
router.delete("/frames", CanDataController.clear);

export default router;
