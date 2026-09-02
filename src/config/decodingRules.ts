// src/config/decodingRules.ts
import { IDecodingRule } from "../types";

// ════════════════════════════════════════════════════════
//  1. REGRAS ESPECÍFICAS DO PROJETO (AIMA )
// ════════════════════════════════════════════════════════

export const AimaEnergyRules: IDecodingRule[] = [
  {
    id: "aima_battery_01_current",
    canId: "0x14",
    signalName: "BatteryCurrent_01",
    startBit: 0, // Corrente em data[0] e data[1]
    bitLength: 16,
    byteOrder: "little",
    signed: true, // Inteiro Sinalizado (16-bit)
    factor: 0.01, // Dividido por 100.0
    offset: 0,
    unit: "A",
  },
  {
    id: "aima_battery_01_voltage",
    canId: "0x14",
    signalName: "BatteryVoltage_01",
    startBit: 16, // Tensão em data[2] e data[3]
    bitLength: 16,
    byteOrder: "little",
    signed: false, // Inteiro Não Sinalizado (16-bit)
    factor: 0.01, // Dividido por 100.0
    offset: 0,
    unit: "V"
  },
  {
    id: "aima_battery_01_soc",
    canId: "0x14",
    signalName: "BatterySOC_01",
    startBit: 32, // SOC em data[4]
    bitLength: 8,
    byteOrder: "big",
    signed: false,
    factor: 1,
    offset: 0,
    unit: "%"
  },
  // Regras idênticas para o CAN ID 0x32A
  {
    id: "aima_battery_02_current",
    canId: "0x32A",
    signalName: "BatteryCurrent_02",
    startBit: 0, // Corrente em data[0] e data[1]
    bitLength: 16,
    byteOrder: "little",
    signed: true, // Inteiro Sinalizado (16-bit)
    factor: 0.01, // Dividido por 100.0
    offset: 0,
    unit: "A"
  },
  {
    id: "aima_battery_02_voltage",
    canId: "0x32A",
    signalName: "BatteryVoltage_02",
    startBit: 16,  // Tensão em data[2] e data[3]
    bitLength: 16,
    byteOrder: "little",
    signed: false, // Inteiro Não Sinalizado (16-bit)
    factor: 0.01, // Dividido por 100.0
    offset: 0,
    unit: "V"
  },
    {
    id: "aima_battery_02_soc",
    canId: "0x32A",
    signalName: "BatterySOC_02",
    startBit: 32, // SOC em data[4]
    bitLength: 8,
    byteOrder: "big",
    signed: false,
    factor: 1,
    offset: 0,
    unit: "%"
  },
  
];

export const AimaMotorRules: IDecodingRule[] = [
  {
    id: "aima_motor_rpm",
    canId: "0x6A0",
    signalName: "MotorRPM",
    startBit: 32, // Byte 4 (Big Endian: MSB primeiro)
    bitLength: 16,
    byteOrder: "big",
    signed: false,
    factor: 0.1,
    offset: -1600, // Equivalente a (raw - 16000) / 10.0
    unit: "rpm"
  },
  {
    id: "aima_drive_mode",
    canId: "0x6A1",
    signalName: "DriveMode",
    startBit: 0,
    bitLength: 8,
    byteOrder: "big",
    signed: false,
    factor: 1,
    offset: 1, // data[0] + 1
    unit: "mode"
  }
];


// ════════════════════════════════════════════════════════
//  3. EXPORTAÇÃO UNIFICADA (Para Bootstrap/Seed)
// ════════════════════════════════════════════════════════

export const DEFAULT_DECODING_RULES: IDecodingRule[] = [
  ...AimaEnergyRules,
  ...AimaMotorRules,
];

// ════════════════════════════════════════════════════════
//  4. HELPERS (Para testes ou decodificação no frontend)
// ════════════════════════════════════════════════════════
export function decodeVoltzEnergy(data: number[]) {
  if (!Array.isArray(data) || data.length < 5) throw new Error("Dados de energia inválidos");
  const raw_current = (data[1] << 8) | data[0];
  const signed_current = raw_current > 32767 ? raw_current - 65536 : raw_current;
  const raw_voltage = (data[3] << 8) | data[2];
  
  return {
    current_amps: (signed_current * 0.01).toFixed(2),
    voltage_volts: (raw_voltage * 0.01).toFixed(2),
    soc_percent: data[4]
  };
}

export function decodeVoltzMotor(data: number[]) {
  if (!Array.isArray(data) || data.length < 6) throw new Error("Dados do motor inválidos");
  const raw_rpm = (data[4] << 8) | data[5];
  const motor_rpm = (raw_rpm * 0.1) - 1600;
  
  return {
    motor_rpm: motor_rpm.toFixed(1),
    speed_kmh: (motor_rpm / 4.48).toFixed(1)
  };
}