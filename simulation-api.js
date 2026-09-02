/**
 * 🚗 Mock CAN Data Generator - 100% Compatível com o Firmware Arduino
 * Execução: node mock-can-data.js
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const API_URL = process.env.API_URL || 'https://localhost:3001/api';
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS || '800', 10);

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const toHexByte = (num) => (num & 0xFF).toString(16).toUpperCase().padStart(2, '0');
const buildHexData = (bytes) => bytes.map(toHexByte).join('');
const formatHexWithSpaces = (hexStr) => hexStr.match(/.{1,2}/g).join(' ');

/**
 * Simulador e Validador exatamente igual ao C++:
 * data[1] << 8 | data[0] -> raw_current / 100.0
 * data[3] << 8 | data[2] -> raw_voltage / 100.0
 * data[4] -> soc_percent
 */
function generateEnergyFrame(canId) {
  const isBms1 = canId === '0x14';
  const suffix = isBms1 ? '_01' : '_02';

  // 1. Corrente: Amperes -> int16_t (ex: -12.34 A -> raw -1234)
  const currentAmp = randomInt(-5000, 5000) / 100;
  const rawCurrentInt16 = Math.round(currentAmp * 100);

  // 2. Tensão: Volts -> uint16_t (ex: 350.25 V -> raw 35025)
  const voltageV = randomInt(30000, 40000) / 100;
  const rawVoltageUint16 = Math.round(voltageV * 100);

  // 3. SOC: uint8_t
  const socPercent = randomInt(0, 100);

  // Extração dos bytes individuais (Little-Endian)
  const data0 = rawCurrentInt16 & 0xFF;         // Current LSB
  const data1 = (rawCurrentInt16 >> 8) & 0xFF;  // Current MSB
  const data2 = rawVoltageUint16 & 0xFF;        // Voltage LSB
  const data3 = (rawVoltageUint16 >> 8) & 0xFF; // Voltage MSB
  const data4 = socPercent;                     // SOC

  const bytes = [data0, data1, data2, data3, data4, 0, 0, 0];

  // ════════════════════════════════════════════════════════
  // SIMULAÇÃO DO CÓDIGO C++ DO ARDUINO PARA VALIDAÇÃO
  // ════════════════════════════════════════════════════════
  // int16_t raw_current = (int16_t)(data[1] << 8 | data[0]);
  const cppRawCurrent = new Int16Array([ (data1 << 8) | data0 ])[0];
  const cppCurrentAmps = (cppRawCurrent / 100.0).toFixed(2);

  // uint16_t raw_voltage = (data[3] << 8 | data[2]);
  const cppRawVoltage = (data3 << 8) | data2;
  const cppVoltageVolts = (cppRawVoltage / 100.0).toFixed(2);

  // uint8_t soc_percent = data[4];
  const cppSocPercent = data4;

  return {
    frame: { canId, dlc: 8, data: buildHexData(bytes), timestamp: Date.now() },
    arduinoValidation: {
      serialOutput: `Bat: ${cppVoltageVolts}V | Corrente: ${cppCurrentAmps}A | SOC: ${cppSocPercent}%`,
      bytesUsed: `data[0]=0x${toHexByte(data0)}, data[1]=0x${toHexByte(data1)}, data[2]=0x${toHexByte(data2)}, data[3]=0x${toHexByte(data3)}, data[4]=0x${toHexByte(data4)}`,
      signals: [
        { signal: `BatteryCurrent${suffix}`, val: `${cppCurrentAmps} A` },
        { signal: `BatteryVoltage${suffix}`, val: `${cppVoltageVolts} V` },
        { signal: `BatterySOC${suffix}`,     val: `${cppSocPercent} %` }
      ]
    }
  };
}

async function sendFrame(frame) {
  try {
    const res = await fetch(`${API_URL}/can/frames`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(frame)
    });
    return res.ok ? { success: true, status: res.status } : { success: false, status: res.status, error: await res.text() };
  } catch (err) {
    return { success: false, error: err.cause?.message || err.message };
  }
}

async function startSimulation() {
  console.clear();
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('🚀 SIMULADOR CAN - VERIFICAÇÃO 100% FIÉL AO ARDUINO');
  console.log('════════════════════════════════════════════════════════════════════════════════');

  const generators = [
    () => generateEnergyFrame('0x14'),
    () => generateEnergyFrame('0x32A')
  ];

  let frameCount = 0;

  while (true) {
    frameCount++;
    const randomGenerator = generators[randomInt(0, generators.length - 1)];
    const { frame, arduinoValidation } = randomGenerator();
    
    const sendResult = await sendFrame(frame);
    const statusTag = sendResult.success ? `\x1b[32m[HTTP ${sendResult.status} OK]\x1b[0m` : `\x1b[31m[ERRO]\x1b[0m`;

    console.log(`\x1b[36m#${frameCount.toString().padStart(4, '0')}\x1b[0m | ID: \x1b[33m${frame.canId.padEnd(6)}\x1b[0m | ${statusTag}`);
    console.log(`   └─ 📦 Bytes CAN : [ \x1b[35m${formatHexWithSpaces(frame.data)}\x1b[0m ]`);
    console.log(`      ├── 🤖 Serial.printf Arduino : "\x1b[32m${arduinoValidation.serialOutput}\x1b[0m"`);
    console.log(`      └── 🔍 Mapeamento             : ${arduinoValidation.bytesUsed}`);
    console.log('─'.repeat(80));

    await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));
  }
}

startSimulation();