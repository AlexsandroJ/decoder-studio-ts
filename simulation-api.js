// ════════════════════════════════════════════════════════
//  SIMULADOR DE DADOS CAN / SENSORES
//  Uso: node simulator.js
// ════════════════════════════════════════════════════════

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

// ════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 2) => 
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

const generateId = () => `sim_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

async function send(endpoint, data) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    return { ok: res.ok, data: json };
  } catch (err) {
    console.error(` Erro em ${endpoint}:`, err.message);
    return { ok: false, error: err.message };
  }
}

// ════════════════════════════════════════════════════════
//  1. REGRAS DE DECODIFICAÇÃO (CAN Signals)
// ═══════════════════════════════════════════════════════
async function sendDecodingRules() {
  console.log('\n📏 Enviando regras de decodificação...');
  
  const rules = [
    {
      id: 'rule_rpm',
      canId: '0x1A3',
      signalName: 'EngineRPM',
      startBit: 0,
      bitLength: 16,
      byteOrder: 'little',
      signed: false,
      factor: 0.25,
      offset: 0,
      unit: 'rpm',
      minValue: 0,
      maxValue: 8000
    },
    {
      id: 'rule_temp',
      canId: '0x1A3',
      signalName: 'EngineTemp',
      startBit: 16,
      bitLength: 16,
      byteOrder: 'little',
      signed: true,
      factor: 0.1,
      offset: -40,
      unit: '°C',
      minValue: -40,
      maxValue: 215
    },
    {
      id: 'rule_speed',
      canId: '0x2B4',
      signalName: 'VehicleSpeed',
      startBit: 0,
      bitLength: 8,
      byteOrder: 'big',
      signed: false,
      factor: 1,
      offset: 0,
      unit: 'km/h',
      minValue: 0,
      maxValue: 255
    },
    {
      id: 'rule_fuel',
      canId: '0x2B4',
      signalName: 'FuelLevel',
      startBit: 8,
      bitLength: 8,
      byteOrder: 'big',
      signed: false,
      factor: 100 / 255,
      offset: 0,
      unit: '%',
      minValue: 0,
      maxValue: 100
    },
    {
      id: 'rule_battery',
      canId: '0x3C5',
      signalName: 'BatteryVoltage',
      startBit: 0,
      bitLength: 16,
      byteOrder: 'little',
      signed: false,
      factor: 0.1,
      offset: 0,
      unit: 'V',
      minValue: 0,
      maxValue: 16
    }
  ];

  const result = await send('/decoding/rules', rules);
  console.log(result.ok ? `✅ ${rules.length} regras enviadas` : '❌ Falha');
  return result.ok;
}

// ════════════════════════════════════════════════════════
//  2. FRAMES CAN (dados hex brutos)
// ════════════════════════════════════════════════════════
function generateCANFrame() {
  // Gera bytes aleatórios que formam valores realistas
  const rpm = randomInt(800, 6500);
  const temp = randomInt(-10, 120);
  const speed = randomInt(0, 180);
  const fuel = randomInt(0, 100);
  const voltage = randomFloat(11.5, 14.8, 1);

  // Codifica em hex (little endian para 0x1A3)
  const rpmHex = Math.round(rpm / 0.25).toString(16).padStart(4, '0');
  const tempHex = Math.round((temp + 40) / 0.1).toString(16).padStart(4, '0');
  const speedHex = speed.toString(16).padStart(2, '0');
  const fuelHex = Math.round(fuel * 255 / 100).toString(16).padStart(2, '0');
  const voltHex = Math.round(voltage / 0.1).toString(16).padStart(4, '0');

  const frames = [
    {
      id: generateId(),
      canId: '0x1A3',
      dlc: 8,
      data: `${rpmHex}${tempHex}00000000`,
      timestamp: Date.now(),
      interface: 'http'
    },
    {
      id: generateId(),
      canId: '0x2B4',
      dlc: 8,
      data: `${speedHex}${fuelHex}00000000`,
      timestamp: Date.now(),
      interface: 'http'
    },
    {
      id: generateId(),
      canId: '0x3C5',
      dlc: 8,
      data: `${voltHex}000000000000`,
      timestamp: Date.now(),
      interface: 'http'
    }
  ];

  return frames;
}

async function sendCANFrames() {
  const frames = generateCANFrame();
  const results = await Promise.all(frames.map(f => send('/can/frames', f)));
  const ok = results.filter(r => r.ok).length;
  console.log(`📡 ${ok}/${frames.length} frames CAN enviados`);
}

// ════════════════════════════════════════════════════════
//  3. SENSORES (incluindo estruturas complexas!)
// ════════════════════════════════════════════════════════
function generateSensors() {
  const now = Date.now();
  
  return [
    // Sensor simples (número)
    {
      id: generateId(),
      sensorId: 'temp-outdoor',
      sensorType: 'temperature',
      value: randomFloat(-10, 45, 1),
      unit: '°C',
      timestamp: now,
      metadata: { location: 'outdoor', zone: 'A' }
    },
    
    // Sensor com valor objeto (para testar FieldExplorer)
    {
      id: generateId(),
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
        load: randomFloat(0, 100, 1)
      },
      unit: 'mixed',
      timestamp: now,
      metadata: {
        ecu: 'ECU-01',
        vin: '1HGBH41JXMN109186',
        location: { building: 'A', floor: 2, room: 'engine-bay' }
      }
    },
    
    // Sensor com array (para testar arrays no explorer)
    {
      id: generateId(),
      sensorId: 'gps-tracker',
      sensorType: 'location',
      value: {
        coordinates: [randomFloat(-90, 90, 6), randomFloat(-180, 180, 6)],
        altitude: randomFloat(0, 1000, 1),
        speed: randomFloat(0, 200, 1),
        satellites: randomInt(6, 14),
        history: [
          { lat: randomFloat(-90, 90, 4), lng: randomFloat(-180, 180, 4), ts: now - 3000 },
          { lat: randomFloat(-90, 90, 4), lng: randomFloat(-180, 180, 4), ts: now - 2000 },
          { lat: randomFloat(-90, 90, 4), lng: randomFloat(-180, 180, 4), ts: now - 1000 }
        ]
      },
      unit: 'mixed',
      timestamp: now,
      metadata: { provider: 'GPS', accuracy: 'high' }
    },
    
    // Sensor booleano/estado
    {
      id: generateId(),
      sensorId: 'door-status',
      sensorType: 'binary',
      value: randomInt(0, 1) === 1,
      unit: 'bool',
      timestamp: now,
      metadata: { zone: 'entrance' }
    },
    
    // Sensor de bateria com estrutura rica
    {
      id: generateId(),
      sensorId: 'battery-pack',
      sensorType: 'battery',
      value: {
        voltage: randomFloat(11.5, 14.8, 2),
        current: randomFloat(-50, 150, 1),
        charge: randomFloat(0, 100, 1),
        health: randomFloat(70, 100, 1),
        temperature: randomFloat(20, 60, 1),
        cells: [
          { id: 1, voltage: randomFloat(3.2, 4.2, 2), temp: randomFloat(20, 50, 1) },
          { id: 2, voltage: randomFloat(3.2, 4.2, 2), temp: randomFloat(20, 50, 1) },
          { id: 3, voltage: randomFloat(3.2, 4.2, 2), temp: randomFloat(20, 50, 1) },
          { id: 4, voltage: randomFloat(3.2, 4.2, 2), temp: randomFloat(20, 50, 1) }
        ]
      },
      unit: 'mixed',
      timestamp: now,
      metadata: { packId: 'PACK-001', chemistry: 'LiFePO4' }
    },
    
    // Sensor de texto/string
    {
      id: generateId(),
      sensorId: 'error-log',
      sensorType: 'diagnostic',
      value: {
        code: `P${randomInt(0, 9)}${randomInt(100, 999)}`,
        message: ['Engine misfire', 'O2 sensor fault', 'Low pressure', 'Normal'][randomInt(0, 3)],
        severity: ['info', 'warning', 'critical'][randomInt(0, 2)],
        count: randomInt(0, 50)
      },
      unit: 'text',
      timestamp: now,
      metadata: { obd: true }
    }
  ];
}

async function sendSensors() {
  const sensors = generateSensors();
  const results = await Promise.all(sensors.map(s => send('/sensors', s)));
  const ok = results.filter(r => r.ok).length;
  console.log(`🌡️  ${ok}/${sensors.length} sensores enviados`);
}

// ════════════════════════════════════════════════════════
//  4. DADOS UNIFIED (merge de CAN + Sensores)
// ════════════════════════════════════════════════════════
async function sendUnified() {
  const record = {
    id: generateId(),
    timestamp: Date.now(),
    source: 'merged',
    canSignals: [
      { ruleId: 'rule_rpm', signalName: 'EngineRPM', value: randomInt(800, 6500), unit: 'rpm', rawHex: '0A2B', timestamp: Date.now() },
      { ruleId: 'rule_temp', signalName: 'EngineTemp', value: randomFloat(70, 120, 1), unit: '°C', rawHex: '03E8', timestamp: Date.now() }
    ],
    sensorReadings: [
      { id: generateId(), sensorId: 'temp-outdoor', sensorType: 'temperature', value: randomFloat(-10, 45, 1), unit: '°C', timestamp: Date.now() }
    ],
    tags: ['engine', 'live', 'simulated']
  };

  const result = await send('/unified', record);
  console.log(result.ok ? ' 1 registro unified enviado' : '❌ Unified falhou');
}

// ════════════════════════════════════════════════════════
//  5. LIMPAR DADOS (útil para testes)
// ═══════════════════════════════════════════════════════
async function clearAll() {
  console.log('\n🗑️  Limpando dados...');
  await Promise.all([
    fetch(`${API_URL}/can/frames`, { method: 'DELETE' }),
    fetch(`${API_URL}/sensors`, { method: 'DELETE' }),
    fetch(`${API_URL}/unified`, { method: 'DELETE' }),
    fetch(`${API_URL}/decoding/rules`, { method: 'DELETE' })
  ]);
  console.log('✅ Dados limpos');
}

// ════════════════════════════════════════════════════════
//  MAIN LOOP
// ════════════════════════════════════════════════════════
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'loop';
  const interval = parseInt(args[1]) || 1000;

  console.log('╔══════════════════════════════════════════╗');
  console.log('║    CAN Data Simulator                  ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`📡 API: ${API_URL}`);
  console.log(`🎯 Modo: ${mode}`);

  // Verifica saúde da API
  try {
    const health = await fetch(`${API_URL}/health`).then(r => r.json());
    console.log(`❤️  API Online (uptime: ${health.uptime?.toFixed(1)}s)\n`);
  } catch {
    console.log('❌ API offline! Verifique se está rodando em ' + API_URL);
    process.exit(1);
  }

  // Envia regras uma única vez
  await sendDecodingRules();

  if (mode === 'clear') {
    await clearAll();
    return;
  }

  if (mode === 'once') {
    console.log('\n Enviando dados únicos...');
    await sendCANFrames();
    await sendSensors();
    await sendUnified();
    console.log('\n✅ Concluído!');
    return;
  }

  // Modo loop contínuo
  console.log(`\n🔄 Enviando dados a cada ${interval}ms (Ctrl+C para parar)\n`);
  
  let tick = 0;
  setInterval(async () => {
    tick++;
    await sendCANFrames();
    await sendSensors();
    
    // Unified a cada 3 ticks para não sobrecarregar
    if (tick % 3 === 0) await sendUnified();
    
    if (tick % 10 === 0) {
      console.log(`   └─ tick #${tick}`);
    }
  }, interval);
}

main().catch(err => {
  console.error('💥 Erro fatal:', err);
  process.exit(1);
});