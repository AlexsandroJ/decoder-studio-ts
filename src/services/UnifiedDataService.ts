import { v4 as uuid } from "uuid";
import { ICanFrame, ISensorData, IUnifiedRecord, IDecodedSignal } from "../types";
import CanDecoderService from "./CanDecoderService";
import DecodingRuleModel from "../models/DecodingRuleModel";
import UnifiedDataModel from "../models/UnifiedDataModel";

class UnifiedDataService {
  /**
   * Recebe frames CAN, decodifica e armazena como unified records.
   */
  ingestCanFrames(frames: ICanFrame[]): IUnifiedRecord[] {
    const records: IUnifiedRecord[] = [];

    for (const frame of frames) {
      const rules = DecodingRuleModel.findByCanId(frame.canId);
      const decodedSignals: IDecodedSignal[] =
        CanDecoderService.decodeFrame(frame, rules);

      if (decodedSignals.length === 0) continue;

      const record: IUnifiedRecord = {
        id: uuid(),
        timestamp: frame.timestamp,
        source: "can",
        canSignals: decodedSignals,
      };

      records.push(UnifiedDataModel.insert(record));
    }

    return records;
  }

  /**
   * Recebe leituras de sensores e armazena como unified records.
   */
  ingestSensorData(readings: ISensorData[]): IUnifiedRecord[] {
    return readings.map((reading) => {
      const record: IUnifiedRecord = {
        id: uuid(),
        timestamp: reading.timestamp,
        source: "sensor",
        sensorReadings: [reading],
      };
      return UnifiedDataModel.insert(record);
    });
  }

  /**
   * Cria registros "merged" combinando sinais CAN + sensores
   * dentro de uma janela de tempo (ms).
   */
  mergeByTimeWindow(windowMs = 1000): IUnifiedRecord[] {
    const all = UnifiedDataModel.findAll(9999);
    const merged: IUnifiedRecord[] = [];
    const processed = new Set<string>();

    const sorted = all.sort((a, b) => a.timestamp - b.timestamp);

    for (const record of sorted) {
      if (processed.has(record.id)) continue;

      const window = sorted.filter(
        (r) =>
          !processed.has(r.id) &&
          Math.abs(r.timestamp - record.timestamp) <= windowMs
      );

      const canSignals = window.flatMap((r) => r.canSignals ?? []);
      const sensorReadings = window.flatMap((r) => r.sensorReadings ?? []);

      if (canSignals.length > 0 && sensorReadings.length > 0) {
        const mergedRecord: IUnifiedRecord = {
          id: uuid(),
          timestamp: record.timestamp,
          source: "merged",
          canSignals,
          sensorReadings,
          tags: ["auto-merged"],
        };
        merged.push(UnifiedDataModel.insert(mergedRecord));
      }

      window.forEach((r) => processed.add(r.id));
    }

    return merged;
  }
}

export default new UnifiedDataService();
