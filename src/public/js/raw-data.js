async function refreshRawData() {
  try {
    showToast('🔄 Carregando dados...');
    const [unifiedRes, sensorsRes] = await Promise.all([
      apiRequest('GET', '/unified?limit=500'),
      apiRequest('GET', '/sensors?limit=500')
    ]);

    const all = [];
    /*
    if (framesRes.success) {
      const frames = framesRes.data.data || framesRes.data || [];
      if (Array.isArray(frames)) {
        frames.forEach(f => {
          all.push({
            _type: 'can-frame', id: f.id, timestamp: f.timestamp || 0,
            source: 'can', canId: f.canId || '—', rawData: f.data || '—',
            dlc: f.dlc, signals: null, sensorReadings: null, _original: f
          });
        });
      }
    }
      */

    if (sensorsRes.success) {
      const sensors = sensorsRes.data.data || sensorsRes.data || [];
      if (Array.isArray(sensors)) {
        sensors.forEach(s => {
          all.push({
            _type: 'sensor', id: s.id, timestamp: s.timestamp || 0,
            source: 'sensor', canId: '—',
            rawData: typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value),
            dlc: null, signals: null, sensorReadings: [s], _original: s
          });
        });
      }
    }

    if (unifiedRes.success) {
      const unified = unifiedRes.data.data || unifiedRes.data || [];
      if (Array.isArray(unified)) {
        unified.forEach(u => {
          let canId = '—';
          if (u.canSignals && u.canSignals.length > 0) {
            const firstRuleId = u.canSignals[0].ruleId;
            const matchedRule = state.rules.find(r => r.id === firstRuleId);
            if (matchedRule) canId = matchedRule.canId;
          }
          all.push({
            _type: 'unified', id: u.id, timestamp: u.timestamp || 0,
            source: u.source || 'can', canId,
            rawData: u.canSignals?.[0]?.rawHex || (u.sensorReadings ? JSON.stringify(u.sensorReadings[0]?.value) : '—'),
            dlc: null, signals: u.canSignals || null, sensorReadings: u.sensorReadings || null, _original: u
          });
        });
      }
    }

    state.rawData = all;
    renderRawData();
    showToast(`✅ ${all.length} registros carregados`);
  } catch (e) { showToast('❌ ' + e.message, true); }
}

function renderRawData() {
  const body = document.getElementById('rawDataBody');
  const srcFilter = document.getElementById('rawDataSource').value;
  const txtFilter = document.getElementById('rawDataFilter').value.toLowerCase();
  const sort = document.getElementById('rawDataSort').value;

  let data = [...state.rawData];
  if (srcFilter !== 'all') data = data.filter(r => r.source === srcFilter);
  if (txtFilter) {
    data = data.filter(r => {
      const hay = [r.canId, r.rawData, r.source,
        ...(r.signals || []).map(s => s.signalName + s.value),
        ...(r.sensorReadings || []).map(s => s.sensorId + s.sensorType + JSON.stringify(s.value))
      ].join(' ').toLowerCase();
      return hay.includes(txtFilter);
    });
  }
  data.sort((a, b) => sort === 'time-desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);

  document.getElementById('statTotal').textContent = state.rawData.length;
  document.getElementById('statCan').textContent = state.rawData.filter(r => r.source === 'can').length;
  document.getElementById('statSensor').textContent = state.rawData.filter(r => r.source === 'sensor').length;
  document.getElementById('statMerged').textContent = state.rawData.filter(r => r.source === 'merged').length;

  if (!data.length) {
    body.innerHTML = `<tr><td colspan="6" class="raw-data-empty">${state.rawData.length ? 'Nenhum resultado para o filtro' : 'Clique em "🔄 Atualizar"'}</td></tr>`;
    return;
  }

  body.innerHTML = data.map(r => {
    const time = r.timestamp
      ? new Date(r.timestamp).toLocaleString('pt-BR', { hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit' }) + '.' + String(r.timestamp % 1000).padStart(3,'0')
      : '—';
    const badge = `<span class="source-badge ${r.source}">${r.source}</span>`;
    const canIdHtml = r.canId !== '—' ? `<span class="can-id-cell">${r.canId}</span>` : '<span style="color:var(--text-dim);">—</span>';
    const rawHtml = r._type === 'sensor' ? `<span style="color:var(--cyan);">${truncate(r.rawData, 24)}</span>` : `<span class="hex-data">${r.rawData}</span>`;

    let chips = '';
    if (r.signals && r.signals.length) {
      chips += r.signals.map(s => `<span class="signal-chip"><span class="name">${s.signalName}:</span><span class="val">${typeof s.value === 'number' ? s.value.toFixed(2) : s.value} ${s.unit||''}</span></span>`).join('');
    }
    if (r.sensorReadings && r.sensorReadings.length) {
      chips += r.sensorReadings.map(s => {
        const v = typeof s.value === 'object' ? JSON.stringify(s.value) : s.value;
        return `<span class="signal-chip"><span class="name">${s.sensorId||s.sensorType}:</span><span class="val">${truncate(String(v), 20)} ${s.unit||''}</span></span>`;
      }).join('');
    }
    if (!chips) {
      if (r._type === 'can-frame') chips = '<span style="color:var(--orange); font-size:11px;">⚠ Sem decodificação</span>';
      else chips = '<span style="color:var(--text-dim);">—</span>';
    }

    return `<tr>
      <td class="timestamp-cell">${time}</td>
      <td>${badge}</td>
      <td>${canIdHtml}</td>
      <td>${rawHtml}</td>
      <td>${chips}</td>
      <td><button class="btn-mini" onclick="showDetail('${r.id}')" title="Detalhes">🔍</button></td>
    </tr>`;
  }).join('');
}

function truncate(str, max) { return str.length > max ? str.substring(0, max) + '…' : str; }

function showDetail(id) {
  const r = state.rawData.find(x => x.id === id);
  if (!r) return;
  const json = JSON.stringify(r._original || r, null, 2);
  document.getElementById('modalContainer').innerHTML = `
    <div class="detail-modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="detail-modal">
        <h3> Detalhes <button class="btn-mini" onclick="closeModal()">✕ Fechar</button></h3>
        <div style="margin-bottom:12px;">
          <span class="source-badge ${r.source}" style="font-size:12px;">${r.source}</span>
          ${r.canId !== '—' ? `<span class="can-id-cell" style="margin-left:10px;">${r.canId}</span>` : ''}
          <span class="timestamp-cell" style="margin-left:10px;">${new Date(r.timestamp).toLocaleString('pt-BR')}</span>
        </div>
        <pre>${escapeHtml(json)}</pre>
      </div>
    </div>`;
}

function closeModal() { document.getElementById('modalContainer').innerHTML = ''; }
function escapeHtml(str) { return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function exportRawData() {
  if (!state.rawData.length) { showToast('Nenhum dado', true); return; }
  const blob = new Blob([JSON.stringify(state.rawData.map(r => r._original || r), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `can-sensor-${Date.now()}.json`;
  a.click();
  showToast(`💾 ${state.rawData.length} registros exportados`);
}
