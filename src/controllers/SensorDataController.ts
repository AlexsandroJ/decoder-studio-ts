import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { ISensorData, IApiResponse } from "../types";
import SensorDataModel from "../models/SensorDataModel";
import UnifiedDataService from "../services/UnifiedDataService";

class SensorDataController {
  /**
   * POST /api/sensors
   * Recebe uma ou mais leituras de sensores genéricos.
   * Body: ISensorData | ISensorData[]
   */
  ingest = (req: Request, res: Response<IApiResponse>): void => {
    try {
      const raw = Array.isArray(req.body) ? req.body : [req.body];

      if (raw.length === 0) {
        res.status(400).json({ success: false, error: "Payload vazio." });
        return;
      }

      const readings: ISensorData[] = raw.map((s: Partial<ISensorData>) => ({
        id: s.id ?? uuid(),
        sensorId: s.sensorId ?? "unknown",
        sensorType: s.sensorType ?? "generic",
        value: s.value ?? 0,
        unit: s.unit,
        timestamp: s.timestamp ?? Date.now(),
        metadata: s.metadata,
      }));

      const invalid = readings.filter((r) => !r.sensorId);
      if (invalid.length > 0) {
        res.status(400).json({
          success: false,
          error: `${invalid.length} leitura(s) sem sensorId.`,
        });
        return;
      }

      const saved = SensorDataModel.insertMany(readings);

      // Unifica automaticamente
      const unified = UnifiedDataService.ingestSensorData(saved);

      res.status(201).json({
        success: true,
        data: { readings: saved, unifiedRecords: unified },
        count: saved.length,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  /**
   * GET /api/sensors
   * Query: ?sensorId=temp01&sensorType=temperature&limit=50
   */
  list = (req: Request, res: Response<IApiResponse>): void => {
    try {
      const { sensorId, sensorType, limit } = req.query;
      const l = parseInt(limit as string, 10) || 100;

      let data: ISensorData[];
      if (sensorId) {
        data = SensorDataModel.findBySensorId(sensorId as string);
      } else if (sensorType) {
        data = SensorDataModel.findByType(sensorType as string);
      } else {
        data = SensorDataModel.findAll(l);
      }

      res.json({ success: true, data, count: data.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  /**
   * GET /api/sensors/:id
   */
  getById = (req: Request, res: Response<IApiResponse>): void => {
    const reading = SensorDataModel.findById(req.params.id);
    if (!reading) {
      res.status(404).json({ success: false, error: "Leitura não encontrada." });
      return;
    }
    res.json({ success: true, data: reading });
  };

  /**
   * DELETE /api/sensors
   */
  clear = (_req: Request, res: Response<IApiResponse>): void => {
    SensorDataModel.clear();
    res.json({ success: true, data: "Todas as leituras removidas." });
  };
}

export default new SensorDataController();
