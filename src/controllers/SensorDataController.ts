import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { IApiResponse, ISensorData, IUnifiedRecord } from "../types";
import { SensorDataService } from "../models/SensorDataModel";
import { UnifiedDataService } from "../models/UnifiedDataModel";

class SensorDataController {
  /**
   * POST /api/sensors
   * Recebe uma ou mais leituras de sensores genéricos.
   * Body: ISensorData | ISensorData[]
   */
  ingest = async (req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      const raw = Array.isArray(req.body) ? req.body : [req.body];

      if (raw.length === 0) {
        res.status(400).json({ success: false, error: "Payload vazio." });
        return;
      }

      // Normaliza os dados
      const readings: Partial<ISensorData>[] = raw.map((s: any) => ({
        id: s.id || uuid(),
        sensorId: s.sensorId || "unknown",
        sensorType: s.sensorType || "generic",
        value: s.value ?? 0,
        unit: s.unit,
        timestamp: s.timestamp || Date.now(),
        metadata: s.metadata,
        deviceId: s.deviceId // Útil se o sensor vier de um dispositivo específico
      }));

      // Validação mínima
      const invalid = readings.filter((r) => !r.sensorId);
      if (invalid.length > 0) {
        res.status(400).json({
          success: false,
          error: `${invalid.length} leitura(s) sem sensorId.`,
        });
        return;
      }

      // 1. Salva no modelo de Sensores
      const saved = await SensorDataService.insertMany(readings);

      // 2. Mapeia para o formato Unificado e salva
      const unifiedRecords: Partial<ISensorData>[] = saved.map((s: any) => ({
        id: uuid(),
        timestamp: s.timestamp,
        source: "sensor",
        sensorReadings: [{
          sensorId: s.sensorId,
          sensorType: s.sensorType,
          value: s.value,
          unit: s.unit
        }],
        deviceId: s.deviceId,
        tags: s.metadata ? ["has_metadata"] : []
      }));

      const unified = await UnifiedDataService.insertMany(unifiedRecords);

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
  list = async (req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      const { sensorId, sensorType, limit } = req.query;
      const l = parseInt(limit as string, 10) || 100;

      let data;
      if (sensorId) {
        data = await SensorDataService.findBySensorId(sensorId as string, l);
      } else if (sensorType) {
        data = await SensorDataService.findByType(sensorType as string, l);
      } else {
        data = await SensorDataService.findRecent(l);
      }

      res.json({ success: true, data, count: data.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  /**
   * GET /api/sensors/:id
   */
  getById = async (req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      const reading = await SensorDataService.findById(req.params.id as string);
      if (!reading) {
        res.status(404).json({ success: false, error: "Leitura não encontrada." });
        return;
      }
      res.json({ success: true, data: reading });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  /**
   * DELETE /api/sensors
   */
  clear = async (_req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      await SensorDataService.clear();
      res.json({ success: true, data: "Todas as leituras de sensor removidas." });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}

// ⚠️ Exportação default é crucial para as rotas funcionarem
export default new SensorDataController();