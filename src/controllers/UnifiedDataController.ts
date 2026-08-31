import { Request, Response } from "express";
import { IApiResponse } from "../types";
import UnifiedDataModel from "../models/UnifiedDataModel";
import UnifiedDataService from "../services/UnifiedDataService";

class UnifiedDataController {
  /**
   * GET /api/unified
   * Lista registros unificados.
   * Query: ?source=can|sensor|merged&limit=100
   */
  list = (req: Request, res: Response<IApiResponse>): void => {
    try {
      const { source, limit } = req.query;
      const l = parseInt(limit as string, 10) || 200;

      const data = source
        ? UnifiedDataModel.findBySource(source as "can" | "sensor" | "merged")
        : UnifiedDataModel.findAll(l);

      res.json({ success: true, data, count: data.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  /**
   * GET /api/unified/:id
   */
  getById = (req: Request, res: Response<IApiResponse>): void => {
    const record = UnifiedDataModel.findById(req.params.id);
    if (!record) {
      res.status(404).json({ success: false, error: "Registro não encontrado." });
      return;
    }
    res.json({ success: true, data: record });
  };

  /**
   * GET /api/unified/range?start=1700000000000&end=1700001000000
   */
  getByTimeRange = (req: Request, res: Response<IApiResponse>): void => {
    try {
      const start = parseInt(req.query.start as string, 10);
      const end = parseInt(req.query.end as string, 10);

      if (isNaN(start) || isNaN(end)) {
        res.status(400).json({
          success: false,
          error: "Parâmetros 'start' e 'end' (epoch ms) são obrigatórios.",
        });
        return;
      }

      const data = UnifiedDataModel.findByTimeRange(start, end);
      res.json({ success: true, data, count: data.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  /**
   * POST /api/unified/merge
   * Força merge de CAN + sensores por janela de tempo.
   * Body: { windowMs?: number }
   */
  merge = (req: Request, res: Response<IApiResponse>): void => {
    try {
      const windowMs = req.body?.windowMs ?? 1000;
      const merged = UnifiedDataService.mergeByTimeWindow(windowMs);

      res.status(201).json({
        success: true,
        data: merged,
        count: merged.length,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  /**
   * DELETE /api/unified
   */
  clear = (_req: Request, res: Response<IApiResponse>): void => {
    UnifiedDataModel.clear();
    res.json({ success: true, data: "Todos os registros unificados removidos." });
  };
}

export default new UnifiedDataController();
