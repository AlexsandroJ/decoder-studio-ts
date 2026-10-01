// ⚠️ IMPORTANTE: Deve ser a PRIMEIRA linha do arquivo
import './observability/otel'; 
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
import { 
  connectMQTT, 
  disconnectMQTT, 
  startLatencyMonitoring, 
  stopLatencyMonitoring 
} from './mqtt/mqttClient';

const PORT = parseInt(process.env.PORT ?? "3001", 10);
const HOST = process.env.HOST ?? "0.0.0.0";
const NODE_ENV = process.env.NODE_ENV || "development";
const USE_HTTPS = process.env.USE_HTTPS === "true";

// 🆕 Configurações do Teste de Latência
const ENABLE_LATENCY_TEST = process.env.ENABLE_LATENCY_TEST === "true";
const LATENCY_TEST_DEVICE_ID = process.env.LATENCY_TEST_DEVICE_ID || "moto_001";
const LATENCY_INTERVAL_MS = parseInt(process.env.LATENCY_INTERVAL_MS ?? "2000", 10);

async function startServer() {
  try {
    console.log(`\n🔄 [${NODE_ENV.toUpperCase()}] Iniciando inicialização (bootstrap)...`);
    
    // 1. Inicia o OpenTelemetry
    startObservability();
    
    // 2. Conecta aos serviços externos
    connectDB();
    connectMQTT();
    bootstrap();

    // 🆕 3. Inicia o monitoramento de latência APÓS a tentativa de conexão do MQTT
    // Usamos um pequeno delay para garantir que o evento 'connect' do MQTT já tenha ocorrido
    if (ENABLE_LATENCY_TEST) {
      setTimeout(() => {
        console.log(`⏱️ [TESTE] Iniciando monitoramento de latência para '${LATENCY_TEST_DEVICE_ID}' a cada ${LATENCY_INTERVAL_MS}ms`);
        startLatencyMonitoring(LATENCY_TEST_DEVICE_ID, LATENCY_INTERVAL_MS);
      }, 2000); // 2 segundos é tempo suficiente para o MQTT conectar
    }

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
  ⏱️  Latency Test: ${ENABLE_LATENCY_TEST ? `ATIVO (${LATENCY_TEST_DEVICE_ID})`.padEnd(30) : "INATIVO".padEnd(30)}
══════════════════════════════════════════════════════════
      `);
    });

    // ── Graceful Shutdown ──
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Sinal ${signal} recebido. Iniciando desligamento gracioso...`);
      
      // 🆕 Para imediatamente o envio de pings de latência
      stopLatencyMonitoring();

      server.close(async () => {
        // 🆕 Adicionado 'await' para garantir que a desconexão do MQTT termine antes de sair
        await disconnectMQTT();
        await disconnectDB();
        
        // Desliga o OpenTelemetry para garantir que os últimos dados (spans/metrics) sejam enviados
        await shutdownObservability();
        
        console.log("✅ Servidor fechado. Conexões e telemetria encerradas com sucesso.");
        process.exit(0);
      });
      
      // Fallback de segurança: força o encerramento se algo travar no shutdown
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
