import { Request, Response } from "express";
import { IApiResponse, IUnifiedRecord } from "../types";
import { UnifiedDataService } from "../models/UnifiedDataModel";

class UnifiedDataController {
  /**
   * GET /api/unified
   */
  list = async (req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      const { source, limit } = req.query;
      const l = parseInt(limit as string, 10) || 200;

      const data = source
        ? await UnifiedDataService.findBySource(source as string, l)
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
        res.status(404).json({ success: false, error: "Registro unificado não encontrado." });
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
          error: "Parâmetros 'start' e 'end' (epoch ms) são obrigatórios e devem ser numéricos.",
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
   * Funde registros de CAN e Sensor que estejam dentro da mesma janela de tempo.
   * Body: { "windowMs": 500 }
   */
  merge = async (req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      const windowMs = req.body?.windowMs ?? 1000; // Padrão de 1 segundo
      
      // Chama o serviço que contém a lógica de agrupamento por timestamp
      const mergedData = await UnifiedDataService.mergeByTimeWindow(windowMs);

      res.status(200).json({
        success: true,
        data: mergedData,
        count: mergedData.length,
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
}

export default new UnifiedDataController();