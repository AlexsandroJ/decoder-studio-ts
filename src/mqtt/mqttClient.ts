import dotenv from "dotenv";
dotenv.config();

import * as fs from 'fs';
import path from 'path';
import * as mqtt from 'mqtt';
import { v4 as uuid } from 'uuid';
import { ICanFrame, IUnifiedRecord, ISensorData } from '../types'; 
import CanFrameModel from '../models/CanFrameModel';
import UnifiedDataService from '../services/UnifiedDataService'; 
import { SensorDataService } from '../models/SensorDataModel';   

// ════════════════════════════════════════════════════════
//  TIPOS
// ════════════════════════════════════════════════════════

interface CanPayload {
  deviceId?: string;
  canId: string;
  data: string | number[];
  dlc?: number;
  timestamp?: number;
  interface?: string;
}

interface SensorPayload {
  id?: string;
  sensorId: string;
  sensorType?: string;
  value: any; 
  unit?: string;
  timestamp?: number;
  metadata?: Record<string, any>;
  deviceId?: string;
}

interface CustomPayload {
  source: string;
  data?: Record<string, any>;
  customData?: Record<string, any>;
  timestamp?: number;
  tags?: string[];
  [key: string]: any;
}

type MqttPayload = CanPayload | SensorPayload | CustomPayload;

// ════════════════════════════════════════════════════════
//  CONFIGURAÇÃO
// ════════════════════════════════════════════════════════

const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
// ⚠️ RECOMENDADO: Use a estrutura de tópicos com wildcard para capturar todas as motos e tipos

const MQTT_TOPICS_RAW = process.env.MQTT_TOPIC || 'moto/+/can, /moto/+/sensores';
const MQTT_TOPIC: string[] = MQTT_TOPICS_RAW
  .split(',')
  .map(t => t.trim())
  .filter(t => t.length > 0);



let client: mqtt.MqttClient | null = null;
let latencyInterval: NodeJS.Timeout | null = null; // Controle do intervalo de latência

// ════════════════════════════════════════════════════════
//  FUNÇÕES DE DETECÇÃO E CONVERSÃO
// ════════════════════════════════════════════════════════

function isCanPayload(payload: any): payload is CanPayload {
  return typeof payload === 'object' && payload !== null && payload.canId !== undefined && payload.data !== undefined;
}

function isSensorPayload(payload: any): payload is SensorPayload {
  return typeof payload === 'object' && payload !== null && payload.sensorId !== undefined && payload.value !== undefined;
}

function canPayloadToFrame(payload: CanPayload): ICanFrame {
  const rawHex = Array.isArray(payload.data)
    ? payload.data.map(b => (b & 0xff).toString(16).toUpperCase().padStart(2, '0')).join('')
    : String(payload.data);

  const dataHex = (rawHex.length % 2 !== 0 ? '0' + rawHex : rawHex).toUpperCase();

  return {
    id: uuid(),
    canId: payload.canId,
    dlc: payload.dlc ?? Math.ceil(dataHex.length / 2),
    data: dataHex,
    timestamp: Date.now(),
    interface: payload.interface || 'mqtt',
  };
}

function customPayloadToUnified(payload: CustomPayload): IUnifiedRecord {
  return {
    id: uuid(),
    timestamp: payload.timestamp ?? Date.now(),
    source: payload.source || 'custom',
    customData: payload.customData || payload.data || {},
    tags: payload.tags || ['mqtt-ingestion'],
  };
}

// ════════════════════════════════════════════════════════
//  PROCESSAMENTO
// ════════════════════════════════════════════════════════

async function processCanFrames(payloads: CanPayload[]): Promise<ICanFrame[]> {
  const frames: ICanFrame[] = payloads.map(canPayloadToFrame);

  const invalid = frames.filter(f => !f.canId || !f.data);
  if (invalid.length > 0) {
    throw new Error(`${invalid.length} frame(s) CAN inválido(s)`);
  }

  const saved = await CanFrameModel.insertMany(frames);
  const UnifiedDataProcessor = (await import("../services/UnifiedDataService")).default;
  const unified = await UnifiedDataProcessor.ingestCanFrames(saved);

  console.log(`✅ CAN: ${saved.length} frame(s) | ${unified.length} unificado(s)`);
  return saved;
}

