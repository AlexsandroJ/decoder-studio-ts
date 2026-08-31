import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { IDecodingRule, IApiResponse } from "../types";
import DecodingRuleModel from "../models/DecodingRuleModel";

class DecodingController {
  /**
   * POST /api/decoding/rules
   * Cadastra regras de decodificação CAN (estilo DBC simplificado).
   * Body: IDecodingRule | IDecodingRule[]
   */
  create = (req: Request, res: Response<IApiResponse>): void => {
    try {
      const raw = Array.isArray(req.body) ? req.body : [req.body];

      if (raw.length === 0) {
        res.status(400).json({ success: false, error: "Payload vazio." });
        return;
      }

      const rules: IDecodingRule[] = raw.map((r: Partial<IDecodingRule>) => ({
        id: r.id ?? uuid(),
        canId: r.canId ?? "",
        signalName: r.signalName ?? "",
        startBit: r.startBit ?? 0,
        bitLength: r.bitLength ?? 8,
        byteOrder: r.byteOrder ?? "little",
        signed: r.signed ?? false,
        factor: r.factor ?? 1,
        offset: r.offset ?? 0,
        unit: r.unit ?? "",
        minValue: r.minValue,
        maxValue: r.maxValue,
      }));

      const invalid = rules.filter((r) => !r.canId || !r.signalName);
      if (invalid.length > 0) {
        res.status(400).json({
          success: false,
          error: `${invalid.length} regra(s) sem canId ou signalName.`,
        });
        return;
      }

      const saved = DecodingRuleModel.insertMany(rules);

      res.status(201).json({
        success: true,
        data: saved,
        count: saved.length,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  /**
   * GET /api/decoding/rules
   * Query: ?canId=0x1A3
   */
  list = (req: Request, res: Response<IApiResponse>): void => {
    try {
      const { canId } = req.query;
      const rules = canId
        ? DecodingRuleModel.findByCanId(canId as string)
        : DecodingRuleModel.findAll();

      res.json({ success: true, data: rules, count: rules.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  /**
   * GET /api/decoding/rules/:id
   */
  getById = (req: Request, res: Response<IApiResponse>): void => {
    const rule = DecodingRuleModel.findById(req.params.id);
    if (!rule) {
      res.status(404).json({ success: false, error: "Regra não encontrada." });
      return;
    }
    res.json({ success: true, data: rule });
  };

  /**
   * DELETE /api/decoding/rules/:id
   */
  remove = (req: Request, res: Response<IApiResponse>): void => {
    const deleted = DecodingRuleModel.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: "Regra não encontrada." });
      return;
    }
    res.json({ success: true, data: "Regra removida." });
  };

  /**
   * DELETE /api/decoding/rules
   */
  clear = (_req: Request, res: Response<IApiResponse>): void => {
    DecodingRuleModel.clear();
    res.json({ success: true, data: "Todas as regras removidas." });
  };
}

export default new DecodingController();
