#!/bin/bash

# ==============================================================================
# SCRIPT: setup-tests.sh
# PROPÓSITO: Automatizar a configuração e organização dos testes unitários 
#            para a API CAN Sensor (decoder-studio-ts).
# AUTOR: Alexsandro J Silva (Gerado por Qwen)
# COMPATIBILIDADE: Ubuntu, Git Bash (Windows), macOS
# ==============================================================================

# 1. Configuração de cores para saída no terminal (melhora a legibilidade)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Iniciando Configuração de Testes      ${NC}"
echo -e "${GREEN}========================================${NC}"

# 2. Verificação de Ambiente
# Garante que o script está sendo executado na raiz do projeto
if [ ! -f "package.json" ]; then
    echo -e "${RED}Erro: 'package.json' não encontrado.${NC}"
    echo -e "${YELLOW}Execute este script na raiz do projeto decoder-studio-ts.${NC}"
    exit 1
fi

# 3. Instalação de Dependências de Desenvolvimento
echo -e "\n${YELLOW}📦 Instalando dependências de teste (Jest, Supertest)...${NC}"
npm install -D jest ts-jest @types/jest supertest @types/supertest

# 4. Criação da Estrutura de Diretórios
echo -e "\n${YELLOW}📁 Criando estrutura de diretórios de testes...${NC}"
mkdir -p __tests__/controllers
mkdir -p __tests__/mocks

# 5. Geração do Arquivo de Configuração do Jest
echo -e "\n${YELLOW}⚙️  Gerando jest.config.js...${NC}"
cat << 'EOF' > jest.config.js
/**
 * Configuração do Jest para projetos TypeScript.
 * Utiliza ts-jest para compilar os arquivos .ts em tempo de execução dos testes.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__', '<rootDir>/src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts' // Exclui o ponto de entrada do servidor da cobertura
  ],
  coverageDirectory: 'coverage',
  verbose: true
};
EOF

# 6. Geração dos Arquivos de Teste Unitário (Controllers)
echo -e "\n${YELLOW}📝 Gerando arquivos de teste unitário...${NC}"

# --- Mocks Globais ---
cat << 'EOF' > __tests__/mocks/services.mock.ts
/**
 * Mocks Globais dos Services.
 * Estes mocks interceptam as chamadas reais ao banco de dados,
 * permitindo testar apenas a lógica do Controller de forma isolada e rápida.
 */
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
};

// Aplica os mocks aos módulos reais
jest.mock('../../src/services/CanFrameService', () => mockCanFrameService);
jest.mock('../../src/services/DecodingRuleService', () => mockDecodingRuleService);
jest.mock('../../src/services/SensorDataService', () => mockSensorDataService);
jest.mock('../../src/services/UnifiedDataService', () => mockUnifiedDataService);
EOF

# --- Teste do CanDataController ---
cat << 'EOF' > __tests__/controllers/CanDataController.test.ts
import CanDataController from '../../src/controllers/CanDataController';
import { mockCanFrameService, mockDecodingRuleService, mockUnifiedDataService } from '../mocks/services.mock';

// Helper para simular Request e Response do Express
const createMockReq = (body = {}, params = {}, query = {}) => ({ body, params, query }) as any;
const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('CanDataController (Unitário)', () => {
  beforeEach(() => {
    // Limpa o histórico de chamadas dos mocks antes de cada teste
    jest.clearAllMocks();
  });

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
      const req = createMockReq({ canId: '0x123' }); // Faltou 'data'
      const res = createMockRes();

      await CanDataController.ingest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.stringContaining('sem canId ou data')
      }));
      // Garante que o service NUNCA foi chamado, pois falhou na validação
      expect(mockCanFrameService.insertMany).not.toHaveBeenCalled();
    });
  });
});
EOF

# --- Teste do DecodingController ---
cat << 'EOF' > __tests__/controllers/DecodingController.test.ts
import DecodingController from '../../src/controllers/DecodingController';
import { mockDecodingRuleService } from '../mocks/services.mock';

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
EOF

# --- Teste do SensorDataController ---
cat << 'EOF' > __tests__/controllers/SensorDataController.test.ts
import SensorDataController from '../../src/controllers/SensorDataController';
import { mockSensorDataService, mockUnifiedDataService } from '../mocks/services.mock';

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
      expect(mockUnifiedDataService.insertMany).toHaveBeenCalled(); // Cascata
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('deve retornar 400 se o item não tiver "sensorId"', async () => {
      const req = createMockReq([{ sensorId: 'ok' }, { value: 10 }]); // Segundo item inválido
      const res = createMockRes();

      await SensorDataController.ingest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('sem sensorId')
      }));
    });
  });
});
EOF

# --- Teste do UnifiedDataController ---
cat << 'EOF' > __tests__/controllers/UnifiedDataController.test.ts
import UnifiedDataController from '../../src/controllers/UnifiedDataController';
import { mockUnifiedDataService } from '../mocks/services.mock';

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
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: "Parâmetros 'start' e 'end' (epoch ms) são obrigatórios."
      }));
      expect(mockUnifiedDataService.findByTimeRange).not.toHaveBeenCalled();
    });
  });
});
EOF

# 7. Atualização do package.json (Adicionando scripts de teste)
echo -e "\n${YELLOW}🔄 Atualizando package.json com scripts de teste...${NC}"
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts['test'] = 'jest';
pkg.scripts['test:watch'] = 'jest --watch';
pkg.scripts['test:coverage'] = 'jest --coverage';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('✅ Scripts adicionados ao package.json com sucesso.');
"

# 8. Conclusão
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Configuração de Testes Concluída!  ${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}Próximos passos:${NC}"
echo -e "1. Execute os testes com: ${GREEN}npm run test${NC}"
echo -e "2. Para modo observação (watch): ${GREEN}npm run test:watch${NC}"
echo -e "3. Para ver a cobertura de código: ${GREEN}npm run test:coverage${NC}"