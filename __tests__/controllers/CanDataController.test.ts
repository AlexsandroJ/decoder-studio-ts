import { mockCanFrameService, mockDecodingRuleService, mockUnifiedDataService } from '../mocks/models.mock';

// APLICAÇÃO DOS MOCKS (Obrigatório ficar antes do import do Controller)
jest.mock('../../src/models/CanFrameModel', () => ({ CanFrameService: mockCanFrameService }));
jest.mock('../../src/models/DecodingRuleModel', () => ({ DecodingRuleService: mockDecodingRuleService }));
jest.mock('../../src/models/UnifiedDataModel', () => ({ UnifiedDataService: mockUnifiedDataService }));

import CanDataController from '../../src/controllers/CanDataController';

const createMockReq = (body = {}, params = {}, query = {}) => ({ body, params, query }) as any;
const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('CanDataController (Unitário)', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /can/frames (ingest)', () => {
    it('deve processar um frame CAN válido e retornar 201', async () => {
      const req = createMockReq({ canId: '0x123', data: 'A1B2C3' });
      const res = createMockRes();

      mockCanFrameService.insertMany.mockResolvedValue([{ id: 'frame-1', canId: '0x123', data: 'A1B2C3' }]);
      mockDecodingRuleService.findByCanId.mockResolvedValue([]);
      mockUnifiedDataService.insert.mockResolvedValue({ id: 'uni-1' });

      await CanDataController.ingest(req, res);

      expect(mockCanFrameService.insertMany).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, count: 1 }));
    });

    it('deve retornar 400 se o payload não tiver "canId" ou "data"', async () => {
      const req = createMockReq({ canId: '0x123' });
      const res = createMockRes();

      await CanDataController.ingest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      // ALTERADO: agora busca pela nova mensagem
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.stringContaining("'canId' e 'data' são obrigatórios")
      }));
      expect(mockCanFrameService.insertMany).not.toHaveBeenCalled();
    });
  });
});