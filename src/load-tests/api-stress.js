// load-tests/api-stress.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Métrica customizada do k6 para taxa de erro
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '10s', target: 10 },  // Aquecimento: 10 usuários
    { duration: '30s', target: 50 },  // Pico: 50 usuários simultâneos
    { duration: '10s', target: 0 },   // Resfriamento
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% das requisições devem ser < 200ms
    errors: ['rate<0.05'],            // Menos de 5% de erros
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://localhost:3001';

export default function () {
  // 1. Teste de Health Check
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    'health check status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  // 2. Teste de Ingestão CAN (Simulando um payload)
  const canPayload = JSON.stringify({
    can_id: "0x123",
    data: [1, 2, 3, 4, 5, 6, 7, 8],
    timestamp: Date.now()
  });

  const canRes = http.post(`${BASE_URL}/api/can/frames`, canPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(canRes, {
    'CAN frame status 200 or 201': (r) => r.status === 200 || r.status === 201,
    'CAN response time < 100ms': (r) => r.timings.duration < 100,
  }) || errorRate.add(1);

  sleep(1); // Pausa de 1 segundo entre iterações do usuário virtual
}