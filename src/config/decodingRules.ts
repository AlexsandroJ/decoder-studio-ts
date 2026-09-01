// src/config/decodingRules.ts
import { IDecodingRule } from "../types";

// ════════════════════════════════════════════════════════
//  1. REGRAS ESPECÍFICAS DO PROJETO (Voltz / Arduino)
// ════════════════════════════════════════════════════════

export const voltzEnergyRules: IDecodingRule[] = [
  {
    id: "voltz_battery_current",
    canId: "0x14",
    signalName: "BatteryCurrent",
    startBit: 0,
    bitLength: 16,
    byteOrder: "little",
    signed: true,
    factor: 0.01,
    offset: 0,
    unit: "A",
  },
  {
    id: "voltz_battery_voltage",
    canId: "0x14",
    signalName: "BatteryVoltage",
    startBit: 16,
    bitLength: 16,
    byteOrder: "little",
    signed: false,
    factor: 0.01,
    offset: 0,
    unit: "V"
  },
  {
    id: "voltz_battery_soc",
    canId: "0x14",
    signalName: "BatterySOC",
    startBit: 32,
    bitLength: 8,
    byteOrder: "big",
    signed: false,
    factor: 1,
    offset: 0,
    unit: "%"
  },
  // Regras idênticas para o CAN ID 0x32A
  {
    id: "voltz_battery_current_32a",
    canId: "0x32A",
    signalName: "BatteryCurrent",
    startBit: 0,
    bitLength: 16,
    byteOrder: "little",
    signed: true,
    factor: 0.01,
    offset: 0,
    unit: "A"
  },
  {
    id: "voltz_battery_voltage_32a",
    canId: "0x32A",
    signalName: "BatteryVoltage",
    startBit: 16,
    bitLength: 16,
    byteOrder: "little",
    signed: false,
    factor: 0.01,
    offset: 0,
    unit: "V"
  }
];

export const voltzMotorRules: IDecodingRule[] = [
  {
    id: "voltz_motor_rpm",
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
    id: "voltz_drive_mode",
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
//  2. REGRAS GENÉRICAS (Exemplos / Outros Controladores)
// ════════════════════════════════════════════════════════

export const genericBatteryRules: IDecodingRule[] = [
  {
    id: "gen_battery_voltage",
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
  // ... adicione os outros (current, temp, soc, soh) aqui se necessário
];

export const genericMotorRules: IDecodingRule[] = [
  {
    id: "gen_motor_rpm",
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
  // ... adicione os outros (torque, temps, mode) aqui se necessário
];

// ════════════════════════════════════════════════════════
//  3. EXPORTAÇÃO UNIFICADA (Para Bootstrap/Seed)
// ════════════════════════════════════════════════════════

export const DEFAULT_DECODING_RULES: IDecodingRule[] = [
  ...voltzEnergyRules,
  ...voltzMotorRules,
  ...genericBatteryRules,
  ...genericMotorRules
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