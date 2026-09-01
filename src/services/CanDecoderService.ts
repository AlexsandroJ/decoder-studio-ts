import { ICanFrame, IDecodingRule, IDecodedSignal } from "../types";

class CanDecoderService {
  decodeFrame(frame: ICanFrame, rules: IDecodingRule[]): IDecodedSignal[] {
    if (!frame.data || rules.length === 0) return [];

    const bytes = this.hexToBytes(frame.data);
    const signals: IDecodedSignal[] = [];
    console.log(`Decodificando frame ${frame.canId} com ${rules.length} regras`);
    for (const rule of rules) {
      const rawValue = this.extractBits(bytes, rule);
      const physicalValue = (rawValue * rule.factor) + rule.offset;

      signals.push({
        ruleId: frame.id,
        signalName: rule.signalName,
  
        value: Number(physicalValue.toFixed(4)),
        unit: rule.unit,
        rawHex: frame.data,
        timestamp: frame.timestamp
      });
    }

    return signals;
  }

  private hexToBytes(hex: string): number[] {
    const clean = hex.replace(/[^0-9a-fA-F]/g, "");
    const bytes: number[] = [];
    for (let i = 0; i < clean.length; i += 2) {
      bytes.push(parseInt(clean.substring(i, i + 2), 16));
    }
    return bytes;
  }

  private extractBits(bytes: number[], rule: IDecodingRule): number {
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

export default new CanDecoderService();