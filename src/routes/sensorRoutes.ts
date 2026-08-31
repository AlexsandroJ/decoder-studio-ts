import { Router } from "express";
import SensorDataController from "../controllers/SensorDataController";

const router = Router();

router.post("/", SensorDataController.ingest);
router.get("/", SensorDataController.list);
router.get("/:id", SensorDataController.getById);
router.delete("/", SensorDataController.clear);

export default router;
