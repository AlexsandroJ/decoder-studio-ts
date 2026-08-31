import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { ICanFrame, IApiResponse } from "../types";
import CanFrameModel from "../models/CanFrameModel";
import UnifiedDataService from "../services/UnifiedDataService";

class CanDataController {
  /**
   * POST /api/can/frames
   * Recebe um ou mais frames CAN brutos.
   * Body: ICanFrame | ICanFrame[]
   */
  ingest = (req: Request, res: Response<IApiResponse>): void => {
    try {
      const raw = Array.isArray(req.body) ? req.body : [req.body];

      if (raw.length === 0) {
        res.status(400).json({ success: false, error: "Payload vazio." });
        return;
      }

      const frames: ICanFrame[] = raw.map((f: Partial<ICanFrame>) => ({
        id: f.id ?? uuid(),
        canId: f.canId ?? "",
        dlc: f.dlc ?? 8,
        data: f.data ?? "",
        timestamp: f.timestamp ?? Date.now(),
        interface: f.interface,
      }));

      // Validação mínima
      const invalid = frames.filter((f) => !f.canId || !f.data);
      if (invalid.length > 0) {
        res.status(400).json({
          success: false,
          error: `${invalid.length} frame(s) sem canId ou data.`,
        });
        return;
      }

      const saved = CanFrameModel.insertMany(frames);

      // Decodifica + unifica automaticamente
      const unified = UnifiedDataService.ingestCanFrames(saved);

      res.status(201).json({
        success: true,
        data: { frames: saved, decodedRecords: unified },
        count: saved.length,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  /**
   * GET /api/can/frames
   * Lista frames CAN armazenados.
   * Query: ?canId=0x1A3&limit=50
   */
  list = (req: Request, res: Response<IApiResponse>): void => {
    try {
      const { canId, limit } = req.query;
      const l = parseInt(limit as string, 10) || 100;

      const frames = canId
        ? CanFrameModel.findByCanId(canId as string)
        : CanFrameModel.findAll(l);

      res.json({ success: true, data: frames, count: frames.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  /**
   * GET /api/can/frames/:id
   */
  getById = (req: Request, res: Response<IApiResponse>): void => {
    const frame = CanFrameModel.findById(req.params.id as string);
    if (!frame) {
      res.status(404).json({ success: false, error: "Frame não encontrado." });
      return;
    }
    res.json({ success: true, data: frame });
  };

  /**
   * DELETE /api/can/frames
   */
  clear = (_req: Request, res: Response<IApiResponse>): void => {
    CanFrameModel.clear();
    res.json({ success: true, data: "Todos os frames removidos." });
  };
}

export default new CanDataController();
