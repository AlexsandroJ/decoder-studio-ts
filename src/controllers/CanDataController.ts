import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { IApiResponse, ICanFrame, IDecodedSignal } from "../types";
import { CanFrameService } from "../models/CanFrameModel";
import { DecodingRuleService } from "../models/DecodingRuleModel";
import { UnifiedDataService } from "../models/UnifiedDataModel";
import { CanDecoderService } from "../services/CanDecoderService"; // Lógica pura de decodificação

class CanDataController {
  /**
   * POST /api/can/frames
   * Ingere frames brutos, decodifica e unifica.
   */
  ingest = async (req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      const raw = Array.isArray(req.body) ? req.body : [req.body];

      if (raw.length === 0) {
        res.status(400).json({ success: false, error: "Payload vazio." });
        return;
      }

      // 1. Validação ESTRITA no dado bruto (antes de qualquer mapeamento)
      const invalid = raw.filter((f: any) => !f.canId || !f.data);
      if (invalid.length > 0) {
        res.status(400).json({
          success: false,
          error: `${invalid.length} frame(s) inválido(s): 'canId' e 'data' são obrigatórios.`,
        });
        return;
      }

      // 2. Normalização segura para o tipo ICanFrame
      const framesToSave: Partial<ICanFrame>[] = raw.map((f: any) => ({
        id: f.id || uuid(),
        canId: String(f.canId),
        dlc: f.dlc || 8,
        data: String(f.data || f.payload || f.hexData),
        timestamp: f.timestamp || Date.now(),
        interface: f.interface || "http"
      }));

      // 3. Salvamento do dado bruto
      const savedFrames = await CanFrameService.insertMany(framesToSave);
      const unifiedRecords: any[] = [];

      // 4. Processamento: Decodificar e Unificar
      for (const frame of savedFrames) {
        const rules = await DecodingRuleService.findByCanId(frame.canId!);

        // --- ADICIONE ESTA LINHA PARA DEBUG ---
        console.log(`🔍 DEBUG: Frame canId="${frame.canId}", Regras encontradas: ${rules.length}`);
        if (rules.length === 0) {
          console.warn(`⚠️ Nenhuma regra de decodificação cadastrada para o canId: ${frame.canId}`);
        }
        // --------------------------------------
        // Delega a matemática de bits para o serviço dedicado
        const decodedSignals: IDecodedSignal[] = CanDecoderService.decodeFrame(frame as ICanFrame, rules);

        const unified = await UnifiedDataService.insert({
          id: uuid(),
          timestamp: frame.timestamp,
          source: "can",
          canSignals: decodedSignals.length > 0 ? decodedSignals : undefined,
          tags: [frame.interface || "http"]
        });
        unifiedRecords.push(unified);
      }

      res.status(201).json({
        success: true,
        data: { frames: savedFrames, unified: unifiedRecords },
        count: savedFrames.length,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  list = async (req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      const { canId, limit } = req.query;
      const l = parseInt(limit as string, 10) || 100;
      const frames = canId
        ? await CanFrameService.findByCanId(canId as string, l)
        : await CanFrameService.findAll(l);

      res.json({ success: true, data: frames, count: frames.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  getById = async (req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      const frame = await CanFrameService.findById(req.params.id as string);
      if (!frame) {
        res.status(404).json({ success: false, error: "Frame não encontrado." });
        return;
      }
      res.json({ success: true, data: frame });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  clear = async (_req: Request, res: Response<IApiResponse>): Promise<void> => {
    try {
      await CanFrameService.clear();
      res.json({ success: true, data: "Todos os frames CAN removidos." });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}

export default new CanDataController();