import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { IApiResponse, IDecodingRule } from "../types";
import { DecodingRuleService } from "../models/DecodingRuleModel";

class DecodingController {
  /**
   * POST /api/decoding/rules
   */
  create = async (req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      const raw = Array.isArray(req.body) ? req.body : [req.body];
      if (raw.length === 0) {
        res.status(400).json({ success: false, error: "Payload vazio." });
        return;
      }

      // Normalização com valores padrão seguros conforme a interface IDecodingRule
      const rules: Partial<IDecodingRule>[] = raw.map((r: any) => ({
        id: r.id || `rule_${uuid()}`,
        canId: String(r.canId),
        signalName: String(r.signalName),
        startBit: Number(r.startBit),
        bitLength: Number(r.bitLength),
        byteOrder: r.byteOrder === "little" ? "little" : "big",
        signed: Boolean(r.signed),
        factor: Number(r.factor) || 1,      // ← Use || ao invés de ??
        offset: Number(r.offset) || 0,      // ← Use || ao invés de ??
        unit: String(r.unit || ""),
        minValue: r.minValue !== undefined ? Number(r.minValue) : undefined,
        maxValue: r.maxValue !== undefined ? Number(r.maxValue) : undefined,
      }));

      const saved = await DecodingRuleService.insertMany(rules);
      res.status(201).json({ success: true, data: saved, count: saved.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  /**
   * GET /api/decoding/rules
   */
  list = async (req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      const { canId } = req.query;
      const rules = canId
        ? await DecodingRuleService.findByCanId(canId as string)
        : await DecodingRuleService.findAll();

      res.json({ success: true, data: rules, count: rules.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  /**
   * DELETE /api/decoding/rules/:id
   */
  delete = async (req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await DecodingRuleService.delete(id as string);
      if (!deleted) {
        res.status(404).json({ success: false, error: "Regra não encontrada." });
        return;
      }
      res.json({ success: true, data: "Regra removida com sucesso." });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}

export default new DecodingController();