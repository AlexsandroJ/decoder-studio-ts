// ⚠️ IMPORTANTE: Deve ser a PRIMEIRA linha do arquivo
import './observability/otel'; 
// Importação direta das funções
import { startObservability, shutdownObservability } from "./observability/otel";

import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { bootstrap } from "./bootstrap";
import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import { connectDB, disconnectDB } from './config/db';
import { connectMQTT, disconnectMQTT } from './mqtt/mqttClient';

const PORT = parseInt(process.env.PORT ?? "3001", 10);
const HOST = process.env.HOST ?? "0.0.0.0";
const NODE_ENV = process.env.NODE_ENV || "development";
const USE_HTTPS = process.env.USE_HTTPS === "true";

async function startServer() {
  try {
    console.log(`\n🔄 [${NODE_ENV.toUpperCase()}] Iniciando inicialização (bootstrap)...`);
    
    // Inicia o OpenTelemetry
    startObservability();
    
    connectDB();
    connectMQTT();
    bootstrap();

    let server: http.Server | https.Server;

    if (USE_HTTPS) {
      const keyPath = process.env.SSL_KEY_PATH || path.join(__dirname, "./certs/key.pem");
      const certPath = process.env.SSL_CERT_PATH || path.join(__dirname, "./certs/cert.pem");

      if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
        console.error("❌ Erro: Arquivos de certificado SSL não encontrados.");
        process.exit(1);
      }

      const options = { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
      server = https.createServer(options, app);
    } else {
      server = http.createServer(app);
    }

    server.listen(PORT, HOST, () => {
      const protocol = USE_HTTPS ? "https" : "http";
      const url = `${protocol}://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}`;
      
      console.log(`
══════════════════════════════════════════════════════════
  🔧  CAN + Sensor Unified API                             
  🌐  ${url.padEnd(53)} 
  🔒  Protocolo: ${(USE_HTTPS ? "HTTPS (SSL/TLS)" : "HTTP").padEnd(42)} 
  🌍  Ambiente: ${NODE_ENV.toUpperCase().padEnd(42)} 
  📊  Métricas OTel: http://localhost:9464/metrics
─────────────────────────────────────────────────────────
  📡  /api/can/frames      — ingestão CAN                 
  🌡️   /api/sensors         — dados de sensores            
  📖  /api/decoding/rules  — regras DBC                   
  🔗  /api/unified         — dados unificados             
  ❤️   /api/health          — health check                 
══════════════════════════════════════════════════════════
      `);
    });

    // ── Graceful Shutdown ──
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Sinal ${signal} recebido. Iniciando desligamento gracioso...`);
      
      server.close(async () => {
        disconnectMQTT();
        disconnectDB();
        
        // Desliga o OpenTelemetry para garantir que os últimos dados sejam enviados
        await shutdownObservability();
        
        console.log("✅ Servidor fechado. Conexões e telemetria encerradas.");
        process.exit(0);
      });
      
      setTimeout(() => {
        console.error("⚠️ Desligamento forçado após timeout de 10s.");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    process.on("uncaughtException", (error) => {
      console.error("💥 Uncaught Exception:", error);
      process.exit(1);
    });

    process.on("unhandledRejection", (reason, promise) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
      if (NODE_ENV === "production") process.exit(1);
    });

  } catch (error) {
    console.error("❌ Falha crítica durante o bootstrap:", error);
    process.exit(1);
  }
}

startServer();