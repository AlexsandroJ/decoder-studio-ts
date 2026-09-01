import { mockUnifiedDataService } from '../mocks/models.mock';

jest.mock('../../src/models/UnifiedDataModel', () => ({ UnifiedDataService: mockUnifiedDataService }));

import UnifiedDataController from '../../src/controllers/UnifiedDataController';

const createMockReq = (body = {}, params = {}, query = {}) => ({ body, params, query }) as any;
const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('UnifiedDataController (Unitário)', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /unified/range (getByTimeRange)', () => {
    it('deve buscar dados por intervalo de tempo quando start e end são válidos', async () => {
      const req = createMockReq({}, {}, { start: '1700000000000', end: '1700001000000' });
      const res = createMockRes();

      mockUnifiedDataService.findByTimeRange.mockResolvedValue([{ id: 'u-1' }]);

      await UnifiedDataController.getByTimeRange(req, res);

      expect(mockUnifiedDataService.findByTimeRange).toHaveBeenCalledWith(1700000000000, 1700001000000);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('deve retornar 400 se "start" ou "end" não forem números (isNaN)', async () => {
      const req = createMockReq({}, {}, { start: 'hoje', end: 'amanha' });
      const res = createMockRes();

      await UnifiedDataController.getByTimeRange(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      // ALTERADO: agora busca pela nova mensagem completa
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: "Parâmetros 'start' e 'end' (epoch ms) são obrigatórios e devem ser numéricos."
      }));
      expect(mockUnifiedDataService.findByTimeRange).not.toHaveBeenCalled();
    });
  });
});