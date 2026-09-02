import { ICanFrame, IDecodingRule, IDecodedSignal } from "../types";

export class CanDecoderService {
  /**
   * Decodifica um frame CAN bruto usando uma lista de regras.
   * Lógica pura: não acessa banco de dados, apenas transforma dados.
   */
  static decodeFrame(frame: ICanFrame, rules: IDecodingRule[]): IDecodedSignal[] {
    const decodedSignals: IDecodedSignal[] = [];

    if (!rules.length || !frame.data) return decodedSignals;

    const bytes = this.hexToBytes(frame.data);

    for (const rule of rules) {
      // if (!rule.active) continue;

      const rawValue = this.extractBits(bytes, rule);
      const physicalValue = (rawValue * rule.factor) + rule.offset;

      decodedSignals.push({
        ruleId: rule.id,
        signalName: rule.signalName,
        value: Number(physicalValue.toFixed(4)),
        unit: rule.unit,
        rawHex: frame.data,
        timestamp: frame.timestamp,
      });
    }

    return decodedSignals;
  }

  private static hexToBytes(hex: string): number[] {
    const clean = hex.replace(/[^0-9a-fA-F]/g, "");
    const bytes: number[] = [];
    for (let i = 0; i < clean.length; i += 2) {
      bytes.push(parseInt(clean.substring(i, i + 2), 16));
    }
    return bytes;
  }

  private static extractBits(bytes: number[], rule: IDecodingRule): number {
    const startByte = Math.floor(rule.startBit / 8);
    const numBytes = Math.ceil(rule.bitLength / 8);

    if (startByte + numBytes > bytes.length) return 0;

    let raw = 0;

    if (rule.byteOrder === "little") {
      // 🟢 LITTLE-ENDIAN (ex: data[0] = LSB, data[1] = MSB)
      // Idêntico ao Arduino: (data[1] << 8) | data[0]
      for (let i = 0; i < numBytes; i++) {
        raw |= (bytes[startByte + i] << (i * 8));
      }
    } else {
      // 🔵 BIG-ENDIAN (ex: data[0] = MSB, data[1] = LSB)
      for (let i = 0; i < numBytes; i++) {
        raw = (raw << 8) | bytes[startByte + i];
      }
    }

    // 🔴 TRATAMENTO DE VALOR SINALIZADO (Signed / Complemento de 2)
    if (rule.signed && rule.bitLength < 32) {
      const mask = 1 << (rule.bitLength - 1);
      if ((raw & mask) !== 0) {
        raw = raw - (1 << rule.bitLength);
      }
    }

    return raw;
  }
}