async function processSensorData(payloads: SensorPayload[]): Promise<ISensorData[]> {
  const readings: Partial<ISensorData>[] = payloads.map((s: any) => ({
    id: s.id || uuid(),
    sensorId: String(s.sensorId),
    sensorType: String(s.sensorType || "generic"),
    value: s.value,
    unit: s.unit ? String(s.unit) : undefined,
    timestamp: s.timestamp,
    metadata: s.metadata || undefined,
    deviceId: s.deviceId ? String(s.deviceId) : undefined
  }));

  const invalid = readings.filter(r => !r.sensorId);
  if (invalid.length > 0) {
    throw new Error(`${invalid.length} leitura(s) de sensor inválida(s): 'sensorId' é obrigatório.`);
  }

  const saved = await SensorDataService.insertMany(readings);

  const unifiedRecords: Partial<IUnifiedRecord>[] = saved.map((s: any) => ({
    id: uuid(),
    timestamp: s.timestamp,
    source: "sensor",
    sensorReadings: [{
      id: s.id,
      sensorId: s.sensorId,
      sensorType: s.sensorType,
      value: s.value,
      unit: s.unit,
      timestamp: s.timestamp
    }],
    tags: s.metadata ? ["has_metadata", "mqtt-sensor"] : ["mqtt-sensor"]
  }));

  await UnifiedDataService.insertMany(unifiedRecords);

  console.log(`✅ SENSOR: ${saved.length} leitura(s) processada(s) e unificada(s)`);
  return saved as ISensorData[];
}

async function processCustomData(payloads: CustomPayload[]): Promise<IUnifiedRecord[]> {
  const records: IUnifiedRecord[] = payloads.map(customPayloadToUnified);
  const saved = await UnifiedDataService.insertMany(records);
  return saved;
}

async function processMqttMessage(rawData: any): Promise<void> {
  const payloads: any[] = Array.isArray(rawData) ? rawData : [rawData];

  const canPayloads: CanPayload[] = [];
  const sensorPayloads: SensorPayload[] = [];
  const customPayloads: CustomPayload[] = [];

  payloads.forEach(p => {
    if (isCanPayload(p)) {
      canPayloads.push(p);
    } else if (isSensorPayload(p)) {
      sensorPayloads.push(p);
    } else {
      customPayloads.push(p);
    }
  });

  const promises: Promise<any>[] = [];

  if (canPayloads.length > 0) promises.push(processCanFrames(canPayloads));
  if (sensorPayloads.length > 0) promises.push(processSensorData(sensorPayloads));
  if (customPayloads.length > 0) promises.push(processCustomData(customPayloads));

  await Promise.all(promises);
}

// ════════════════════════════════════════════════════════
//  MONITORAMENTO DE LATÊNCIA (NOVO)
// ════════════════════════════════════════════════════════

// Estatísticas para média móvel (últimos 10 RTTs)
const rttHistory: number[] = [];
const RTT_HISTORY_SIZE = 10;

/**
 * Envia um ping e mede o RTT (tempo até receber o PUBACK do broker)
 * Retorna o RTT em ms, ou null se falhar
 */
export function sendLatencyPing(deviceId: string): Promise<number | null> {
  return new Promise((resolve) => {
    if (!client || !client.connected) {
      console.warn("⚠️ Cliente MQTT não conectado. Ping ignorado.");
      resolve(null);
      return;
    }

    const sentAt = Date.now();
    const topic = `moto/${deviceId}`;

    const payload = {
      deviceId: deviceId,
      sensorId: "latência api",
      sensorType: "latência",
      value: 0,
      unit: "ms",
      timestamp: sentAt, // Usado pela regra SQL para calcular latência de ida
      metadata: {
        source: "nodejs_can_studio",
        original_time: sentAt,
        measureType: "round_trip"
      }
    };

    // ⚡ O callback é chamado quando o PUBACK chega (QoS 1)
    client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
      const receivedAt = Date.now();
      
      if (err) {
        console.error(`❌ Erro ao enviar ping (sem PUBACK):`, err.message);
        resolve(null);
        return;
      }

      const rtt = receivedAt - sentAt;
      
      // Atualiza histórico (média móvel)
      rttHistory.push(rtt);
      if (rttHistory.length > RTT_HISTORY_SIZE) {
        rttHistory.shift();
      }
      
      const avgRtt = rttHistory.reduce((a, b) => a + b, 0) / rttHistory.length;

      console.log(
        `🏓 [RTT] ${deviceId} | ` +
        `Atual: ${rtt}ms | ` +
        `Média (últimos ${rttHistory.length}): ${avgRtt.toFixed(1)}ms | ` +
        `Min: ${Math.min(...rttHistory)}ms | ` +
        `Max: ${Math.max(...rttHistory)}ms`
      );

      // Opcional: Publica o RTT em um tópico de métricas para o dashboard
      if (client.connected) {
        const rttMetric = {
          deviceId: deviceId,
          sensorId: "MQTT_RTT",
          sensorType: "network_health",
          value: rtt,
          unit: "ms",
          timestamp: receivedAt,
          metadata: {
            avg: Number(avgRtt.toFixed(2)),
            min: Math.min(...rttHistory),
            max: Math.max(...rttHistory),
            samples: rttHistory.length
          }
        };
        
        client.publish(
          `metrics/moto/${deviceId}/rtt`,
          JSON.stringify(rttMetric),
          { qos: 0 } // Métrica pode perder, não é crítico
        );
      }

      resolve(rtt);
    });
  });
}

