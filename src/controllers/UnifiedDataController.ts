import { Request, Response } from "express";
import { IApiResponse, IUnifiedRecord } from "../types";
import { UnifiedDataService } from "../models/UnifiedDataModel";

class UnifiedDataController {
    /**
   * POST /api/unified
   * Ingestão de um registro unificado
   */
  ingest = async (req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      const payload = req.body;

      if (!payload || !payload.source) {
        res.status(400).json({ 
          success: false, 
          error: "Payload inválido. O campo 'source' é obrigatório." 
        });
        return;
      }

      // Chama o método ingest que acabamos de criar no serviço
      const savedRecord = await UnifiedDataService.ingest(payload);

      res.status(201).json({
        success: true,
        data: savedRecord,
        //message: "Registro unificado ingerido com sucesso."
      });
    } catch (err: any) {
      console.error("❌ Erro ao ingerir dado unificado:", err);
      
      // Erro de chave duplicada no MongoDB (id único)
      if (err.code === 11000) {
        res.status(409).json({ 
          success: false, 
          error: "Já existe um registro com este ID." 
        });
        return;
      }

      res.status(500).json({ 
        success: false, 
        error: err.message || "Erro interno ao processar registro unificado." 
      });
    }
  };

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
   */
  merge = async (req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      const windowMs = req.body?.windowMs ?? 1000;
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