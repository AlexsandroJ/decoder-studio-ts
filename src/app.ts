require('dotenv').config();
import express from "express";
import cors from "cors";
import routes from "./routes";
import path from "path";
import { requestLogger } from "./middlewares/requestLogger";
import { errorHandler } from "./middlewares/errorHandler";
// Importa o módulo de métricas
import { metricsMiddleware, getMetrics, getContentType } from "./metrics/prometheus";

const app = express();

// ── Middlewares globais ──
app.use(cors({
  origin: '*', // Permite todas as origens
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(metricsMiddleware);
app.use(requestLogger);

// ── Rotas ──
app.use("/api", routes);

// Servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

/**/
// Rota para acessar o dashboard
app.get('/studio', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'decoder-studio.html'));
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({ message: 'API CAN está funcionando!' });
});

// ── Endpoint de Métricas para o Prometheus (Porta 3001) ──
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', getContentType());
  res.send(await getMetrics());
});

// ── 404 ──
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Rota não encontrada." });
});

// ── Error handler ──
app.use(errorHandler);

export default app;
