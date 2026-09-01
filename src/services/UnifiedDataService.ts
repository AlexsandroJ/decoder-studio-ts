import { v4 as uuid } from "uuid";
import { ICanFrame, ISensorData, IUnifiedRecord, IDecodedSignal } from "../types";
import {CanDecoderService} from "./CanDecoderService";
import { DecodingRuleService } from "../models/DecodingRuleModel";
import { UnifiedDataService as UnifiedModelService } from "../models/UnifiedDataModel";

class UnifiedDataService {

  /**
   * Recebe leituras de sensores e armazena como unified records.
   */
async ingestCanFrames(frames: ICanFrame[]): Promise<IUnifiedRecord[]> {
  const records: Partial<IUnifiedRecord>[] = [];

  for (const frame of frames) {
    /*
    console.log("🔍 Frame recebido:", {
      canId: frame.canId,
      data: frame.data,
      timestamp: frame.timestamp
    });
    */
    if (!frame.data) {
      console.warn("⚠️ Frame sem campo data, pulando decodificação");
      continue;
    }

    const rules = await DecodingRuleService.findByCanId(frame.canId);
    //console.log(`📋 Regras encontradas para ${frame.canId}: ${rules.length}`);

    if (rules.length === 0) {
      console.warn(`⚠️ Nenhuma regra para canId: ${frame.canId}`);
    }

    const decodedSignals = CanDecoderService.decodeFrame(frame, rules);
    //console.log(` Sinais decodificados: ${decodedSignals.length}`);

    if (decodedSignals.length === 0) continue;

    const record: Partial<IUnifiedRecord> = {
      id: uuid(),
      timestamp: frame.timestamp,
      source: "can",
      canSignals: decodedSignals,
      
    };

    records.push(record);
  }

  //console.log(`💾 Salvando ${records.length} registros unificados`);
  return await UnifiedModelService.insertMany(records);
}

  /**
   * Cria registros "merged" combinando sinais CAN + sensores
   * dentro de uma janela de tempo (ms).
   */
  async mergeByTimeWindow(windowMs: number = 1000): Promise<IUnifiedRecord[]> {
    // ✅ Usa o serviço para buscar todos os registros
    const all: IUnifiedRecord[] = await UnifiedModelService.findRecent(9999);
    const merged: Partial<IUnifiedRecord>[] = [];
    const processed = new Set<string>();

    // ✅ Tipagem explícita nos parâmetros do sort
    const sorted = all.sort((a: IUnifiedRecord, b: IUnifiedRecord) => 
      a.timestamp - b.timestamp
    );

    for (const record of sorted) {
      if (processed.has(record.id)) continue;

      // ✅ Tipagem explícita no filter
      const window = sorted.filter((r: IUnifiedRecord) =>
        !processed.has(r.id) &&
        Math.abs(r.timestamp - record.timestamp) <= windowMs
      );

      // ✅ Tipagem explícita no flatMap
      const canSignals = window.flatMap((r: IUnifiedRecord) => r.canSignals ?? []);
      const sensorReadings = window.flatMap((r: IUnifiedRecord) => r.sensorReadings ?? []);

      if (canSignals.length > 0 && sensorReadings.length > 0) {
        const mergedRecord: Partial<IUnifiedRecord> = {
          id: uuid(),
          timestamp: record.timestamp,
          source: "merged",
          canSignals,
          sensorReadings,
          tags: ["auto-merged"],
          
        };
        merged.push(mergedRecord);
      }

      // ✅ Tipagem explícita no forEach
      window.forEach((r: IUnifiedRecord) => processed.add(r.id));
    }

    // ✅ Salva os registros merged
    return await UnifiedModelService.insertMany(merged);
  }

  /**
   * Ingestão de dados customizados/arbitrários
   */
  async ingestCustomData(records: Partial<IUnifiedRecord>[]): Promise<IUnifiedRecord[]> {
    const normalized: Partial<IUnifiedRecord>[] = records.map((r) => ({
      id: r.id || uuid(),
      timestamp: r.timestamp || Date.now(),
      source: r.source || "custom",
      customData: r.customData || {},
      tags: r.tags || [],
    }));

    return await UnifiedModelService.insertMany(normalized);
  }

  /**
   * Método auxiliar direto para insertMany (caso algum controller precise)
   */
  async insertMany(records: Partial<IUnifiedRecord>[]): Promise<IUnifiedRecord[]> {
    return await UnifiedModelService.insertMany(records);
  }
}

export default new UnifiedDataService();