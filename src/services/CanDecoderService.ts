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
      //if (!rule.active) continue;

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
    let bitBuffer = 0n;
    for (const b of bytes) bitBuffer = (bitBuffer << 8n) | BigInt(b);
    
    const totalBits = bytes.length * 8;
    let adjustedStart = rule.startBit;
    
    if (rule.byteOrder === "little") {
      const bytePos = Math.floor(rule.startBit / 8);
      const bitPos = rule.startBit % 8;
      adjustedStart = (7 - bytePos) * 8 + bitPos;
    } else {
      adjustedStart = totalBits - 1 - rule.startBit;
    }
    
    const endBit = adjustedStart - rule.bitLength + 1;
    if (endBit < 0) return 0;
    
    const mask = (1n << BigInt(rule.bitLength)) - 1n;
    let raw = Number((bitBuffer >> BigInt(endBit)) & mask);
    
    if (rule.signed && raw >= (1 << (rule.bitLength - 1))) {
      raw -= (1 << rule.bitLength);
    }
    return raw;
  }
}