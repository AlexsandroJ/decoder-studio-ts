import { IDecodingRule } from "../types";

// ════════════════════════════════════════════════════════
//  1. DADOS DE ENERGIA (BATERIA E CONSUMO)
//  CAN IDs: 0x14 e 0x32A (Ambos possuem o mesmo layout de dados)
// ════════════════════════════════════════════════════════
export const energyRules0x14: IDecodingRule[] = [
  {
    id: "battery_current",
    canId: "0x14",
    signalName: "BatteryCurrent",
    startBit: 0,          // data[0] é o LSB
    bitLength: 16,        // data[0] e data[1]
    byteOrder: "little",  // Intel: LSB no endereço menor
    signed: true,         // int16_t no C++
    factor: 0.01,         // / 100.0
    offset: 0,
    unit: "A"
  },
  {
    id: "battery_voltage",
    canId: "0x14",
    signalName: "BatteryVoltage",
    startBit: 16,         // data[2] é o LSB
    bitLength: 16,        // data[2] e data[3]
    byteOrder: "little",
    signed: false,        // uint16_t no C++
    factor: 0.01,         // / 100.0
    offset: 0,
    unit: "V"
  },
  {
    id: "battery_soc",
    canId: "0x14",
    signalName: "BatterySOC",
    startBit: 32,         // data[4]
    bitLength: 8,
    byteOrder: "little",  // (Big ou Little, tanto faz para 8 bits)
    signed: false,        // uint8_t
    factor: 1,
    offset: 0,
    unit: "%"
  }
];

// (Opcional) Regras idênticas para o CAN ID 0x32A, caso seu backend exija mapeamento 1:1
export const energyRules0x32A: IDecodingRule[] = energyRules0x14.map(rule => ({
  ...rule,
  id: `${rule.id}_0x32A`,
  canId: "0x32A"
}));


// ════════════════════════════════════════════════════════
//  2. DINÂMICA DO MOTOR E VELOCIDADE
//  CAN ID: 0x6A0
// ════════════════════════════════════════════════════════
export const motorDynamicsRules: IDecodingRule[] = [
  {
    id: "motor_rpm",
    canId: "0x6A0",
    signalName: "MotorRPM",
    startBit: 32,         // MSB de data[4] (4 * 8 + 7 = 39)
    bitLength: 16,        // data[4] e data[5]
    byteOrder: "big",     // Motorola: MSB no endereço menor (data[4] << 8 | data[5])
    signed: false,        // uint16_t
    factor: 0.1,          // / 10.0
    offset: -1600,        // -16000 / 10.0  (Matematicamente equivalente a (raw - 16000) / 10.0)
    unit: "rpm"
  }
  // NOTA SOBRE VELOCIDADE (km/h): 
  // Como speed_kmh = motor_rpm / 4.48, este é um valor DERIVADO.
  // O IDecodingRule só extrai dados brutos do frame. 
  // O cálculo da velocidade deve ser feito no Frontend ou em um serviço de pós-processamento 
  // usando o valor já decodificado de "MotorRPM".
];


// ════════════════════════════════════════════════════════
//  3. MODO DE CONDUÇÃO
//  CAN ID: 0x6A1
// ════════════════════════════════════════════════════════
export const driveModeRules: IDecodingRule[] = [
  {
    id: "drive_mode",
    canId: "0x6A1",
    signalName: "DriveMode",
    startBit: 0,          // data[0]
    bitLength: 8,
    byteOrder: "big",
    signed: false,        // uint8_t
    factor: 1,
    offset: 1,            // data[0] + 1 (Ajuste de Índice Base 0)
    unit: "mode"
  }
];


// ════════════════════════════════════════════════════════
//  HELPERS DE DECODIFICAÇÃO (Para validação manual no Node.js)
// ════════════════════════════════════════════════════════

/**
 * Decodifica dados de energia (Bateria)
 * Espelho exato da lógica do seu Arduino
 */
export function decodeEnergyData(data: number[]) {
  if (!Array.isArray(data) || data.length < 5) throw new Error("Dados de energia inválidos");
  
  const raw_current = (data[1] << 8) | data[0];
  // Converte para signed 16-bit se o valor for negativo (complemento de 2)
  const signed_current = raw_current > 32767 ? raw_current - 65536 : raw_current;
  
  const raw_voltage = (data[3] << 8) | data[2];
  const soc = data[4];

  return {
    current_amps: (signed_current / 100.0).toFixed(2),
    voltage_volts: (raw_voltage / 100.0).toFixed(2),
    soc_percent: soc
  };
}

