// ════════════════════════════════════════════════════════
//  SIMULADOR DE DADOS CAN / SENSORES VIA MQTT
//  Uso: node simulator-mqtt.js
// ════════════════════════════════════════════════════════

const mqtt = require('mqtt');

// ════════════════════════════════════════════════════════
//  CONFIGURAÇÃO (Fallback com os dados fornecidos)
// ════════════════════════════════════════════════════════
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtts://eaa7d5aa.ala.eu-central-1.emqxsl.com:8883';
const MQTT_USER = process.env.MQTT_USER || 'modcs';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || '12345678';
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'moto/can';

// ════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 2) => 
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

const generateId = () => `sim_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

// ════════════════════════════════════════════════════════
//  GERADORES DE DADOS (Mesma lógica realista do anterior)
// ════════════════════════════════════════════════════════

function generateCANPayloads() {
  const rpm = randomInt(800, 6500);
  const temp = randomInt(-10, 120);
  const speed = randomInt(0, 180);
  const fuel = randomInt(0, 100);
  const voltage = randomFloat(11.5, 14.8, 1);

  const rpmHex = Math.round(rpm / 0.25).toString(16).padStart(4, '0');
  const tempHex = Math.round((temp + 40) / 0.1).toString(16).padStart(4, '0');
  const speedHex = speed.toString(16).padStart(2, '0');
  const fuelHex = Math.round(fuel * 255 / 100).toString(16).padStart(2, '0');
  const voltHex = Math.round(voltage / 0.1).toString(16).padStart(4, '0');

  // Retorna array de payloads compatíveis com CanPayload do backend
  return [
    {
      canId: '0x00000014',
      data: `${rpmHex}${tempHex}00000000`,
      dlc: 8,
      timestamp: Date.now(),
      interface: 'mqtt'
    },
    {
      canId: '0x000006A0',
      data: `${speedHex}${fuelHex}00000000`,
      dlc: 8,
      timestamp: Date.now(),
      interface: 'mqtt'
    },
    {
      canId: '0x000006A1',
      data: `${voltHex}000000000000`,
      dlc: 8,
      timestamp: Date.now(),
      interface: 'mqtt'
    }
  ];
}

function generateSensorPayloads() {
  const now = Date.now();
  
  return [
    // ═══════════════════════════════════════════════════
    //  1. NÚMEROS SIMPLES (Number Widget)
    // ═══════════════════════════════════════════════════
    {
      sensorId: 'temp-outdoor',
      sensorType: 'temperature',
      value: randomFloat(-10, 45, 1),
      unit: '°C',
      timestamp: now,
      metadata: { location: 'outdoor', zone: 'A' }
    },
    {
      sensorId: 'humidity',
      sensorType: 'environment',
      value: randomFloat(30, 90, 1),
      unit: '%',
      timestamp: now
    },
    {
      sensorId: 'pressure',
      sensorType: 'environment',
      value: randomFloat(980, 1020, 1),
      unit: 'hPa',
      timestamp: now
    },
    
    // ═══════════════════════════════════════════════════
    //  2. BOOLEANOS (LED Widget)
    // ═══════════════════════════════════════════════════
    {
      sensorId: 'door-status',
      sensorType: 'binary',
      value: randomInt(0, 1) === 1,
      unit: 'bool',
      timestamp: now,
      metadata: { zone: 'entrance' }
    },
    {
      sensorId: 'ignition',
      sensorType: 'binary',
      value: randomInt(0, 1) === 1,
      unit: 'bool',
      timestamp: now
    },
    {
      sensorId: 'alarm-active',
      sensorType: 'binary',
      value: randomInt(0, 10) > 8, // 20% de chance de estar ativo
      unit: 'bool',
      timestamp: now
    },
    
    // ═══════════════════════════════════════════════════
    //  3. TEXTO/STRING (Text Widget)
    // ═══════════════════════════════════════════════════
    {
      sensorId: 'vehicle-mode',
      sensorType: 'status',
      value: ['Drive', 'Park', 'Neutral', 'Reverse'][randomInt(0, 3)],
      unit: 'mode',
      timestamp: now
    },
    {
      sensorId: 'gear-position',
      sensorType: 'transmission',
      value: ['P', 'R', 'N', 'D', 'S'][randomInt(0, 4)],
      unit: 'gear',
      timestamp: now
    },
    {
      sensorId: 'error-code',
      sensorType: 'diagnostic',
      value: `P${randomInt(0, 9)}${randomInt(100, 999)}`,
      unit: 'OBD-II',
      timestamp: now,
      metadata: { severity: ['low', 'medium', 'high'][randomInt(0, 2)] }
    },
    
    // ═══════════════════════════════════════════════════
    //  4. OBJETOS COMPLEXOS (JSON Widget)
    // ═══════════════════════════════════════════════════
    {
      sensorId: 'engine-monitor',
      sensorType: 'multi-parameter',
      value: {
        temperature: {
          current: randomFloat(70, 120, 1),
          max: 130,
          min: 60,
          unit: '°C',
          status: randomInt(0, 100) > 80 ? 'warning' : 'normal'
        },
        pressure: {
          value: randomFloat(1.5, 3.5, 2),
          unit: 'bar',
          trend: ['stable', 'rising', 'falling'][randomInt(0, 2)]
        },
        rpm: randomInt(800, 6500),
        load: randomFloat(0, 100, 1),
        throttle: randomFloat(0, 100, 1)
      },
      unit: 'mixed',
      timestamp: now,
      metadata: { ecu: 'ECU-01', vin: '1HGBH41JXMN109186' }
    },
    {
      sensorId: 'diagnostic-info',
      sensorType: 'diagnostic',
      value: {
        dtcCount: randomInt(0, 5),
        milStatus: randomInt(0, 1) === 1,
        readinessTests: {
          misfire: randomInt(0, 10) > 2 ? 'complete' : 'incomplete',
          fuel: randomInt(0, 10) > 2 ? 'complete' : 'incomplete',
          components: randomInt(0, 10) > 2 ? 'complete' : 'incomplete'
        },
        lastScan: new Date(now - randomInt(0, 86400000)).toISOString()
      },
      unit: 'obd',
      timestamp: now
    },
    
    // ═══════════════════════════════════════════════════
    //  5. ARRAYS DE PRIMITIVOS (Array Widget)
    // ═══════════════════════════════════════════════════
    {
      sensorId: 'cylinder-temps',
      sensorType: 'engine',
      value: [
        randomFloat(70, 120, 1),
        randomFloat(70, 120, 1),
        randomFloat(70, 120, 1),
        randomFloat(70, 120, 1)
      ],
      unit: '°C',
      timestamp: now,
      metadata: { cylinders: 4 }
    },
    {
      sensorId: 'tire-pressure',
      sensorType: 'chassis',
      value: [
        randomFloat(28, 35, 1),
        randomFloat(28, 35, 1),
        randomFloat(28, 35, 1),
        randomFloat(28, 35, 1)
      ],
      unit: 'PSI',
      timestamp: now,
      metadata: { positions: ['FL', 'FR', 'RL', 'RR'] }
    },
    {
      sensorId: 'fuel-trim',
      sensorType: 'engine',
      value: [
        randomFloat(-10, 10, 2),
        randomFloat(-10, 10, 2)
      ],
      unit: '%',
      timestamp: now,
      metadata: { banks: ['Bank 1', 'Bank 2'] }
    },
    
    // ═══════════════════════════════════════════════════
    //  6. ARRAYS DE OBJETOS (Table Widget)
    // ═══════════════════════════════════════════════════
    {
      sensorId: 'battery-pack',
      sensorType: 'battery',
      value: {
        voltage: randomFloat(11.5, 14.8, 2),
        current: randomFloat(-50, 150, 1),
        charge: randomFloat(0, 100, 1),
        health: randomFloat(70, 100, 1),
        temperature: randomFloat(20, 60, 1),
        cells: [
          { id: 1, voltage: randomFloat(3.2, 4.2, 2), temp: randomFloat(20, 50, 1), status: 'ok' },
          { id: 2, voltage: randomFloat(3.2, 4.2, 2), temp: randomFloat(20, 50, 1), status: randomInt(0, 10) > 8 ? 'warning' : 'ok' },
          { id: 3, voltage: randomFloat(3.2, 4.2, 2), temp: randomFloat(20, 50, 1), status: 'ok' },
          { id: 4, voltage: randomFloat(3.2, 4.2, 2), temp: randomFloat(20, 50, 1), status: 'ok' }
        ]
      },
      unit: 'mixed',
      timestamp: now,
      metadata: { packId: 'PACK-001', chemistry: 'LiFePO4' }
    },
    {
      sensorId: 'gps-tracker',
      sensorType: 'location',
      value: {
        coordinates: [randomFloat(-90, 90, 6), randomFloat(-180, 180, 6)],
        altitude: randomFloat(0, 1000, 1),
        speed: randomFloat(0, 200, 1),
        heading: randomInt(0, 360),
        satellites: randomInt(6, 14),
        history: [
          { lat: randomFloat(-90, 90, 4), lng: randomFloat(-180, 180, 4), ts: now - 3000, speed: randomFloat(0, 100, 1) },
          { lat: randomFloat(-90, 90, 4), lng: randomFloat(-180, 180, 4), ts: now - 2000, speed: randomFloat(0, 100, 1) },
          { lat: randomFloat(-90, 90, 4), lng: randomFloat(-180, 180, 4), ts: now - 1000, speed: randomFloat(0, 100, 1) }
        ]
      },
      unit: 'mixed',
      timestamp: now,
      metadata: { provider: 'GPS', accuracy: 'high' }
    },
    {
      sensorId: 'obd-pids',
      sensorType: 'diagnostic',
      value: {
        supported: [
          { pid: '01', description: 'Monitor Status', available: true },
          { pid: '05', description: 'Engine Temp', available: true },
          { pid: '0C', description: 'Engine RPM', available: true },
          { pid: '0D', description: 'Vehicle Speed', available: true },
          { pid: '2F', description: 'Fuel Level', available: randomInt(0, 10) > 3 }
        ]
      },
      unit: 'obd',
      timestamp: now
    },
    
    // ═══════════════════════════════════════════════════
    //  7. DADOS PARA GAUGE (com minValue/maxValue definidos)
    // ═══════════════════════════════════════════════════
    {
      sensorId: 'throttle-position',
      sensorType: 'engine',
      value: randomFloat(0, 100, 1),
      unit: '%',
      timestamp: now,
      metadata: { min: 0, max: 100 }
    },
    {
      sensorId: 'engine-load',
      sensorType: 'engine',
      value: randomFloat(0, 100, 1),
      unit: '%',
      timestamp: now,
      metadata: { min: 0, max: 100 }
    },
    
    // ═══════════════════════════════════════════════════
    //  8. ARRAY VAZIO (teste de edge case)
    // ═══════════════════════════════════════════════════
    {
      sensorId: 'active-dtc-list',
      sensorType: 'diagnostic',
      value: randomInt(0, 5) > 3 ? [] : [
        { code: `P${randomInt(100, 999)}`, status: 'pending' },
        { code: `P${randomInt(100, 999)}`, status: 'confirmed' }
      ],
      unit: 'dtc',
      timestamp: now
    }
  ];
}

// ════════════════════════════════════════════════════════
//  CONEXÃO MQTT
// ════════════════════════════════════════════════════════

console.log('╔══════════════════════════════════════════╗');
console.log('║    CAN Data Simulator (MQTT)             ║');
console.log('╚══════════════════════════════════════════╝');
console.log(`📡 Broker: ${MQTT_BROKER}`);
console.log(`👤 User: ${MQTT_USER}`);
console.log(`📡 Tópico: ${MQTT_TOPIC}\n`);

const client = mqtt.connect(MQTT_BROKER, {
  clientId: `simulator_${Math.random().toString(16).substr(2, 8)}`,
  username: MQTT_USER,
  password: MQTT_PASSWORD,
  reconnectPeriod: 3000,
  keepalive: 60,
  clean: true,
  // Se o certificado da EMQX Cloud der erro de validação, descomente a linha abaixo:
  // rejectUnauthorized: false 
});

client.on('connect', () => {
  console.log('✅ Conectado ao broker MQTT com sucesso!\n');
  startSimulation();
});

client.on('error', (err) => {
  console.error('❌ Erro no cliente MQTT:', err.message);
  if (err.message.includes('certificate')) {
    console.log('💡 Dica: Se for erro de certificado, adicione `rejectUnauthorized: false` nas opções do mqtt.connect()');
  }
});

client.on('reconnect', () => {
  console.log('🔄 Reconectando ao broker MQTT...');
});

// ════════════════════════════════════════════════════════
//  LOOP DE SIMULAÇÃO
// ════════════════════════════════════════════════════════

function startSimulation() {
  const interval = 1000; // 1 segundo
  console.log(`🔄 Enviando dados a cada ${interval}ms (Ctrl+C para parar)\n`);
  
  let tick = 0;
  
  setInterval(() => {
    tick++;
    
    // 1. Gerar e publicar dados CAN
    const canPayloads = generateCANPayloads();
    client.publish(MQTT_TOPIC, JSON.stringify(canPayloads), { qos: 1 }, (err) => {
      if (!err && tick % 5 === 0) console.log(`📡 ${canPayloads.length} frames CAN publicados`);
    });

    // 2. Gerar e publicar dados de Sensores
    const sensorPayloads = generateSensorPayloads();
    client.publish(MQTT_TOPIC, JSON.stringify(sensorPayloads), { qos: 1 }, (err) => {
      if (!err && tick % 5 === 0) console.log(`🌡️  ${sensorPayloads.length} leituras de Sensor publicadas`);
    });

    // Limpeza visual do console a cada 10 ticks
    if (tick % 10 === 0) {
      console.log(`   └─ tick #${tick} (Dados fluindo...)`);
    }
  }, interval);
}

// Tratamento de encerramento gracioso
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando simulador...');
  client.end(() => {
    console.log('✅ Conexão MQTT fechada.');
    process.exit(0);
  });
});