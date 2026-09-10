import dotenv from "dotenv";
dotenv.config();

import * as fs from 'fs';
import path from 'path';
import * as mqtt from 'mqtt';
import { v4 as uuid } from 'uuid';
import { ICanFrame, IUnifiedRecord, ISensorData } from '../types'; // ✅ NOVO: Adicionado ISensorData
import CanFrameModel from '../models/CanFrameModel';
import UnifiedDataService from '../services/UnifiedDataService'; // ⚠️ Verifique se o caminho ainda é este ou se mudou para '../models/UnifiedDataModel'
import { SensorDataService } from '../models/SensorDataModel';   // ✅ NOVO: Import do serviço de Sensor

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

// ✅ NOVO: Payload de Sensor (baseado no seu Schema/Controller)
interface SensorPayload {
  id?: string;
  sensorId: string;
  sensorType?: string;
  value: any; // number, string, boolean, ou object
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
// ✅ DICA: Você pode usar um array de tópicos se quiser separar, ex: ['can/data', 'sensors/data']
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'can/data'; 

let client: mqtt.MqttClient | null = null;

// ════════════════════════════════════════════════════════
//  FUNÇÕES DE DETECÇÃO E CONVERSÃO
// ════════════════════════════════════════════════════════

function isCanPayload(payload: any): payload is CanPayload {
  return typeof payload === 'object' && payload !== null && payload.canId !== undefined && payload.data !== undefined;
}

// ✅ NOVO: Detecta se o payload é um dado de Sensor
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
    timestamp: payload.timestamp ?? Date.now(),
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

// ✅ NOVO: Processa e salva dados de Sensores vindos do MQTT
async function processSensorData(payloads: SensorPayload[]): Promise<ISensorData[]> {
  // 1. Normalização segura (espelhando a lógica exata do seu Controller)
  const readings: Partial<ISensorData>[] = payloads.map((s: any) => ({
    id: s.id || uuid(),
    sensorId: String(s.sensorId),
    sensorType: String(s.sensorType || "generic"),
    value: s.value,
    unit: s.unit ? String(s.unit) : undefined,
    timestamp: s.timestamp || Date.now(),
    metadata: s.metadata || undefined,
    deviceId: s.deviceId ? String(s.deviceId) : undefined
  }));

  // 2. Validação estrita
  const invalid = readings.filter(r => !r.sensorId);
  if (invalid.length > 0) {
    throw new Error(`${invalid.length} leitura(s) de sensor inválida(s): 'sensorId' é obrigatório.`);
  }

  // 3. Salvamento no modelo de Sensores
  const saved = await SensorDataService.insertMany(readings);

  // 4. Mapeamento para o formato Unificado (IUnifiedRecord)
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

// ✅ ATUALIZADO: Roteiriza o payload para o processador correto (agora inclui sensores)
async function processMqttMessage(rawData: any): Promise<void> {
  const payloads: any[] = Array.isArray(rawData) ? rawData : [rawData];

  const canPayloads: CanPayload[] = [];
  const sensorPayloads: SensorPayload[] = []; // ✅ NOVO
  const customPayloads: CustomPayload[] = [];

  payloads.forEach(p => {
    if (isCanPayload(p)) {
      canPayloads.push(p);
    } else if (isSensorPayload(p)) { // ✅ NOVO
      sensorPayloads.push(p);
    } else {
      customPayloads.push(p);
    }
  });

  const promises: Promise<any>[] = [];

  if (canPayloads.length > 0) {
    promises.push(processCanFrames(canPayloads));
  }
  if (sensorPayloads.length > 0) { // ✅ NOVO
    promises.push(processSensorData(sensorPayloads));
  }
  if (customPayloads.length > 0) {
    promises.push(processCustomData(customPayloads));
  }

  await Promise.all(promises);
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