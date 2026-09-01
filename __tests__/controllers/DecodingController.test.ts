import { mockDecodingRuleService } from '../mocks/models.mock';

jest.mock('../../src/models/DecodingRuleModel', () => ({ DecodingRuleService: mockDecodingRuleService }));

import DecodingController from '../../src/controllers/DecodingController';

const createMockReq = (body = {}, params = {}, query = {}) => ({ body, params, query }) as any;
const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('DecodingController (Unitário)', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /decoding/rules (create)', () => {
    it('deve criar regra com valores padrão (factor=1, offset=0) se não fornecidos', async () => {
      const req = createMockReq({ canId: '0x123', signalName: 'Temp', startBit: 0, bitLength: 8 });
      const res = createMockRes();

      mockDecodingRuleService.insertMany.mockResolvedValue([{ id: 'rule-1', factor: 1, offset: 0 }]);

      await DecodingController.create(req, res);

      expect(mockDecodingRuleService.insertMany).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ canId: '0x123', factor: 1, offset: 0, byteOrder: 'big' })
      ]));
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('DELETE /decoding/rules/:id (delete)', () => {
    it('deve retornar 404 se a regra não for encontrada para deleção', async () => {
      const req = createMockReq({}, { id: 'regra-inexistente' });
      const res = createMockRes();

      mockDecodingRuleService.delete.mockResolvedValue(false);

      await DecodingController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Regra não encontrada.'
      }));
    });
  });
});