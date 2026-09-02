import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Cria um registro isolado para não conflitar com o do OpenTelemetry
const register = new client.Registry();

// 1. Coleta métricas padrão do Node.js (CPU, Memória, Event Loop)
client.collectDefaultMetrics({ register });

// 2. Métrica customizada: Duração das requisições HTTP
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5], // Buckets em segundos
  registers: [register],
});

// 3. Métrica customizada: Requisições ativas no momento
export const activeRequests = new client.Gauge({
  name: 'http_active_requests',
  help: 'Número de requisições HTTP sendo processadas atualmente',
  registers: [register],
});

// Middleware para injetar nas rotas do Express
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  activeRequests.inc();
  
  // Usa o route.path se existir (ex: '/api/users/:id'), senão usa o path original
  const route = req.route ? req.route.path : req.path;
  const endTimer = httpRequestDuration.startTimer({ method: req.method, route });

  res.on('finish', () => {
    endTimer({ status_code: res.statusCode });
    activeRequests.dec();
  });

  next();
};

// Função auxiliar para o endpoint de scrape
export const getMetrics = async () => await register.metrics();
export const getContentType = () => register.contentType;