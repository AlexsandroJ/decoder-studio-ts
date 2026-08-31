import app from "./app";
import { bootstrap } from "./bootstrap";

const PORT = parseInt(process.env.PORT ?? "3001", 10);
const HOST = process.env.HOST ?? "0.0.0.0";

// ── Bootstrap ANTES de iniciar o servidor ──


// ── Inicia o servidor ──
app.listen(PORT, HOST, () => {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║   🔧  CAN + Sensor Unified API                  ║
  ║   🌐  http://${HOST}:${PORT}                      ║
  ║   📡  /api/can/frames      — ingestão CAN       ║
  ║   🌡️  /api/sensors         — dados de sensores  ║
  ║   📖  /api/decoding/rules  — regras DBC         ║
  ║   🔗  /api/unified         — dados unificados   ║
  ║   ❤️  /api/health          — health check       ║
  ╚══════════════════════════════════════════════════╝
  `);
});

bootstrap();