/**
 * Inicia o envio periódico de pings de latência.
 * @param deviceId ID da moto/dispositivo (ex: 'moto_001')
 * @param intervalMs Intervalo em milissegundos (padrão: 2000ms = 2 segundos)
 */
export function startLatencyMonitoring(deviceId: string, intervalMs: number = 2000): void {
  if (latencyInterval) {
    clearInterval(latencyInterval);
  }
  
  console.log(`⏱️ Iniciando monitoramento de latência (RTT + One-Way) para '${deviceId}' a cada ${intervalMs}ms`);
  
  // Envia o primeiro imediatamente
  sendLatencyPing(deviceId);
  
  latencyInterval = setInterval(() => {
    sendLatencyPing(deviceId);
  }, intervalMs);
}

/**
 * Interrompe o envio periódico de pings de latência.
 */
export function stopLatencyMonitoring(): void {
  if (latencyInterval) {
    clearInterval(latencyInterval);
    latencyInterval = null;
    console.log("⏹️ Monitoramento de latência interrompido.");
  }
}

// ════════════════════════════════════════════════════════
//  CONEXÃO MQTT
// ════════════════════════════════════════════════════════

export function connectMQTT(): void {
  const clientId = `can-studio-${Math.random().toString(16).substring(2, 10)}`;
  const isLocal = process.env.MQTT_LOCAL === 'true';

  let options: mqtt.IClientOptions = {
    clientId,
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASSWORD,
    reconnectPeriod: 3000,
    keepalive: 60,
    clean: true,
  };

  if (isLocal) {
    console.log(`🔄 Conectando ao broker Local MQTT: ${MQTT_BROKER}`);
  } else {
    console.log(`🔄 Conectando ao broker Externo MQTT: ${MQTT_BROKER}`);
    const certPath = path.resolve('./src/certs/emqxsl-ca.crt');

    if (fs.existsSync(certPath)) {
      options.ca = [fs.readFileSync(certPath)];
      options.rejectUnauthorized = true;
    } else {
      console.warn(`⚠️ Certificado CA não encontrado em: ${certPath}. Prosseguindo conexão sem certificado customizado.`);
    }
  }

  client = mqtt.connect(MQTT_BROKER, options);

  client.on('connect', () => {
    console.log(`✅ Conectado ao broker MQTT: ${MQTT_BROKER}`);
    client.subscribe(MQTT_TOPIC, (err) => {
      if (err) {
        console.error(`❌ Falha ao subscrever tópico ${MQTT_TOPIC}:`, err);
      } else {
        console.log(`📡 Subscrito ao tópico: ${MQTT_TOPIC}`);
      }
    });
  });

  client.on('message', async (topic, message) => {
    try {
      const payloadStr = message.toString();
      const rawData = JSON.parse(payloadStr);
      await processMqttMessage(rawData);
    } catch (error: any) {
      console.error('❌ Erro ao processar mensagem MQTT:', error.message);
      console.error('📦 Payload bruto:', message.toString());
    }
  });

  client.on('error', (err) => {
    console.error('❌ Erro no cliente MQTT:', err.message);
  });

  client.on('reconnect', () => {
    console.log(`🔄 Reconectando ao broker MQTT ${MQTT_BROKER}`);
  });

  client.on('close', () => {
    console.log('🔌 Conexão MQTT fechada');
  });
}

export async function disconnectMQTT(): Promise<void> {
  stopLatencyMonitoring(); // Garante que o intervalo seja limpo ao desconectar
  
  if (client) {
    console.log('🛑 Desconectando do broker MQTT...');
    await client.endAsync();
    client = null;
    console.log('✅ Cliente MQTT desconectado.');
  }
}

export function getMqttClient(): mqtt.MqttClient | null {
  return client;
}
