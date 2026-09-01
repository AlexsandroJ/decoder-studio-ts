import { Request, Response } from "express";
import { IApiResponse } from "../types";
import { UnifiedDataService } from "../models/UnifiedDataModel";
import UnifiedDataProcessor from "../services/UnifiedDataService";

class UnifiedDataController {
  /**
   * GET /api/unified
   */
  list = async (req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      const { source, limit } = req.query;
      const l = parseInt(limit as string, 10) || 200;

      const data = source
        ? await UnifiedDataService.findBySource(source as any, l)
        : await UnifiedDataService.findRecent(l);

      res.json({ success: true, data, count: data.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  /**
   * GET /api/unified/:id
   */
  getById = async (req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      const record = await UnifiedDataService.findById(req.params.id as string);
      if (!record) {
        res.status(404).json({ success: false, error: "Registro não encontrado." });
        return;
      }
      res.json({ success: true, data: record });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  /**
   * GET /api/unified/range?start=1700000000000&end=1700001000000
   */
  getByTimeRange = async (req: Request, res: Response<IApiResponse>): Promise<void> => {
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

      const data = await UnifiedDataService.findByTimeRange(start, end);
      res.json({ success: true, data, count: data.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  /**
   * POST /api/unified/merge
   */
  merge = async (req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      const windowMs = req.body?.windowMs ?? 1000;
      const merged = await UnifiedDataProcessor.mergeByTimeWindow(windowMs);

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
  clear = async (_req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      await UnifiedDataService.clear();
      res.json({ success: true, data: "Todos os registros unificados removidos." });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  /**
   * POST /api/unified
   * Recebe dados arbitrários/customizados que não se encaixam no padrão CAN/Sensor.
   * Body: IUnifiedRecord | IUnifiedRecord[]
   */
  /*
  ingest = (req: Request, res: Response<IApiResponse>): void => {
    try {
      const raw = Array.isArray(req.body) ? req.body : [req.body];

      if (raw.length === 0) {
        res.status(400).json({ success: false, error: "Payload vazio." });
        return;
      }

      // Normaliza os dados, garantindo que customData capture o payload
      const records: Partial<IUnifiedRecord>[] = raw.map((r: any) => ({
        id: r.id || uuid(),
        timestamp: r.timestamp || Date.now(),
        source: r.source || "custom",
        // Se o usuário enviar { customData: {...} }, usa isso. Senão, usa o próprio objeto 'r'
        customData: r.customData || r.data || r, 
        tags: r.tags || ["custom-ingestion"]
      }));

      const saved = UnifiedDataService.ingestCustomData(records);

      res.status(201).json({
        success: true,
        data: saved,
        count: saved.length,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
  */
}

export default new UnifiedDataController();