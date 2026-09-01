
import dotenv from "dotenv";
dotenv.config();

import * as fs from 'fs';
import * as mqtt from 'mqtt';
import { v4 as uuid } from 'uuid';
import { ICanFrame, IUnifiedRecord } from '../types';
import CanFrameModel from '../models/CanFrameModel';
import UnifiedDataService from '../services/UnifiedDataService';

// ════════════════════════════════════════════════════════
//  TIPOS
// ════════════════════════════════════════════════════════

/**
 * Payload CAN (estrutura conhecida)
 */
interface CanPayload {
  deviceId?: string;
  canId: string;
  data: string | number[];
  dlc?: number;
  timestamp?: number;
  interface?: string;
}

/**
 * Payload Customizado (estrutura arbitrária)
 */
interface CustomPayload {
  source: string;
  data?: Record<string, any>;
  customData?: Record<string, any>;
  timestamp?: number;
  tags?: string[];
  [key: string]: any; // Permite qualquer campo extra
}

/**
 * Tipo union para qualquer payload MQTT
 */
type MqttPayload = CanPayload | CustomPayload;

// ════════════════════════════════════════════════════════
//  CONFIGURAÇÃO
// ════════════════════════════════════════════════════════

const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'can/data';

let client: mqtt.MqttClient | null = null;

// ════════════════════════════════════════════════════════
//  FUNÇÕES DE DETECÇÃO E CONVERSÃO
// ════════════════════════════════════════════════════════

/**
 * Detecta se o payload é um frame CAN ou dado customizado
 */
function isCanPayload(payload: any): payload is CanPayload {
  return typeof payload === 'object' && payload !== null && payload.canId !== undefined && payload.data !== undefined;
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

/**
 * Converte payload customizado para IUnifiedRecord
 */
function customPayloadToUnified(payload: CustomPayload): IUnifiedRecord {
  return {
    id: uuid(),
    timestamp: payload.timestamp ?? Date.now(),
    source: payload.source || 'custom' ,
    customData: payload.customData || payload.data || {},
    tags: payload.tags || ['mqtt-ingestion'],
  };
}

// ════════════════════════════════════════════════════════
//  PROCESSAMENTO
// ════════════════════════════════════════════════════════

/**
 * Processa e salva frames CAN
 */
async function processCanFrames(payloads: CanPayload[]): Promise<ICanFrame[]> {
  const frames: ICanFrame[] = payloads.map(canPayloadToFrame);

  const invalid = frames.filter(f => !f.canId || !f.data);
  if (invalid.length > 0) {
    throw new Error(`${invalid.length} frame(s) CAN inválido(s)`);
  }

  // Salva no banco
  const saved = await CanFrameModel.insertMany(frames);

  // ✅ CORREÇÃO: Usa o serviço unificado com await
  const UnifiedDataProcessor = (await import("../services/UnifiedDataService")).default;
  const unified = await UnifiedDataProcessor.ingestCanFrames(saved);

  console.log(`✅ CAN: ${saved.length} frame(s) | ${unified.length} unificado(s)`);
  return saved;
}

/**
 * Processa e salva dados customizados
 */
async function processCustomData(payloads: CustomPayload[]): Promise<IUnifiedRecord[]> {
  const records: IUnifiedRecord[] = payloads.map(customPayloadToUnified);

  // ✅ CORREÇÃO: 
  // 1. Usamos insertMany para salvar tudo de uma vez (mais rápido).
  // 2. Usamos await para esperar a Promise resolver e retornar o array real.
  const saved = await UnifiedDataService.insertMany(records);

  //console.log(`✅ CUSTOM: ${saved.length} registro(s) salvo(s)`);
  
  // 'saved' agora é do tipo IUnifiedRecord[], que corresponde exatamente ao retorno da função
  return saved; 
}

/**
 * Roteiriza o payload para o processador correto
 */
async function processMqttMessage(rawData: any): Promise<void> {
  // Suporta array ou objeto único
  const payloads: any[] = Array.isArray(rawData) ? rawData : [rawData];

  // Separa por tipo
  const canPayloads: CanPayload[] = [];
  const customPayloads: CustomPayload[] = [];

  payloads.forEach(p => {
    if (isCanPayload(p)) {
      canPayloads.push(p);
    } else {
      customPayloads.push(p);
    }
  });

  // Processa em paralelo
  const promises: Promise<any>[] = [];

  if (canPayloads.length > 0) {
    promises.push(processCanFrames(canPayloads));
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
  const clientId = `can-gateway-${Math.random().toString(16).substring(2, 10)}`;

  const options: mqtt.IClientOptions = {
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASSWORD,
    clientId,
    reconnectPeriod: 3000,
    keepalive: 60,
    clean: true,
    ca: [fs.readFileSync('./src/certs/emqxsl-ca.crt')], // Se necessário para TLS

  };

  console.log(`🔄 Conectando ao broker MQTT: ${MQTT_BROKER}`);

  let client: mqtt.MqttClient | null;

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
    if (topic === MQTT_TOPIC) {
      try {
        const payloadStr = message.toString();
        const rawData = JSON.parse(payloadStr);

        await processMqttMessage(rawData);

      } catch (error: any) {
        console.error('❌ Erro ao processar mensagem MQTT:', error.message);
        console.error('📦 Payload bruto:', message.toString());
      }
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