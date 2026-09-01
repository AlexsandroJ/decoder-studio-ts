function showToast(msg, err = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (err ? ' error' : '');
  setTimeout(() => t.className = 'toast', 3000);
}

function showResponse(id, data, ok) {
  const el = document.getElementById(id);
  el.className = 'response-box ' + (ok ? 'success' : 'error');
  el.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
}

function switchTab(ev, name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  ev.target.classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
  if (name === 'analyzer') startAutoRefresh();
  else stopAutoRefresh();
}

async function checkHealth() {
  const r = await apiRequest('GET', '/health');
  if (r.success) showToast(`✅ API online! ${r.data.uptime?.toFixed(1)}s`);
  else showToast('❌ Offline: ' + (r.data.error||''), true);
}

function loadExampleFrame() {
  document.getElementById('canId').value = '0x1A3';
  document.getElementById('hexData').value = 'E8035A0000000000';
  document.getElementById('dlc').value = '8';
  updateFromHex();
  showToast('Exemplo carregado');
}

function randomizeFrame() {
  for (let i = 0; i < 8; i++) state.bytes[i] = Math.floor(Math.random() * 256);
  updateHexInput(); renderBitMatrix();
  showToast('🎲 Frame aleatório');
}

async function sendFrameWithRules() {
  if (!state.rules.length) { showToast('Crie regras primeiro!', true); return; }
  const rp = state.rules.map(r => ({ canId:r.canId, signalName:r.signalName, startBit:r.startBit, bitLength:r.bitLength, byteOrder:r.byteOrder, signed:r.signed, factor:r.factor, offset:r.offset, unit:r.unit }));
  const rr = await apiRequest('POST', '/decoding/rules', rp);
  if (!rr.success) { showToast('Erro regras: ' + (rr.data.error||''), true); return; }
  const fp = { canId: document.getElementById('canId').value, dlc: parseInt(document.getElementById('dlc').value), data: state.bytes.map(b => b.toString(16).toUpperCase().padStart(2,'0')).join(''), timestamp: Date.now() };
  const fr = await apiRequest('POST', '/can/frames', fp);
  if (fr.success) { showToast(`✅ Frame + ${state.rules.length} regras!`); refreshRawData(); refreshAnalyzer(); }
  else showToast('Erro: ' + (fr.data.error||''), true);
}

async function sendFrameOnly() {
  const fp = { canId: document.getElementById('canId').value, dlc: parseInt(document.getElementById('dlc').value), data: state.bytes.map(b => b.toString(16).toUpperCase().padStart(2,'0')).join(''), timestamp: Date.now() };
  const r = await apiRequest('POST', '/can/frames', fp);
  if (r.success) { showToast('✅ Frame enviado!'); refreshRawData(); refreshAnalyzer(); }
  else showToast('Erro: ' + (r.data.error||''), true);
}

window.addEventListener('load', () => {
  initTheme();
  document.getElementById('sensorPayload').value = `{\n  "sensorId": "temp-01",\n  "sensorType": "temperature",\n  "value": 25.5,\n  "unit": "°C",\n  "timestamp": ${Date.now()}\n}`;
  updateFromHex(); renderBitMatrix();
  ['factor','offset','unit','signed','byteOrder'].forEach(id => {
    document.getElementById(id).addEventListener('input', updatePreview);
    document.getElementById(id).addEventListener('change', updatePreview);
  });
  setTimeout(() => loadRulesFromApi(), 300);
});


