/**
 * 🚗 Mock CAN Data Generator
 * Simula frames CAN aleatórios baseados na lógica do Arduino
 * para testar a API e o Dashboard em tempo real.
 * 
 * Requerimento: Node.js 18+ (possui fetch nativo)
 * Execução: node mock-can-data.js
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const API_URL = 'https://localhost:3001/api';
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS || '500', 10); // 500ms = 2 frames por segundo

// ════════════════════════════════════════════════════════
//  HELPERS DE CONVERSÃO
// ════════════════════════════════════════════════════════
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Converte número para hex de 2 caracteres (ex: 255 -> "FF", 10 -> "0A")
const toHexByte = (num) => (num & 0xFF).toString(16).toUpperCase().padStart(2, '0');

// Monta string hex de 8 bytes a partir de um array de números
const buildHexData = (bytes) => bytes.map(toHexByte).join('');

// ════════════════════════════════════════════════════════
//  GERADORES DE FRAMES (Baseados no seu código Arduino)
// ════════════════════════════════════════════════════════

// 1. DADOS DE ENERGIA (0x14 ou 0x32A)
function generateEnergyFrame(canId) {
  // Corrente: -50A a 50A -> raw: -5000 a 5000
  let rawCurrent = randomInt(-5000, 5000);
  // Força 16-bit signed (complemento de 2)
  if (rawCurrent < 0) rawCurrent = 65536 + rawCurrent;
  
  // Tensão: 300V a 400V -> raw: 30000 a 40000
  const rawVoltage = randomInt(30000, 40000);
  
  // SOC: 0% a 100%
  const soc = randomInt(0, 100);

  // Layout Arduino: data[1]<<8 | data[0] (Little Endian)
  // data[0] = LSB, data[1] = MSB
  const bytes = [
    rawCurrent & 0xFF,          // data[0]: Current LSB
    (rawCurrent >> 8) & 0xFF,   // data[1]: Current MSB
    rawVoltage & 0xFF,          // data[2]: Voltage LSB
    (rawVoltage >> 8) & 0xFF,   // data[3]: Voltage MSB
    soc,                        // data[4]: SOC
    0, 0, 0                     // data[5-7]: Padding
  ];

  return { canId, dlc: 8, data: buildHexData(bytes), timestamp: Date.now() };
}

// 2. DINÂMICA DO MOTOR (0x6A0)
function generateMotorFrame() {
  const canId = '0x6A0';
  // RPM: 0 a 8000 RPM
  // Fórmula Arduino: raw_rpm = (rpm * 10) + 16000
  const rpm = randomInt(0, 8000);
  const rawRpm = (rpm * 10) + 16000;

  // Layout Arduino: data[4]<<8 | data[5] (Big Endian)
  // data[4] = MSB, data[5] = LSB
  const bytes = [
    0, 0, 0, 0,                 // data[0-3]: Padding
    (rawRpm >> 8) & 0xFF,       // data[4]: RPM MSB
    rawRpm & 0xFF,              // data[5]: RPM LSB
    0, 0                        // data[6-7]: Padding
  ];

  return { canId, dlc: 8, data: buildHexData(bytes), timestamp: Date.now() };
}

// 3. MODO DE CONDUÇÃO (0x6A1)
function generateModeFrame() {
  const canId = '0x6A1';
  // Modo: 1, 2 ou 3. Arduino faz data[0] + 1, então raw é 0, 1 ou 2
  const rawMode = randomInt(0, 2);

  const bytes = [
    rawMode,                    // data[0]: Mode
    0, 0, 0, 0, 0, 0, 0         // data[1-7]: Padding
  ];

  return { canId, dlc: 8, data: buildHexData(bytes), timestamp: Date.now() };
}

// ════════════════════════════════════════════════════════
//  REGRAS DE DECODIFICAÇÃO (Para garantir que a API saiba decodificar)
// ════════════════════════════════════════════════════════
const decodingRules = [
  { canId: "0x14", signalName: "BatteryCurrent", startBit: 0, bitLength: 16, byteOrder: "little", signed: true, factor: 0.01, offset: 0, unit: "A" },
  { canId: "0x14", signalName: "BatteryVoltage", startBit: 16, bitLength: 16, byteOrder: "little", signed: false, factor: 0.01, offset: 0, unit: "V" },
  { canId: "0x14", signalName: "BatterySOC", startBit: 32, bitLength: 8, byteOrder: "big", signed: false, factor: 1, offset: 0, unit: "%" },
  
  { canId: "0x32A", signalName: "BatteryCurrent", startBit: 0, bitLength: 16, byteOrder: "little", signed: true, factor: 0.01, offset: 0, unit: "A" },
  { canId: "0x32A", signalName: "BatteryVoltage", startBit: 16, bitLength: 16, byteOrder: "little", signed: false, factor: 0.01, offset: 0, unit: "V" },
  { canId: "0x32A", signalName: "BatterySOC", startBit: 32, bitLength: 8, byteOrder: "big", signed: false, factor: 1, offset: 0, unit: "%" },

  { canId: "0x6A0", signalName: "MotorRPM", startBit: 39, bitLength: 16, byteOrder: "big", signed: false, factor: 0.1, offset: -1600, unit: "rpm" },
  
  { canId: "0x6A1", signalName: "DriveMode", startBit: 0, bitLength: 8, byteOrder: "big", signed: false, factor: 1, offset: 1, unit: "mode" }
];

// ════════════════════════════════════════════════════════
//  FUNÇÕES DE ENVIO PARA A API
// ════════════════════════════════════════════════════════

async function sendFrame(frame) {
  try {
    const res = await fetch(`${API_URL}/can/frames`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(frame)
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ Erro HTTP ao enviar ${frame.canId} (${res.status}):`, errorText);
    }
  } catch (err) {
    // Mostra o motivo real da falha de rede
    console.error(`❌ FALHA DE REDE em ${frame.canId}:`, err.cause || err.message);
    console.error(`   💡 Dica: Verifique se a API está rodando em ${API_URL}`);
  }
}

// ════════════════════════════════════════════════════════
//  LOOP PRINCIPAL
// ════════════════════════════════════════════════════════
async function startSimulation() {


  console.log(`🚀 Iniciando simulação CAN a cada ${INTERVAL_MS}ms...`);
  console.log(`🌐 API Target: ${API_URL}`);
  console.log('─'.repeat(50));

  const generators = [
    () => generateEnergyFrame('0x14'),
    () => generateEnergyFrame('0x32A'),
    generateMotorFrame,
    generateModeFrame
  ];

  while (true) {
    // Escolhe um gerador aleatório
    const randomGenerator = generators[randomInt(0, generators.length - 1)];
    const frame = randomGenerator();
    
    await sendFrame(frame);

    // Log bonito no console
    const modeNames = ['Eco', 'Normal', 'Sport'];
    let logMsg = `📡 [${frame.canId}] Data: ${frame.data}`;
    
    if (frame.canId === '0x6A1') {
      const modeVal = parseInt(frame.data.substring(0, 2), 16) + 1;
      logMsg += ` | Modo: ${modeNames[modeVal - 1] || 'Unknown'}`;
    } else if (frame.canId === '0x6A0') {
      const rpmRaw = parseInt(frame.data.substring(8, 12), 16);
      const rpm = ((rpmRaw - 16000) / 10).toFixed(1);
      logMsg += ` | RPM: ${rpm}`;
    } else {
      const voltRaw = parseInt(frame.data.substring(4, 8), 16);
      const volt = (voltRaw / 100).toFixed(1);
      logMsg += ` | Volts: ${volt}V`;
    }
    
    console.log(logMsg);

    // Aguarda o próximo intervalo
    await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));
  }
}

// Inicia
startSimulation();