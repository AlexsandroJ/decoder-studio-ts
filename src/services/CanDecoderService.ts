import { ICanFrame, IDecodingRule, IDecodedSignal } from "../types";

class CanDecoderService {
  /**
   * Decodifica um frame CAN bruto usando uma lista de regras.
   * Implementa extração de bits com suporte a little/big endian,
   * fator, offset e sinal.
   */
  decodeFrame(frame: ICanFrame, rules: IDecodingRule[]): IDecodedSignal[] {
    const signals: IDecodedSignal[] = [];
    const dataBytes = this.hexToBytes(frame.data);

    for (const rule of rules) {
      if (rule.canId.toLowerCase() !== frame.canId.toLowerCase()) continue;

      const rawValue = this.extractSignal(dataBytes, rule);
      const physicalValue = rawValue * rule.factor + rule.offset;

      signals.push({
        ruleId: rule.id,
        signalName: rule.signalName,
        value: Math.round(physicalValue * 1e6) / 1e6,
        unit: rule.unit,
        rawHex: frame.data,
        timestamp: frame.timestamp,
      });
    }

    return signals;
  }

  private hexToBytes(hex: string): number[] {
    const clean = hex.replace(/^0x/i, "");
    const bytes: number[] = [];
    for (let i = 0; i < clean.length; i += 2) {
      bytes.push(parseInt(clean.substring(i, i + 2), 16));
    }
    return bytes;
  }

  private extractSignal(bytes: number[], rule: IDecodingRule): number {
    // Converte bytes para um único bigint de bits
    let bitBuffer = 0n;
    for (const b of bytes) {
      bitBuffer = (bitBuffer << 8n) | BigInt(b);
    }

    const totalBits = bytes.length * 8;
    let startBit = rule.startBit;

    if (rule.byteOrder === "little") {
      // Intel byte order: inverte a posição do bit
      const bytePos = Math.floor(startBit / 8);
      const bitPos = startBit % 8;
      startBit = (7 - bytePos) * 8 + bitPos;
    } else {
      // Motorola: startBit é o MSB
      startBit = totalBits - 1 - startBit;
    }

    const endBit = startBit - rule.bitLength + 1;
    if (endBit < 0) return 0;

    const mask = (1n << BigInt(rule.bitLength)) - 1n;
    let raw = Number((bitBuffer >> BigInt(endBit)) & mask);

    if (rule.signed && raw >= 1 << (rule.bitLength - 1)) {
      raw -= 1 << rule.bitLength;
    }

    return raw;
  }
}

export default new CanDecoderService();