/**
 * Decodifica dinâmica do motor
 * Espelho exato da lógica do seu Arduino
 */
export function decodeMotorDynamics(data: number[]) {
  if (!Array.isArray(data) || data.length < 6) throw new Error("Dados do motor inválidos");
  
  const raw_rpm = (data[4] << 8) | data[5];
  const motor_rpm = (raw_rpm - 16000) / 10.0;
  const gear_ratio = 4.48;
  const speed_kmh = motor_rpm / gear_ratio;

  return {
    motor_rpm: motor_rpm.toFixed(1),
    speed_kmh: speed_kmh.toFixed(1)
  };
}

/**
 * Decodifica modo de condução
 */
export function decodeDriveMode(data: number[]) {
  if (!Array.isArray(data) || data.length < 1) throw new Error("Dados de modo inválidos");
  return {
    drive_mode: data[0] + 1
  };
}
// ════════════════════════════════════════════════════════
//  BATTERY CONTROLLER (CAN ID: 0x100)
// ════════════════════════════════════════════════════════
export const batteryRules: IDecodingRule[] = [
  {
    id: "battery_voltage",
    canId: "0x100",
    signalName: "BatteryVoltage",
    startBit: 0,
    bitLength: 16,
    byteOrder: "big",
    signed: false,
    factor: 0.1,
    offset: 0,
    unit: "V"
  },
  {
    id: "battery_current",
    canId: "0x100",
    signalName: "BatteryCurrent",
    startBit: 16,
    bitLength: 16,
    byteOrder: "big",
    signed: false,
    factor: 0.1,
    offset: 0,
    unit: "A"
  },
  {
    id: "battery_temperature",
    canId: "0x100",
    signalName: "BatteryTemperature",
    startBit: 32,
    bitLength: 8,
    byteOrder: "big",
    signed: false,
    factor: 1,
    offset: 0,
    unit: "°C"
  },
  {
    id: "battery_soc",
    canId: "0x100",
    signalName: "BatterySOC",
    startBit: 48,
    bitLength: 8,
    byteOrder: "big",
    signed: false,
    factor: 1,
    offset: 0,
    unit: "%"
  },
  {
    id: "battery_soh",
    canId: "0x100",
    signalName: "BatterySOH",
    startBit: 56,
    bitLength: 8,
    byteOrder: "big",
    signed: false,
    factor: 1,
    offset: 0,
    unit: "%"
  }
];

// ════════════════════════════════════════════════════════
//  MOTOR CONTROLLER (CAN ID: 0x200)
// ════════════════════════════════════════════════════════
export const motorRules: IDecodingRule[] = [
  {
    id: "motor_rpm",
    canId: "0x200",
    signalName: "MotorRPM",
    startBit: 0,
    bitLength: 16,
    byteOrder: "big",
    signed: false,
    factor: 1,
    offset: 0,
    unit: "rpm"
  },
  {
    id: "motor_torque",
    canId: "0x200",
    signalName: "MotorTorque",
    startBit: 16,
    bitLength: 16,
    byteOrder: "big",
    signed: false,
    factor: 0.1,
    offset: 0,
    unit: "Nm"
  },
  {
    id: "motor_mode",
    canId: "0x200",
    signalName: "MotorMode",
    startBit: 40,
    bitLength: 8,
    byteOrder: "big",
    signed: false,
    factor: 1,
    offset: 0,
    unit: "mode"
  },
  {
    id: "motor_control_temp",
    canId: "0x200",
    signalName: "MotorControlTemp",
    startBit: 48,
    bitLength: 8,
    byteOrder: "big",
    signed: false,
    factor: 1,
    offset: -40,
    unit: "°C"
  },
  {
    id: "motor_temp",
    canId: "0x200",
    signalName: "MotorTemperature",
    startBit: 56,
    bitLength: 8,
    byteOrder: "big",
    signed: false,
    factor: 2,
    offset: 0,
    unit: "°C"
  }
];

// ════════════════════════════════════════════════════════
//  EXPORTAÇÃO UNIFICADA
// ════════════════════════════════════════════════════════
export const allDecodingRules: IDecodingRule[] = [
  ...energyRules0x14,
  ...energyRules0x32A,
  ...motorDynamicsRules,
  ...driveModeRules
];