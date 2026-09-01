// src/controllers/CanDataController.ts
import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { IApiResponse, ICanFrame, IDecodedSignal } from "../types";
import { CanFrameService } from "../models/CanFrameModel";
import { DecodingRuleService } from "../models/DecodingRuleModel";
import { UnifiedDataService } from "../models/UnifiedDataModel";

class CanDataController {
  /**
   * POST /api/can/frames
   */
  ingest = async (req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      const raw = Array.isArray(req.body) ? req.body : [req.body];

      if (raw.length === 0) {
        res.status(400).json({ success: false, error: "Payload vazio." });
        return;
      }

      const frames: Partial<ICanFrame>[] = raw.map((f: any) => ({
        id: f.id || uuid(),
        canId: f.canId,
        dlc: f.dlc || 8,
        data: f.data || f.payload || f.hexData,
        timestamp: f.timestamp || Date.now(),
        interface: f.interface || "http"
      }));

      const invalid = frames.filter((f) => !f.canId || !f.data);
      if (invalid.length > 0) {
        res.status(400).json({
          success: false,
          error: `${invalid.length} frame(s) sem canId ou data.`,
        });
        return;
      }

      const savedFrames = await CanFrameService.insertMany(frames);
      
      // Decodificar e Unificar
      const unifiedRecords: any[] = [];
      for (const frame of savedFrames) {
        const rules = await DecodingRuleService.findByCanId(frame.canId!);
        const decodedSignals: IDecodedSignal[] = [];

        
        if (rules.length > 0 && frame.data) {
          const bytes = this.hexToBytes(frame.data);
          for (const rule of rules) {
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
        }

        const unified = await UnifiedDataService.insert({
          id: uuid(),
          timestamp: frame.timestamp,
          source: "can",
          canSignals: decodedSignals,
          
        });
        unifiedRecords.push(unified);

        console.log(unified);
      }
      console.log(`💾 Salvando ${savedFrames} frames e ${unifiedRecords} registros unificados`);
      
      res.status(201).json({
        success: true,
        data: { frames: savedFrames, unified: unifiedRecords },
        count: savedFrames.length,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  /**
   * GET /api/can/frames
   */
  list = async (req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      const { canId, limit } = req.query;
      const l = parseInt(limit as string, 10) || 100;

      const frames = canId
        ? await CanFrameService.findByCanId(canId as string, l)
        : await CanFrameService.findAll(l);

      res.json({ success: true, data: frames, count: frames.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  /**
   * GET /api/can/frames/:id
   */
  getById = async (req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      const frame = await CanFrameService.findById(req.params.id as string);
      if (!frame) {
        res.status(404).json({ success: false, error: "Frame não encontrado." });
        return;
      }
      res.json({ success: true, data: frame });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  /**
   * DELETE /api/can/frames
   */
  clear = async (_req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      await CanFrameService.clear();
      res.json({ success: true, data: "Todos os frames removidos." });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  // ── Helpers Privados ──
  private hexToBytes(hex: string): number[] {
    const clean = hex.replace(/[^0-9a-fA-F]/g, "");
    const bytes: number[] = [];
    for (let i = 0; i < clean.length; i += 2) {
      bytes.push(parseInt(clean.substring(i, i + 2), 16));
    }
    return bytes;
  }

  private extractBits(bytes: number[], rule: any): number {
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

// ⚠️ EXPORTAÇÃO DEFAULT É CRUCIAL AQUI
export default new CanDataController();