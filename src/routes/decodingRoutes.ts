import { Router } from "express";
import DecodingController from "../controllers/DecodingController";

const router = Router();

router.post("/rules", DecodingController.create);
router.get("/rules", DecodingController.list);
//router.get("/rules/:id", DecodingController.getById);
router.delete("/rules/:id", DecodingController.delete);
//router.delete("/rules", DecodingController.clear);

export default router;
