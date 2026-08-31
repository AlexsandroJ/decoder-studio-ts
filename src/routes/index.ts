import { Router } from "express";
import canRoutes from "./canRoutes";
import sensorRoutes from "./sensorRoutes";
import decodingRoutes from "./decodingRoutes";
import unifiedRoutes from "./unifiedRoutes";

const router = Router();

router.use("/can", canRoutes);
router.use("/sensors", sensorRoutes);
router.use("/decoding", decodingRoutes);
router.use("/unified", unifiedRoutes);

// Health check
router.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

export default router;
