import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { IApiResponse, IDecodingRule } from "../types";
import { DecodingRuleService } from "../models/DecodingRuleModel"; // <-- Novo import

class DecodingRuleController {
  
  create = async (req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      const raw = Array.isArray(req.body) ? req.body : [req.body];
      if (raw.length === 0) {
        res.status(400).json({ success: false, error: "Payload vazio." });
        return;
      }

      const rules: Partial<IDecodingRule>[] = raw.map((r: any) => ({
        id: r.id || `rule_${uuid()}`,
        canId: r.canId,
        signalName: r.signalName,
        startBit: r.startBit,
        bitLength: r.bitLength,
        byteOrder: r.byteOrder || "big",
        signed: r.signed ?? false,
        factor: r.factor ?? 1,
        offset: r.offset ?? 0,
        unit: r.unit || "",
        minValue: r.minValue,
        maxValue: r.maxValue,
        active: r.active ?? true
      }));

      const saved = await DecodingRuleService.insertMany(rules);
      res.status(201).json({ success: true, data: saved, count: saved.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

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

export default new DecodingRuleController();