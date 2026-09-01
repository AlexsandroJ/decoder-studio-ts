import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { IApiResponse, ISensorData, IUnifiedRecord } from "../types";
import { SensorDataService } from "../models/SensorDataModel";
import { UnifiedDataService } from "../models/UnifiedDataModel";

class SensorDataController {
  /**
   * POST /api/sensors
   */
  ingest = async (req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      const raw = Array.isArray(req.body) ? req.body : [req.body];

      if (raw.length === 0) {
        res.status(400).json({ success: false, error: "Payload vazio." });
        return;
      }

      // 1. Validação ESTRITA no dado bruto (Correção definitiva do bug de validação)
      const invalid = raw.filter((r: any) => !r.sensorId);
      if (invalid.length > 0) {
        res.status(400).json({
          success: false,
          error: `${invalid.length} leitura(s) inválida(s): 'sensorId' é obrigatório.`,
        });
        return;
      }

      // 2. Normalização segura para o tipo ISensorData
      const readings: Partial<ISensorData>[] = raw.map((s: any) => ({
        id: s.id || uuid(),
        sensorId: String(s.sensorId),
        sensorType: String(s.sensorType || "generic"),
        value: s.value, // Aceita number, string, boolean ou object conforme a interface
        unit: s.unit ? String(s.unit) : undefined,
        timestamp: s.timestamp || Date.now(),
        metadata: s.metadata || undefined,
        deviceId: s.deviceId ? String(s.deviceId) : undefined
      }));

      // 3. Salvamento no modelo de Sensores
      const saved = await SensorDataService.insertMany(readings);

      // 4. Mapeamento para o formato Unificado (IUnifiedRecord)
      const unifiedRecords: Partial<IUnifiedRecord>[] = saved.map((s: any) => ({
        id: uuid(),
        timestamp: s.timestamp,
        source: "sensor",
        sensorReadings: [{
          id: s.id,
          sensorId: s.sensorId,
          sensorType: s.sensorType,
          value: s.value,
          unit: s.unit,
          timestamp: s.timestamp
        }],
        tags: s.metadata ? ["has_metadata"] : undefined
      }));

      await UnifiedDataService.insertMany(unifiedRecords);

      res.status(201).json({
        success: true,
        data: { readings: saved, unifiedRecords },
        count: saved.length,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  list = async (req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      const { sensorId, sensorType, limit } = req.query;
      const l = parseInt(limit as string, 10) || 100;

      let data;
      if (sensorId) data = await SensorDataService.findBySensorId(sensorId as string, l);
      else if (sensorType) data = await SensorDataService.findByType(sensorType as string, l);
      else data = await SensorDataService.findRecent(l);

      res.json({ success: true, data, count: data.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

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

  clear = async (_req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      await SensorDataService.clear();
      res.json({ success: true, data: "Todas as leituras de sensor removidas." });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}

export default new SensorDataController();