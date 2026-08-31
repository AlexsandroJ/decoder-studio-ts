import { IDecodingRule } from "../types";

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
  ...batteryRules,
  ...motorRules
];