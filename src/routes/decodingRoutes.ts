import { Router } from "express";
import DecodingController from "../controllers/DecodingController";

const router = Router();

router.post("/rules", DecodingController.create);
router.get("/rules", DecodingController.list);
router.put("/rules/:id", DecodingController.update);
router.delete("/rules/:id", DecodingController.delete);

export default router;
