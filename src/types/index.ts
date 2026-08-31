// ── CAN Frame bruto ──
export interface ICanFrame {
  id: string;           // UUID gerado na ingestão
  canId: string;        // ID do frame CAN (hex, ex: "0x1A3")
  dlc: number;          // Data Length Code (0-8)
  data: string;         // Payload hex (ex: "FF0A3B0012CD4567")
  timestamp: number;    // epoch ms
  interface?: string;   // ex: "can0", "vcan0"
}

// ── Regra de decodificação (estilo DBC simplificado) ──
export interface IDecodingRule {
  id: string;
  canId: string;          // Frame CAN ao qual se aplica
  signalName: string;     // ex: "EngineRPM"
  startBit: number;       // bit inicial (0-based)
  bitLength: number;      // comprimento em bits
  byteOrder: "little" | "big";
  signed: boolean;
  factor: number;         // ex: 0.25
  offset: number;         // ex: -40
  unit: string;           // ex: "rpm", "°C"
  minValue?: number;
  maxValue?: number;
}

// ── Sinal já decodificado ──
export interface IDecodedSignal {
  ruleId: string;
  signalName: string;
  value: number;
  unit: string;
  rawHex: string;
  timestamp: number;
}

// ── Dado genérico de sensor ──
export interface ISensorData {
  id: string;
  sensorId: string;       // identificador lógico do sensor
  sensorType: string;     // ex: "temperature", "pressure", "gps"
  value: number | string | boolean | object;
  unit?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// ── Dado unificado (CAN decodificado + sensores) ──
export interface IUnifiedRecord {
  id: string;
  timestamp: number;
  source: "can" | "sensor" | "merged";
  canSignals?: IDecodedSignal[];
  sensorReadings?: ISensorData[];
  tags?: string[];
}

// ── Resposta padrão da API ──
export interface IApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}
