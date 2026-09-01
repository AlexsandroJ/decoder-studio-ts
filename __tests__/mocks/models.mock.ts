// __tests__/mocks/models.mock.ts

export const mockCanFrameService = {
  insertMany: jest.fn(),
  findByCanId: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  clear: jest.fn(),
};

export const mockDecodingRuleService = {
  insertMany: jest.fn(),
  findByCanId: jest.fn(),
  findAll: jest.fn(),
  delete: jest.fn(),
};

export const mockSensorDataService = {
  insertMany: jest.fn(),
  findBySensorId: jest.fn(),
  findByType: jest.fn(),
  findRecent: jest.fn(),
  findById: jest.fn(),
  clear: jest.fn(),
};


export const mockUnifiedDataService = {
  insert: jest.fn(),
  insertMany: jest.fn(),
  findByTimeRange: jest.fn(),
  findRecent: jest.fn(),
  findById: jest.fn(),
  clear: jest.fn(),
  // ADICIONE ESTA LINHA:
  mergeByTimeWindow: jest.fn(),
};