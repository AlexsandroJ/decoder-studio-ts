import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

let sdk: NodeSDK | null = null;

export function startObservability() {
  if (sdk) {
    console.log('⚠️ OpenTelemetry já está inicializado.');
    return;
  }

  const prometheusExporter = new PrometheusExporter({
    port: 9464,
    endpoint: '/metrics',
    host: '0.0.0.0',
  });

  sdk = new NodeSDK({
    metricReader: prometheusExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-express': { enabled: true },
        '@opentelemetry/instrumentation-http': { enabled: true },
      }),
    ],
  });

  sdk.start();
  console.log('✅ OpenTelemetry inicializado (Traces e Métricas automáticas)');
}

export async function shutdownObservability() {
  if (sdk) {
    console.log('🔄 Desligando OpenTelemetry...');
    await sdk.shutdown();
    sdk = null;
  }
}