async function sendSensors() {
  try {
    const p = JSON.parse(document.getElementById('sensorPayload').value);
    const r = await apiRequest('POST', '/sensors', p);
    showResponse('sensorResponse', r.data, r.success);
    if (r.success) { showToast('✅ Sensores!'); refreshRawData(); }
  } catch (e) { showResponse('sensorResponse', { error: 'JSON inválido: ' + e.message }, false); }
}

async function listSensors() { const r = await apiRequest('GET', '/sensors'); showResponse('sensorResponse', r.data, r.success); }
async function clearSensors() { const r = await apiRequest('DELETE', '/sensors'); showResponse('sensorResponse', r.data, r.success); refreshRawData(); }
