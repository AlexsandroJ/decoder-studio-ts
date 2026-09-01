import { mockSensorDataService, mockUnifiedDataService } from '../mocks/models.mock';

jest.mock('../../src/models/SensorDataModel', () => ({ SensorDataService: mockSensorDataService }));
jest.mock('../../src/models/UnifiedDataModel', () => ({ UnifiedDataService: mockUnifiedDataService }));

import SensorDataController from '../../src/controllers/SensorDataController';

const createMockReq = (body = {}, params = {}, query = {}) => ({ body, params, query }) as any;
const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('SensorDataController (Unitário)', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /sensors (ingest)', () => {
    it('deve ingerir sensor e disparar salvamento unificado em cascata', async () => {
      const req = createMockReq({ sensorId: 'temp_01', value: 45.5, unit: 'C' });
      const res = createMockRes();

      mockSensorDataService.insertMany.mockResolvedValue([{ id: 's-1', sensorId: 'temp_01', value: 45.5 }]);
      mockUnifiedDataService.insertMany.mockResolvedValue([{ id: 'u-1' }]);

      await SensorDataController.ingest(req, res);

      expect(mockSensorDataService.insertMany).toHaveBeenCalled();
      expect(mockUnifiedDataService.insertMany).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('deve retornar 400 se o item não tiver "sensorId"', async () => {
      const req = createMockReq([{ sensorId: 'ok' }, { value: 10 }]);
      const res = createMockRes();

      await SensorDataController.ingest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      // ALTERADO: agora busca pela nova mensagem
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining("'sensorId' é obrigatório")
      }));
    });
  });
});