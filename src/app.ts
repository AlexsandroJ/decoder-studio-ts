import express from "express";
import cors from "cors";
import routes from "./routes";
import { requestLogger } from "./middlewares/requestLogger";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

// ── Middlewares globais ──
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ── Rotas ──
app.use("/api", routes);

// ── 404 ──
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Rota não encontrada." });
});

// ── Error handler ──
app.use(errorHandler);

export default app;
